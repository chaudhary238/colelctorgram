"""T-01 integration — admin console endpoints (W-47).

Covers the wired admin surfaces: stats, the enriched report queue (target label +
author id resolution), seed-account listing + seed-post authoring, and the
admin-only guard.
"""
import pytest
from sqlalchemy import select

from app.models.user import User
from tests.conftest import signup_verified

pytestmark = pytest.mark.asyncio


async def _make_admin(client, db, handle):
    u = await signup_verified(client, handle)
    row = (await db.execute(select(User).where(User.handle == handle))).scalar_one()
    row.is_admin = True
    await db.commit()
    return u


async def test_admin_guard_blocks_non_admin(client):
    u = await signup_verified(client, "pleb")
    assert (await client.get("/v1/admin/stats", headers=u["headers"])).status_code == 403


async def test_stats_counts_are_real(client, db):
    admin = await _make_admin(client, db, "chief")
    await signup_verified(client, "member1")
    r = await client.get("/v1/admin/stats", headers=admin["headers"])
    assert r.status_code == 200
    body = r.json()
    # chief + member1 = at least 2 users; keys the dashboard reads exist
    assert body["total_users"] >= 2
    for key in ("posts_today", "active_listings", "pending_reports",
                "pending_communities", "pending_events", "new_users_week"):
        assert key in body


async def test_report_queue_resolves_target_and_author(client, db):
    admin = await _make_admin(client, db, "warden")
    author = await signup_verified(client, "creator")
    reporter = await signup_verified(client, "watcher")

    # author makes a post, reporter reports it
    pr = await client.post("/v1/posts", json={"type": "discussion", "body": "bad post"}, headers=author["headers"])
    pid = pr.json()["id"]
    rep = await client.post("/v1/reports", json={
        "target_type": "post", "target_id": pid, "reason": "spam", "detail": "looks off",
    }, headers=reporter["headers"])
    assert rep.status_code == 204

    q = await client.get("/v1/admin/reports?status=pending", headers=admin["headers"])
    assert q.status_code == 200
    reports = q.json()
    assert len(reports) == 1
    r0 = reports[0]
    assert r0["target_type"] == "post"
    assert r0["target_author_id"] == author["id"]  # so "Suspend user" can act
    assert r0["reporter_handle"] == "watcher"
    assert "creator" in (r0["target_label"] or "")  # human label names the author
    assert r0["target_exists"] is True


async def test_seed_accounts_and_seed_post(client, db):
    admin = await _make_admin(client, db, "seedboss")

    # admin shows up as a valid seed author
    accts = await client.get("/v1/admin/seed-accounts", headers=admin["headers"])
    assert accts.status_code == 200
    handles = {a["handle"] for a in accts.json()}
    assert "seedboss" in handles

    # posting as the admin account lands a real post authored by that account
    sp = await client.post("/v1/admin/seed-post", json={
        "account_handle": "seedboss", "type": "showcase", "category": "figures",
        "body": "Seed showcase to prime the feed",
    }, headers=admin["headers"])
    assert sp.status_code == 201, sp.text
    pid = sp.json()["id"]
    detail = await client.get(f"/v1/posts/{pid}", headers=admin["headers"])
    assert detail.status_code == 200
    assert detail.json()["user_id"] == admin["id"]


async def test_seed_post_rejects_non_seed_account(client, db):
    admin = await _make_admin(client, db, "gate")
    await signup_verified(client, "randomuser")
    r = await client.post("/v1/admin/seed-post", json={
        "account_handle": "randomuser", "type": "showcase", "body": "ghost post",
    }, headers=admin["headers"])
    assert r.status_code == 404  # can't ghost-post as a real (non-seed) user


async def test_user_management_search_and_suspend_filter(client, db):
    admin = await _make_admin(client, db, "super")
    await signup_verified(client, "zoe")
    victim = await signup_verified(client, "zack")

    # search by handle finds the user
    r = await client.get("/v1/admin/users?q=zack", headers=admin["headers"])
    assert r.status_code == 200
    hits = {u["handle"] for u in r.json()}
    assert "zack" in hits and "zoe" not in hits

    # suspend zack, then the suspended filter returns only zack — the whole point
    # of this page: restore a user who was never in the report queue
    await client.post(f"/v1/admin/users/{victim['id']}/suspend", headers=admin["headers"])
    susp = await client.get("/v1/admin/users?suspended=true", headers=admin["headers"])
    handles = {u["handle"]: u for u in susp.json()}
    assert "zack" in handles and handles["zack"]["is_suspended"] is True
    assert "zoe" not in handles

    # unsuspend restores — no longer in the suspended list
    await client.post(f"/v1/admin/users/{victim['id']}/unsuspend", headers=admin["headers"])
    susp2 = await client.get("/v1/admin/users?suspended=true", headers=admin["headers"])
    assert "zack" not in {u["handle"] for u in susp2.json()}


async def test_user_list_requires_admin(client):
    u = await signup_verified(client, "prole")
    assert (await client.get("/v1/admin/users", headers=u["headers"])).status_code == 403
