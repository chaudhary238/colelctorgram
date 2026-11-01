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
from app.models.event import Event
from app.models.item import Item, ItemPhoto
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
    support = await signup_verified(client, "supportfolk")
    await make_admin(db, "supportfolk", role="support")
    assert (await client.get(f"{C}/queue/database/ANY", headers=support["headers"])).status_code == 403
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


async def _new_db_entry(client, user, title):
    r = await client.post("/v1/items", headers=user["headers"], json={
        "custom_title": title, "category": "figures", "status": "owned",
        "cover_url": "https://img.test/cover.png"})
    assert r.status_code == 201, r.text
    return r.json()


async def test_db_entry_xp_uncapped_and_charged_back_on_reject(client, db):
    """Design v8: "XP earned from a duplicate is reversed". Founder 2026-11-01: no
    guessed daily caps — every new entry earns +50; reject/merge takes it back."""
    maker = await signup_verified(client, "maker1")
    boss = await signup_verified(client, "boss3")
    await make_admin(db, "boss3")

    titles = ["Hot Toys Mandalorian Beskar", "Revoltech Spider Gwen", "Mafex Batman Hush",
              "Figma Link Breath Wild", "Nendoroid Hatsune Miku Snow", "NECA Predator Jungle Hunter",
              "Bandai Gundam RX78 Perfect Grade"]
    made = [await _new_db_entry(client, maker, t) for t in titles]
    assert all(m["db_new_xp"] == 50 for m in made)  # 7 in a day — the old 5/day cap is gone
    u = (await db.execute(select(User).where(User.handle == "maker1"))).scalar_one()
    await db.refresh(u)
    xp_before = u.xp

    sku = made[0]["sku"]
    d = await client.post(f"{C}/decide", headers=boss["headers"], json={
        "queue": "database", "id": sku, "action": "reject", "reason": "Bootleg / KO", "message": "Removed."})
    assert d.status_code == 200, d.text
    assert d.json()["xp_reversed"] == 50
    await db.refresh(u)
    assert u.xp == xp_before - 50
    note = (await db.execute(select(Notification).where(Notification.kind == "moderation"))).scalars().all()
    assert any("+50 XP for this entry has been reversed" in (n.body or "") for n in note)

    # Once only — deciding again can't reverse twice.
    again = await client.post(f"{C}/decide", headers=boss["headers"], json={
        "queue": "database", "id": sku, "action": "reject", "reason": "Bootleg / KO", "message": ""})
    assert again.json()["xp_reversed"] == 0
    await db.refresh(u)
    assert u.xp == xp_before - 50

    # Restoring the entry gives the XP back.
    r = await client.patch(f"/v1/admin/catalogue/{sku}/restore", headers=boss["headers"])
    assert r.status_code == 204, r.text
    await db.refresh(u)
    assert u.xp == xp_before

    # Merge (duplicate) reverses too.
    m = await client.post(f"{C}/decide", headers=boss["headers"], json={
        "queue": "database", "id": made[1]["sku"], "action": "merge", "reason": "Duplicate",
        "message": "", "merge_into": made[2]["sku"]})
    assert m.status_code == 200, m.text
    assert m.json()["xp_reversed"] == 50


async def test_add_testers_creates_reset_required_accounts(client, db):
    boss = await signup_verified(client, "boss4")
    await make_admin(db, "boss4")
    await signup_verified(client, "already")
    taken = (await db.execute(select(User).where(User.handle == "already"))).scalar_one()

    r = await client.post(f"{C}/testers", headers=boss["headers"], json={
        "emails": ["New.Tester@Gmail.com", "new.tester@gmail.com", taken.email, "not-an-email"],
        "password": "Starter@2026"})
    assert r.status_code == 200, r.text
    res = {x["email"]: x for x in r.json()["results"]}
    assert r.json()["created"] == 1 and len(res) == 3  # case-insensitive dedupe
    assert res["new.tester@gmail.com"]["status"] == "created" and res["new.tester@gmail.com"]["handle"] == "newtester"
    assert res[taken.email]["status"] == "exists" and res["not-an-email"]["status"] == "invalid"

    login = await client.post("/v1/auth/login", json={"identifier": "newtester", "password": "Starter@2026"})
    assert login.status_code == 200 and login.json()["must_reset_password"] is True
    audit = (await client.get(f"{C}/audit", headers=boss["headers"])).json()
    assert audit[0]["action"] == "user.add_tester"

    # Catalog-only staff can't add accounts.
    cat = await signup_verified(client, "cat2")
    await make_admin(db, "cat2", role="catalog")
    assert (await client.post(f"{C}/testers", headers=cat["headers"], json={
        "emails": ["x@y.com"], "password": "Starter@2026"})).status_code == 403


