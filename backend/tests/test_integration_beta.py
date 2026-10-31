"""Closed beta (beta branch) — invite-only signup + first-login password reset.

Accounts are arranged directly in the DB the way scripts/provision_beta_users.py
creates them: verified email, team-issued password, must_reset_password=True.
"""
import uuid

import pytest

from app.config import settings
from app.models.user import User
from app.services.auth import hash_password

pytestmark = pytest.mark.asyncio


@pytest.fixture
def invite_only(monkeypatch):
    monkeypatch.setattr(settings, "invite_only", True)


async def _provision(db, email="beta001@test.scorred", password="TeamIssued1"):
    db.add(User(
        id=uuid.uuid4(), handle=email.split("@")[0], name="Beta", email=email,
        password_hash=hash_password(password), email_verified=True, must_reset_password=True,
    ))
    await db.commit()


async def test_invite_only_blocks_signup_and_social(client, invite_only):
    r = await client.post("/v1/auth/signup", json={"email": "new@test.scorred", "password": "password123"})
    assert r.status_code == 403
    assert "closed beta" in r.json()["detail"]
    assert (await client.post("/v1/auth/oauth/google", json={"credential": "x"})).status_code == 403
    assert (await client.post("/v1/auth/oauth/apple", json={"credential": "x"})).status_code == 403
    providers = (await client.get("/v1/auth/providers")).json()
    assert providers["google"] is False and providers["apple"] is False


async def test_first_login_forces_password_reset(client, db, invite_only):
    await _provision(db)

    login = await client.post("/v1/auth/login", json={"identifier": "beta001@test.scorred", "password": "TeamIssued1"})
    assert login.status_code == 200, login.text
    assert login.json()["must_reset_password"] is True
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    # Locked out of the app until the reset, but /users/me still answers (route guard)
    feed = await client.get("/v1/feed", headers=headers)
    assert feed.status_code == 403
    assert feed.json()["detail"] == "Password reset required"
    me = await client.get("/v1/users/me", headers=headers)
    assert me.status_code == 200 and me.json()["must_reset_password"] is True

    # Re-using the team password or a short one is refused
    same = await client.post("/v1/auth/set-password", json={"new_password": "TeamIssued1"}, headers=headers)
    assert same.status_code == 422
    short = await client.post("/v1/auth/set-password", json={"new_password": "short"}, headers=headers)
    assert short.status_code == 422

    ok = await client.post("/v1/auth/set-password", json={"new_password": "MyOwnPass9"}, headers=headers)
    assert ok.status_code == 204
    assert (await client.get("/v1/feed", headers=headers)).status_code == 200

    # One-shot: the endpoint closes once the flag is cleared
    again = await client.post("/v1/auth/set-password", json={"new_password": "Another99"}, headers=headers)
    assert again.status_code == 400

    # Next sign-in: own password works with no reset prompt, the team one is dead
    old = await client.post("/v1/auth/login", json={"identifier": "beta001", "password": "TeamIssued1"})
    assert old.status_code == 401
    new = await client.post("/v1/auth/login", json={"identifier": "beta001", "password": "MyOwnPass9"})
    assert new.status_code == 200 and new.json()["must_reset_password"] is False


async def test_change_password_also_clears_reset_flag(client, db, invite_only):
    await _provision(db, email="beta002@test.scorred")
    login = await client.post("/v1/auth/login", json={"identifier": "beta002", "password": "TeamIssued1"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    r = await client.post("/v1/auth/change-password", headers=headers,
                          json={"current_password": "TeamIssued1", "new_password": "MyOwnPass9"})
    assert r.status_code == 204
    assert (await client.get("/v1/feed", headers=headers)).status_code == 200


async def test_analytics_groups_tester_team_and_seed(client, db):
    from datetime import datetime, timezone

    await _provision(db, email="tester@test.scorred")
    db.add(User(id=uuid.uuid4(), handle="founder", name="F", email="founder@test.scorred",
                password_hash=hash_password("TeamIssued1"), email_verified=True,
                created_at=datetime(2026, 9, 1, tzinfo=timezone.utc)))  # copied from QA
    db.add(User(id=uuid.uuid4(), handle="seedy", name="S", email="seedy@test.scorred",
                password_hash=hash_password("TeamIssued1"), email_verified=True, is_seed_account=True))
    db.add(User(id=uuid.uuid4(), handle="official", name="O", email="official@test.scorred",
                password_hash=hash_password("TeamIssued1"), email_verified=True,
                is_admin=True, is_seed_account=True))  # staff account
    await db.commit()

    async def flags(ident):
        login = await client.post("/v1/auth/login", json={"identifier": ident, "password": "TeamIssued1"})
        me = (await client.get("/v1/users/me", headers={"Authorization": f"Bearer {login.json()['access_token']}"})).json()
        return me["analytics"], me["analytics_group"]

    assert await flags("tester") == (True, "tester")
    assert await flags("founder") == (True, "team")
    assert await flags("official") == (True, "team")
    assert await flags("seedy") == (False, None)
