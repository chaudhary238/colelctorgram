"""Admin console (design "Scorred Admin Console") — queues, decisions, audit,
roles, two-admin bans, timed suspensions, compliance, and beta auto-approval."""
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select, update

from app.config import settings
from app.models.admin import AdminAction
from app.models.catalogue import Catalogue
from app.models.community import Community
from app.models.item import Item
from app.models.notification import Notification
from app.models.post import Post
from app.models.trust import Report
from app.models.user import User
from tests.conftest import signup_verified

pytestmark = pytest.mark.asyncio
C = "/v1/admin/console"


async def make_admin(db, handle, role="owner"):
    await db.execute(update(User).where(User.handle == handle).values(is_admin=True, admin_role=role))
    await db.commit()


async def test_beta_auto_approve_goes_live_and_stays_in_queue(client, db):
    founder = await signup_verified(client, "founder1")
    boss = await signup_verified(client, "boss1")
    await make_admin(db, "boss1")

    r = await client.post("/v1/communities", headers=founder["headers"], json={
        "id": "replica-deals", "name": "Replica Deals", "category": "figures",
        "description": "Best KO prices, DM for list"})
    assert r.status_code in (200, 201), r.text
    assert r.json()["status"] == "approved"  # live at once — no waiting in the beta

    q = (await client.get(f"{C}/queue/communities", headers=boss["headers"])).json()
    assert [c["id"] for c in q] == ["replica-deals"]
    assert q[0]["auto_approved"] is True
    assert any("Keyword match" in f for f in q[0]["flags"])

    d = await client.post(f"{C}/decide", headers=boss["headers"], json={
        "queue": "communities", "id": "replica-deals", "action": "reject",
        "reason": "Promotes counterfeits / replicas", "message": "Not allowed on Scorred."})
    assert d.status_code == 200, d.text
    c = (await db.execute(select(Community).where(Community.id == "replica-deals"))).scalar_one()
    await db.refresh(c)
    assert c.status == "rejected" and c.reviewed_at is not None
    assert (await client.get(f"{C}/queue/communities", headers=boss["headers"])).json() == []
    note = (await db.execute(select(Notification).where(Notification.kind == "moderation"))).scalars().all()
    assert any(n.body == "Not allowed on Scorred." for n in note)
    audit = (await client.get(f"{C}/audit", headers=boss["headers"])).json()
    assert audit[0]["action"] == "community.reject" and audit[0]["why"] == "Promotes counterfeits / replicas"


async def test_pre_approval_when_auto_approve_off(client, db, monkeypatch):
    monkeypatch.setattr(settings, "beta_auto_approve", False)
    founder = await signup_verified(client, "founder2")
    r = await client.post("/v1/communities", headers=founder["headers"], json={
        "id": "gunpla-south", "name": "Gunpla South", "category": "kits"})
    assert r.json()["status"] == "pending"


async def test_reports_group_priority_remove_strike_and_reporter_outcome(client, db):
    author = await signup_verified(client, "seller1")
    r1 = await signup_verified(client, "rep1")
    r2 = await signup_verified(client, "rep2")
    boss = await signup_verified(client, "boss2")
    await make_admin(db, "boss2")
    post = Post(id=uuid.uuid4(), user_id=uuid.UUID(author["id"]), type="showcase", body="Sealed MMS601, UPI only")
    db.add(post)
    await db.commit()

    for who, reason in ((r1, "counterfeit"), (r2, "scam")):
        rr = await client.post("/v1/reports", headers=who["headers"], json={
            "target_type": "post", "target_id": str(post.id), "reason": reason, "detail": "stock photos"})
        assert rr.status_code == 204, rr.text

    q = (await client.get(f"{C}/queue/reports", headers=boss["headers"])).json()
    assert len(q) == 1 and q[0]["count"] == 2 and q[0]["priority"] == "High"
    assert q[0]["user"] == "seller1" and "Sealed MMS601" in q[0]["snap"]

    d = await client.post(f"{C}/decide", headers=boss["headers"], json={
        "queue": "reports", "id": q[0]["id"], "action": "remove", "reason": "Counterfeit / replica",
        "message": "Your post was removed.", "strike": True})
    assert d.status_code == 200, d.text
    await db.refresh(post)
    assert post.status == "removed"
    u = await db.get(User, uuid.UUID(author["id"]))
    await db.refresh(u)
    assert u.strikes == 1
    reps = (await db.execute(select(Report))).scalars().all()
    assert {r.status for r in reps} == {"actioned"} and all(r.resolved_at for r in reps)
    outcomes = (await db.execute(select(Notification).where(Notification.kind == "report_outcome"))).scalars().all()
    assert len(outcomes) == 2
    ov = (await client.get(f"{C}/overview", headers=boss["headers"])).json()
    assert ov["recent"][0]["action"] == "report.remove"


async def test_timed_suspension_lifts_itself(client, db):
    user = await signup_verified(client, "naughty")
    boss = await signup_verified(client, "boss3")
    await make_admin(db, "boss3")
    r = await client.post(f"{C}/users/{user['id']}/action", headers=boss["headers"],
                          json={"action": "suspend", "days": 1, "reason": "Spam"})
    assert r.status_code == 200, r.text
    login = await client.post("/v1/auth/login", json={"identifier": "naughty", "password": "password123"})
    assert login.status_code == 403 and "suspended until" in login.json()["detail"]

    await db.execute(update(User).where(User.handle == "naughty").values(
        suspended_until=datetime.now(timezone.utc) - timedelta(minutes=1)))
    await db.commit()
    login = await client.post("/v1/auth/login", json={"identifier": "naughty", "password": "password123"})
    assert login.status_code == 200