async def test_entry_gallery_shows_shared_photos_only(client, db):
    owner = await signup_verified(client, "photoowner")
    boss = await signup_verified(client, "boss9")
    await make_admin(db, "boss9")
    first = await _new_db_entry(client, owner, "Zorblax Prime Deluxe Action Figure")
    second = await client.post("/v1/items", headers=owner["headers"], json={
        "custom_title": "Zorblax Prime Deluxe Action Figure Ver 2", "category": "kits", "status": "owned",
        "cover_url": "https://img.test/other.png"})
    assert second.status_code == 201, second.text
    for query in ("url=https://img.test/shared.png&is_public=true", "url=https://img.test/private.png"):
        r = await client.post(f"/v1/items/{first['id']}/photos?{query}", headers=owner["headers"])
        assert r.status_code in (200, 201), r.text
    sku = first["sku"]

    entry = (await client.get(f"/v1/catalogue/{sku}", headers=owner["headers"])).json()
    assert entry["photos"] == ["https://img.test/cover.png", "https://img.test/shared.png"]

    queue = (await client.get(f"{C}/queue/database", headers=boss["headers"])).json()
    tile = next(q for q in queue if q["id"] == sku)
    assert tile["title"] == "Zorblax Prime Deluxe Action Figure"
    assert "dupes" not in tile and "photos" not in tile  # the slow part loads on open

    row = (await client.get(f"{C}/queue/database/{sku}", headers=boss["headers"])).json()
    assert row["photos"] == entry["photos"]
    other = (await client.get(f"{C}/queue/database/{second.json()['sku']}", headers=boss["headers"])).json()
    dupe = next(d for d in other["dupes"] if d["sku"] == sku)
    assert dupe["photos"] == entry["photos"]  # both sides comparable inline
    assert (await client.get(f"{C}/queue/database/NOPE", headers=boss["headers"])).status_code == 404


async def _official_draft(client, db, handle):
    author = await db.scalar(select(User).where(User.handle == handle))
    post = Post(user_id=author.id, type="discussion", title="Set out 6 Nov", body="Details\nhttps://example.com/set",
                to_feed=True, status="pending", created_at=datetime.now(timezone.utc) - timedelta(days=3))
    db.add(post)
    await db.commit()
    return str(post.id)


async def test_official_draft_stays_hidden_until_approved(client, db):
    owner = await signup_verified(client, "ownerdraft1")
    await make_admin(db, "ownerdraft1")
    viewer = await signup_verified(client, "viewerdraft1")
    pid = await _official_draft(client, db, "ownerdraft1")

    feed = await client.get("/v1/feed", headers=viewer["headers"])
    assert pid not in [p["id"] for p in feed.json()["items"]]
    profile = await client.get("/v1/users/ownerdraft1/posts", headers=viewer["headers"])
    assert pid not in [p["id"] for p in profile.json()["items"]]
    queue = await client.get(f"{C}/queue/posts", headers=owner["headers"])
    assert [p["id"] for p in queue.json()] == [pid]
    assert (await client.get(f"{C}/counts", headers=owner["headers"])).json()["posts"] == 1

    r = await client.post(f"{C}/decide", headers=owner["headers"], json={
        "queue": "posts", "id": pid, "action": "edit", "reason": "Accurate", "post": {
            "title": "Set out 7 Nov", "body": "Details\nhttps://example.com/set",
            "tags": ["NewDrops", "#TCG", " "], "category": "tcg", "images": ["https://example.com/a.jpg"]}})
    assert r.status_code == 200
    db.expire_all()
    post = await db.get(Post, uuid.UUID(pid))
    assert post.tags == ["#NewDrops", "#TCG"] and post.category == "tcg" and post.images == ["https://example.com/a.jpg"]

    feed = (await client.get("/v1/feed?sort=latest", headers=viewer["headers"])).json()["items"]
    assert feed[0]["id"] == pid and feed[0]["title"] == "Set out 7 Nov" and feed[0]["is_official"] is True
    assert (await client.get(f"{C}/queue/posts", headers=owner["headers"])).json() == []
    audit = await db.scalar(select(AdminAction).where(AdminAction.action == "post.edit"))
    assert audit is not None
    again = await client.post(f"{C}/decide", headers=owner["headers"], json={"queue": "posts", "id": pid, "action": "approve"})
    assert again.status_code == 404


