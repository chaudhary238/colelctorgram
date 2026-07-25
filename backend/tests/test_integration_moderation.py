"""T-01 integration — blocks, suspension, admin takedown, toggle idempotency.

Exercises the trust & safety surfaces end-to-end against the real app + Postgres.
"""
import pytest
from sqlalchemy import select

from app.models.user import User
from tests.conftest import signup_verified

pytestmark = pytest.mark.asyncio


async def _make_post(client, headers, body="hello world") -> str:
    r = await client.post("/v1/posts", json={"type": "discussion", "body": body}, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def _feed_ids(client, headers) -> set:
    r = await client.get("/v1/feed", headers=headers)
    assert r.status_code == 200, r.text
    return {p["id"] for p in r.json()["items"]}


# ── B-69 blocks ──────────────────────────────────────────────────────────────

async def test_block_forbids_messaging(client):
    a = await signup_verified(client, "ann")
    b = await signup_verified(client, "ben")

    # ann blocks ben
    blk = await client.post(f"/v1/blocks?target_id={b['id']}", headers=a["headers"])
    assert blk.status_code == 204, blk.text

    # ann can no longer open a thread with ben
    t = await client.post("/v1/threads", json={"other_user_id": b["id"]}, headers=a["headers"])
    assert t.status_code == 403
    # and ben can't message ann either (block is bidirectional)
    t2 = await client.post("/v1/threads", json={"other_user_id": a["id"]}, headers=b["headers"])
    assert t2.status_code == 403


async def test_block_hides_author_from_feed(client):
    a = await signup_verified(client, "dana")
    b = await signup_verified(client, "evan")

    # dana follows evan so his post is definitely in her feed
    f = await client.post(f"/v1/users/{b['handle']}/follow", headers=a["headers"])
    assert f.status_code == 204
    pid = await _make_post(client, b["headers"], "collectible drop")
    assert pid in await _feed_ids(client, a["headers"])  # present before block

    # after blocking, evan's post is filtered out of dana's feed
    await client.post(f"/v1/blocks?target_id={b['id']}", headers=a["headers"])
    assert pid not in await _feed_ids(client, a["headers"])


# ── B-70 suspension ──────────────────────────────────────────────────────────

async def test_suspended_user_is_locked_out(client, db):
    u = await signup_verified(client, "frank")
    # sanity: works before suspension
    assert (await client.get("/v1/feed", headers=u["headers"])).status_code == 200

    # suspend directly in the DB (equivalent to the admin endpoint)
    row = (await db.execute(select(User).where(User.handle == "frank"))).scalar_one()
    row.is_suspended = True
    await db.commit()

    # every authenticated request now 401s (deps.get_current_user_unverified)
    assert (await client.get("/v1/feed", headers=u["headers"])).status_code == 401
    assert (await client.get("/v1/users/me", headers=u["headers"])).status_code == 401


async def test_admin_suspend_endpoint(client, db):
    admin = await signup_verified(client, "boss")
    victim = await signup_verified(client, "spammer")
    # elevate boss to admin
    row = (await db.execute(select(User).where(User.handle == "boss"))).scalar_one()
    row.is_admin = True
    await db.commit()

    s = await client.post(f"/v1/admin/users/{victim['id']}/suspend", headers=admin["headers"])
    assert s.status_code == 204
    # victim is now locked out
    assert (await client.get("/v1/feed", headers=victim["headers"])).status_code == 401
    # unsuspend restores access
    u = await client.post(f"/v1/admin/users/{victim['id']}/unsuspend", headers=admin["headers"])
    assert u.status_code == 204
    assert (await client.get("/v1/feed", headers=victim["headers"])).status_code == 200


async def test_non_admin_cannot_suspend(client):
    a = await signup_verified(client, "nosy")
    b = await signup_verified(client, "target")
    r = await client.post(f"/v1/admin/users/{b['id']}/suspend", headers=a["headers"])
    assert r.status_code == 403


# ── B-70 admin takedown visibility ───────────────────────────────────────────

async def test_admin_post_takedown_hides_from_detail(client, db):
    admin = await signup_verified(client, "mod")
    author = await signup_verified(client, "poster")
    row = (await db.execute(select(User).where(User.handle == "mod"))).scalar_one()
    row.is_admin = True
    await db.commit()

    pid = await _make_post(client, author["headers"], "spammy content")
    assert (await client.get(f"/v1/posts/{pid}", headers=admin["headers"])).status_code == 200

    rm = await client.delete(f"/v1/admin/posts/{pid}?reason=spam+cleanup", headers=admin["headers"])
    assert rm.status_code == 204

    # gone for everyone, including the author
    assert (await client.get(f"/v1/posts/{pid}", headers=admin["headers"])).status_code == 404
    assert (await client.get(f"/v1/posts/{pid}", headers=author["headers"])).status_code == 404
    assert pid not in await _feed_ids(client, admin["headers"])


# ── B-75/B-76 toggle idempotency ─────────────────────────────────────────────

async def test_like_is_idempotent(client):
    author = await signup_verified(client, "artist")
    fan = await signup_verified(client, "fan")
    pid = await _make_post(client, author["headers"], "like me")

    # like twice — a re-tap toggles OFF, not double-counts
    await client.post(f"/v1/posts/{pid}/like", headers=fan["headers"])
    detail = await client.get(f"/v1/posts/{pid}", headers=fan["headers"])
    assert detail.json()["likes_count"] == 1

    await client.post(f"/v1/posts/{pid}/like", headers=fan["headers"])  # unlike
    detail2 = await client.get(f"/v1/posts/{pid}", headers=fan["headers"])
    assert detail2.json()["likes_count"] == 0
