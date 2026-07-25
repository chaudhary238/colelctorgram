"""T-01 integration — signup → verify → login, and the verification gate.

Drives the real /v1/auth routes over the ASGI client + test Postgres (conftest).
"""
import pytest

pytestmark = pytest.mark.asyncio


async def test_signup_then_verify_then_login(client):
    # signup returns tokens + the dev OTP
    r = await client.post("/v1/auth/signup", json={
        "handle": "alice", "name": "Alice", "email": "alice@test.scorred", "password": "password123",
    })
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["access_token"] and body["debug_otp"]
    headers = {"Authorization": f"Bearer {body['access_token']}"}

    # BEFORE verifying, a protected route 403s (email verification gate, B-72)
    feed = await client.get("/v1/feed", headers=headers)
    assert feed.status_code == 403
    assert "verif" in feed.json()["detail"].lower()

    # verify with the OTP → protected route now works
    v = await client.post("/v1/auth/verify-email", json={"code": body["debug_otp"]}, headers=headers)
    assert v.status_code == 204
    feed2 = await client.get("/v1/feed", headers=headers)
    assert feed2.status_code == 200

    # login with the same credentials succeeds
    login = await client.post("/v1/auth/login", json={"identifier": "alice", "password": "password123"})
    assert login.status_code == 200
    assert login.json()["access_token"]


async def test_login_wrong_password_401(client):
    await client.post("/v1/auth/signup", json={
        "handle": "bob", "name": "Bob", "email": "bob@test.scorred", "password": "password123",
    })
    r = await client.post("/v1/auth/login", json={"identifier": "bob", "password": "wrongpass1"})
    assert r.status_code == 401


async def test_duplicate_handle_rejected(client):
    payload = {"handle": "carol", "name": "Carol", "email": "carol@test.scorred", "password": "password123"}
    r1 = await client.post("/v1/auth/signup", json=payload)
    assert r1.status_code == 201
    r2 = await client.post("/v1/auth/signup", json={**payload, "email": "other@test.scorred"})
    assert r2.status_code == 400