async def test_official_draft_reject_and_permissions(client, db):
    owner = await signup_verified(client, "ownerdraft2")
    await make_admin(db, "ownerdraft2")
    drafter = await signup_verified(client, "drafter2")
    await make_admin(db, "drafter2", "catalog")
    pid = await _official_draft(client, db, "drafter2")

    # The posting account can't approve its own drafts.
    assert (await client.get(f"{C}/queue/posts", headers=drafter["headers"])).status_code == 403
    denied = await client.post(f"{C}/decide", headers=drafter["headers"], json={"queue": "posts", "id": pid, "action": "approve"})
    assert denied.status_code == 403

    r = await client.post(f"{C}/decide", headers=owner["headers"], json={"queue": "posts", "id": pid, "action": "reject", "reason": "Date unconfirmed"})
    assert r.status_code == 200
    db.expire_all()
    post = await db.get(Post, uuid.UUID(pid))
    assert post.status == "removed" and post.removed_reason == "Date unconfirmed"


async def test_staff_events_read_listed_by_not_hosted_by(client, db):
    staff = await signup_verified(client, "listerstaff")
    await make_admin(db, "listerstaff")
    member = await signup_verified(client, "listermember")
    starts = datetime.now(timezone.utc) + timedelta(days=10)

    async def host_event(user, title):
        db.add(Event(title=title, host_id=uuid.UUID(user["id"]), status="active", mode="in_person", city="Chennai",
                     is_admin_created=False, starts_at=starts))
        await db.commit()
        event = await db.scalar(select(Event).where(Event.title == title))
        return (await client.get(f"/v1/events/{event.id}", headers=member["headers"])).json()

    assert (await host_event(staff, "Staff listing"))["listed_by_staff"] is True
    assert (await host_event(member, "Member meetup"))["listed_by_staff"] is False


async def test_edit_entry_updates_fields_item_copies_and_photos(client, db):
    boss = await signup_verified(client, "bossedit")
    await make_admin(db, "bossedit")
    owner = await signup_verified(client, "owneredit")
    other = await signup_verified(client, "otheredit")
    sku = "EDIT-1"
    db.add(Catalogue(sku=sku, title="Old Name", norm_title="old name", brand="Old Brand", category="figures",
                     thumbnail_url="https://x/1.jpg", submitted_by=uuid.UUID(owner["id"]), status="live"))
    copy = Item(user_id=uuid.UUID(owner["id"]), sku=sku, custom_title="Old Name", brand="Old Brand", category="figures")
    mine = Item(user_id=uuid.UUID(other["id"]), sku=sku, custom_title="My nickname", brand="My brand", category="figures")
    db.add_all([copy, mine])
    await db.flush()
    db.add_all([ItemPhoto(item_id=copy.id, url="https://x/1.jpg", is_public=True),
                ItemPhoto(item_id=mine.id, url="https://x/2.jpg", is_public=True),
                ItemPhoto(item_id=mine.id, url="https://x/3.jpg", is_public=False)])
    await db.commit()

    detail = (await client.get(f"{C}/queue/database/{sku}", headers=boss["headers"])).json()
    assert detail["photos"] == ["https://x/1.jpg", "https://x/2.jpg"]  # a private photo never shows

    r = await client.post(f"{C}/decide", headers=boss["headers"], json={
        "queue": "database", "id": sku, "action": "edit", "reason": "Accurate", "remove_photos": ["https://x/1.jpg"],
        "entry": {"title": "New Name", "brand": "New Brand", "category": "diecast", "scale": "1:64", "year": "2026",
                  "description": "Fixed", "est_retail_price": 150000}})
    assert r.status_code == 200, r.text

    db.expire_all()
    entry = await db.get(Catalogue, sku)
    assert (entry.title, entry.norm_title, entry.brand, entry.category, entry.scale, entry.year, entry.description,
            entry.est_retail_price, entry.is_verified) == (
        "New Name", "new name", "New Brand", "diecast", "1/64", "2026", "Fixed", 150000, True)
    assert entry.thumbnail_url == "https://x/2.jpg"  # next shared photo takes over the cover

    rows = {i.id: i for i in (await db.execute(select(Item).where(Item.sku == sku))).scalars()}
    assert (rows[copy.id].custom_title, rows[copy.id].brand, rows[copy.id].category) == ("New Name", "New Brand", "diecast")
    assert (rows[mine.id].custom_title, rows[mine.id].brand) == ("My nickname", "My brand")  # a collector's own wording stays

    photos = {p.url: p.is_public for p in (await db.execute(select(ItemPhoto).where(ItemPhoto.item_id == copy.id))).scalars()}
    assert photos == {"https://x/1.jpg": False}  # still on their item, just not on the entry

    audit = await db.scalar(select(AdminAction).where(AdminAction.action == "catalogue.edit"))
    assert audit.meta["photos_removed"] == 1 and {"title", "brand", "cover"} <= set(audit.meta["changed"])

    bad = await client.post(f"{C}/decide", headers=boss["headers"], json={
        "queue": "database", "id": sku, "action": "edit", "entry": {"title": "X", "category": "cars"}})
    assert bad.status_code == 422