async def test_ban_needs_a_second_admin(client, db):
    target = await signup_verified(client, "scammer")
    a1 = await signup_verified(client, "boss4")
    a2 = await signup_verified(client, "boss5")
    await make_admin(db, "boss4")
    await make_admin(db, "boss5", role="moderator")
    url = f"{C}/users/{target['id']}/action"
    first = await client.post(url, headers=a1["headers"], json={"action": "ban", "reason": "Scam"})
    assert first.json()["result"].startswith("ban requested")
    again = await client.post(url, headers=a1["headers"], json={"action": "ban", "reason": "Scam"})
    assert again.status_code == 400
    second = await client.post(url, headers=a2["headers"], json={"action": "ban", "reason": "Scam"})
    assert second.json()["result"] == "banned"
    login = await client.post("/v1/auth/login", json={"identifier": "scammer", "password": "password123"})
    assert login.status_code == 403 and "banned" in login.json()["detail"]


async def test_roles_limit_access(client, db):
    cat = await signup_verified(client, "catalogfolk")
    await make_admin(db, "catalogfolk", role="catalog")
    assert (await client.get(f"{C}/queue/reports", headers=cat["headers"])).status_code == 403
    assert (await client.get(f"{C}/queue/database", headers=cat["headers"])).status_code == 200
    assert (await client.post(f"{C}/team", headers=cat["headers"], json={"handle": "catalogfolk", "role": "owner"})).status_code == 403


async def test_data_request_delete_anonymizes(client, db):
    user = await signup_verified(client, "leaver")
    boss = await signup_verified(client, "boss6")
    await make_admin(db, "boss6")
    r = await client.post("/v1/account/data-requests", headers=user["headers"], json={"kind": "delete"})
    assert r.status_code == 201
    reqs = (await client.get(f"{C}/data-requests", headers=boss["headers"])).json()
    assert reqs[0]["user"] == "leaver" and reqs[0]["kind"] == "delete"
    exp = await client.get(f"{C}/data-requests/{reqs[0]['id']}/export", headers=boss["headers"])
    assert exp.status_code == 200 and exp.json()["profile"]["handle"] == "leaver"
    done = await client.post(f"{C}/data-requests/{reqs[0]['id']}/complete", headers=boss["headers"],
                             json={"action": "delete"})
    assert done.status_code == 200, done.text
    u = await db.get(User, uuid.UUID(user["id"]))
    await db.refresh(u)
    assert u.handle.startswith("deleted-") and u.email.endswith("@scorred.invalid") and u.password_hash is None
    assert (await client.post("/v1/auth/login", json={"identifier": "leaver", "password": "password123"})).status_code == 401


async def test_appeal_reverse_lifts_suspension(client, db):
    user = await signup_verified(client, "appealer")
    boss = await signup_verified(client, "boss7")
    await make_admin(db, "boss7")
    # Appeal first (a suspended account can't reach the API), then get suspended.
    a = await client.post("/v1/account/appeals", headers=user["headers"], json={
        "kind": "appeal", "about": "Warning · Spam", "text": "I was only sharing a deal, sorry."})
    assert a.status_code == 201
    await client.post(f"{C}/users/{user['id']}/action", headers=boss["headers"], json={"action": "suspend", "days": 7})
    ap = (await client.get(f"{C}/appeals", headers=boss["headers"])).json()
    d = await client.post(f"{C}/decide", headers=boss["headers"], json={
        "queue": "appeals", "id": ap[0]["id"], "action": "reverse", "reason": "Decision reversed",
        "message": "We reversed the decision."})
    assert d.status_code == 200, d.text
    u = await db.get(User, uuid.UUID(user["id"]))
    await db.refresh(u)
    assert u.is_suspended is False and u.strikes == 0


async def test_underpriced_listing_auto_flags(client, db):
    seller = await signup_verified(client, "cheapo")
    boss = await signup_verified(client, "boss8")
    await make_admin(db, "boss8")
    db.add(Catalogue(sku="BB-KAWS-1000", title="Bearbrick Kaws 1000%", norm_title="bearbrick kaws 1000",
                     brand="Medicom", category="designer", est_retail_price=180_000_00))
    item = Item(id=uuid.uuid4(), user_id=uuid.UUID(seller["id"]), sku="BB-KAWS-1000", status="owned")
    db.add(item)
    await db.commit()
    r = await client.post("/v1/listings", headers=seller["headers"], json={
        "item_id": str(item.id), "price": 45_000_00, "currency": "INR", "condition": "sealed"})
    assert r.status_code == 201, r.text
    q = (await client.get(f"{C}/queue/reports", headers=boss["headers"])).json()
    assert len(q) == 1 and q[0]["source"] == "System" and q[0]["reason"] == "price_anomaly"


async def test_announcement_reaches_audience(client, db):
    boss = await signup_verified(client, "boss9")
    await make_admin(db, "boss9")
    await signup_verified(client, "tester1")
    r = await client.post(f"{C}/announcements", headers=boss["headers"], json={
        "audience": "testers", "channels": ["in_app"], "title": "New: reminders", "body": "Pre-order reminders are live."})
    assert r.status_code == 201, r.text
    assert r.json()["recipients"] >= 1  # tester1 (created today ≥ cohort start); staff excluded
    n = (await db.execute(select(Notification).where(Notification.kind == "announcement"))).scalars().all()
    assert n and all(x.title == "New: reminders" for x in n)
    assert (await db.execute(select(AdminAction).where(AdminAction.action == "announce.send"))).scalar_one()
