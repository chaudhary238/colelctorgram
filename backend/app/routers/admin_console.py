"""Admin console API (design "Scorred Admin Console") — mounted at /admin/console.

Queues (communities, events, database entries, reports, appeals) all decide
through one POST /decide so the console's decision modal stays generic. Every
decision writes the audit log (services/moderation.log_action), optionally
notifies the affected user (kind="moderation") and, for reports, the reporters
(kind="report_outcome"). Role permissions follow the design's matrix
(services/moderation.ROLE_PERMS).

Also here: the user-facing side of compliance — /account/appeals and
/account/data-requests — since the console is their only consumer.
"""
import json
import re
import secrets
import statistics
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, or_, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_admin, get_current_user
from app.models.admin import AdminAction, Announcement, Appeal, DataRequest
from app.models.catalogue import Catalogue, CatalogueComment, CatalogueRating
from app.models.community import Community
from app.models.deal import Vouch
from app.models.event import Event
from app.models.gamification import XpEvent
from app.models.item import Item, ItemPhoto
from app.models.listing import Listing
from app.models.notification import Notification
from app.models.post import Comment, Post
from app.models.search import SavedSearch
from app.models.thread import Message
from app.models.trust import Report, UserBlock
from app.models.user import Follow, User
from app.services.auth import create_reset_token, hash_password
from app.services.catalogue import norm_title
from app.services.email import send_email, send_password_reset_email
from app.services.gamification import FIRST_START, _emit_rank_up, reverse_xp, tier_index_of
from app.services.moderation import (
    PRIORITY_ORDER, REASON_LABEL, ROLE_PERMS, ROLES, SLA_HOURS, account_status, catalogue_dupes,
    catalogue_flags, community_flags, event_flags, log_action, priority_of, require_perm, role_of,
)
from app.services.notifications import notify

router = APIRouter(prefix="/admin/console", tags=["admin-console"])
account_router = APIRouter(prefix="/account", tags=["account"])

APPROVAL_SLA_H = 48
GRIEVANCE_ACK_H = 24
DATA_DUE_DAYS = 30


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _age_h(ts: datetime | None) -> int:
    return int((_now() - ts).total_seconds() // 3600) if ts else 0


def _inr(paise: int | None) -> str:
    return f"₹{(paise or 0) // 100:,}" if paise else "—"


def _badges(u: User) -> list[str]:
    b = FIRST_START.get(u.first_start_badge or "")
    return [b["name"]] if b else []


def _group(u: User) -> str:
    if u.is_admin:
        return "Team"
    if u.is_seed_account:
        return "Seed"
    if u.created_at and u.created_at.date() >= settings.analytics_cohort_start:
        return "Tester"
    return "Team"  # founders / QA accounts copied from QA


async def _users_by_id(db: AsyncSession, ids) -> dict:
    ids = {i for i in ids if i}
    if not ids:
        return {}
    return {u.id: u for u in (await db.execute(select(User).where(User.id.in_(ids)))).scalars()}


async def _reports_against(db: AsyncSession, ids: list) -> dict:
    """{user_id: reports about the account or anything it authored}."""
    if not ids:
        return {}
    rows = await db.execute(text("""
        WITH r AS (
          SELECT target_id AS uid FROM reports WHERE target_type = 'user'
          UNION ALL SELECT p.user_id FROM reports r JOIN posts p ON r.target_type = 'post' AND r.target_id = p.id
          UNION ALL SELECT l.seller_id FROM reports r JOIN listings l ON r.target_type = 'listing' AND r.target_id = l.id
          UNION ALL SELECT c.user_id FROM reports r JOIN comments c ON r.target_type = 'comment' AND r.target_id = c.id
          UNION ALL SELECT m.sender_id FROM reports r JOIN messages m ON r.target_type = 'message' AND r.target_id = m.id
        ) SELECT uid, count(*) AS n FROM r WHERE uid = ANY(:ids) GROUP BY uid
    """), {"ids": list(ids)})
    return {r.uid: r.n for r in rows}


async def _moderation_notice(db: AsyncSession, user_id, title: str, body: str,
                             ref_type: str | None = None, ref_id: str | None = None) -> None:
    if body:
        await notify(db, user_id=user_id, kind="moderation", title=title, body=body,
                     ref_type=ref_type, ref_id=ref_id)


# ── Me + counts + overview ───────────────────────────────────────────────────
@router.get("/me")
async def console_me(admin: User = Depends(get_current_admin)):
    role = role_of(admin)
    return {"id": str(admin.id), "name": admin.name, "handle": admin.handle, "role": role,
            "perms": sorted(ROLE_PERMS[role]), "beta_auto_approve": settings.beta_auto_approve}


def _queue_filter(model, pending_status: str, live_status: str):
    """Pending items, plus beta auto-approved items no admin has looked at yet."""
    return or_(model.status == pending_status,
               (model.auto_approved.is_(True)) & (model.reviewed_at.is_(None)) & (model.status == live_status))


async def _report_groups(db: AsyncSession) -> list[dict]:
    rows = (await db.execute(select(Report).where(Report.status == "pending")
                             .order_by(Report.created_at))).scalars().all()
    groups: dict[str, dict] = {}
    for r in rows:
        key = f"{r.target_type}:{r.target_id or r.target_ref}"
        g = groups.setdefault(key, {"id": key, "target_type": r.target_type,
                                    "target_id": str(r.target_id) if r.target_id else None,
                                    "target_ref": r.target_ref, "reports": []})
        g["reports"].append(r)
    for g in groups.values():
        reasons = [r.reason for r in g["reports"]]
        top = min(reasons, key=lambda x: PRIORITY_ORDER[priority_of(x)])
        g["reason"] = top
        g["priority"] = priority_of(top)
        g["age_h"] = _age_h(g["reports"][0].created_at)
        g["source"] = "System" if all(r.source == "system" for r in g["reports"]) else "Users"
    return list(groups.values())


async def _counts(db: AsyncSession) -> dict:
    c = await db.scalar(select(func.count()).select_from(Community).where(_queue_filter(Community, "pending", "approved")))
    e = await db.scalar(select(func.count()).select_from(Event).where(_queue_filter(Event, "pending_approval", "active")))
    d = await db.scalar(select(func.count()).select_from(Catalogue).where(
        Catalogue.is_verified.is_(False), Catalogue.status == "live", Catalogue.submitted_by.is_not(None)))
    a = await db.scalar(select(func.count()).select_from(Appeal).where(Appeal.status == "open"))
    q = await db.scalar(select(func.count()).select_from(DataRequest).where(DataRequest.status == "open"))
    groups = await _report_groups(db)
    return {"communities": c or 0, "events": e or 0, "database": d or 0, "reports": len(groups),
            "reports_high": sum(1 for g in groups if g["priority"] == "High"),
            "appeals": a or 0, "data": q or 0, "_groups": groups}


@router.get("/counts")
async def console_counts(db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    c = await _counts(db)
    c.pop("_groups")
    return c


def _action_out(a: AdminAction, actors: dict) -> dict:
    who = actors.get(a.actor_id)
    return {"id": str(a.id), "t": a.created_at.isoformat() if a.created_at else None,
            "who": who.name if who else "System", "action": a.action, "target_type": a.target_type,
            "obj": a.target_label, "why": a.reason, "note": a.note, "meta": a.meta}


@router.get("/overview")
async def console_overview(db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    counts = await _counts(db)
    groups = counts.pop("_groups")
    stale = _now() - timedelta(hours=APPROVAL_SLA_H)
    overdue = sum(1 for g in groups if g["age_h"] >= SLA_HOURS[g["priority"]])
    overdue += await db.scalar(select(func.count()).select_from(Community).where(
        Community.status == "pending", Community.created_at < stale)) or 0
    overdue += await db.scalar(select(func.count()).select_from(Event).where(
        Event.status == "pending_approval", Event.created_at < stale)) or 0
    overdue += await db.scalar(select(func.count()).select_from(Appeal).where(
        Appeal.status == "open", Appeal.created_at < _now() - timedelta(hours=GRIEVANCE_ACK_H))) or 0

    week = _now() - timedelta(days=7)
    acts = (await db.execute(select(AdminAction).where(AdminAction.created_at >= week))).scalars().all()
    kinds = [a.action for a in acts]
    rep = [k for k in kinds if k.startswith("report.")]
    resolved = (await db.execute(select(Report.created_at, Report.resolved_at).where(
        Report.resolved_at >= week))).all()
    med = statistics.median([(r.resolved_at - r.created_at).total_seconds() / 3600 for r in resolved]) if resolved else None
    appeals_done = [k for k in kinds if k.startswith("appeal.")]
    week_stats = [
        ["Reports resolved", str(len(rep))],
        ["Median time to resolve", f"{med:.0f} h" if med is not None else "—"],
        ["Approvals decided", str(sum(1 for k in kinds if k.split(".")[0] in ("community", "event", "catalogue")))],
        ["Reports dismissed", f"{round(100 * rep.count('report.dismiss') / len(rep))}%" if rep else "—"],
        ["Users suspended", str(sum(1 for k in kinds if k in ("report.suspend", "user.suspend")))],
        ["Appeals reversed", f"{sum(1 for k in appeals_done if k != 'appeal.uphold')} of {len(appeals_done)}" if appeals_done else "—"],
    ]
    recent = (await db.execute(select(AdminAction).order_by(AdminAction.created_at.desc()).limit(6))).scalars().all()
    actors = await _users_by_id(db, [a.actor_id for a in recent])
    dupes = 0
    for entry in (await db.execute(select(Catalogue).where(
            Catalogue.is_verified.is_(False), Catalogue.status == "live",
            Catalogue.submitted_by.is_not(None)).limit(50))).scalars():
        dupes += bool(await catalogue_dupes(db, entry, limit=1))
    return {"counts": counts, "overdue": overdue, "database_dupes": dupes, "week": week_stats,
            "recent": [_action_out(a, actors) for a in recent]}


# ── Queues ───────────────────────────────────────────────────────────────────
@router.get("/queue/communities")
async def queue_communities(db: AsyncSession = Depends(get_db), _=Depends(require_perm("approve"))):
    rows = (await db.execute(select(Community).where(_queue_filter(Community, "pending", "approved"))
                             .order_by(Community.created_at))).scalars().all()
    founders = await _users_by_id(db, [c.founder_id for c in rows])
    out = []
    for c in rows:
        f = founders.get(c.founder_id)
        out.append({
            "id": c.id, "name": c.name, "handle": f.handle if f else "?", "by": f.name if f else "?",
            "privacy": "Private (invite only)" if c.is_invite_only else "Public",
            "posting": {"open": "Anyone can post", "approval": "Admin-approved posts"}.get(c.post_mode, c.post_mode or "—"),
            "category": c.category, "desc": c.description or c.short_desc or "", "rules": c.rules or [],
            "age_h": _age_h(c.created_at), "auto_approved": c.auto_approved, "status": c.status,
            "flags": await community_flags(db, c, f),
        })
    return out


@router.get("/queue/events")
async def queue_events(db: AsyncSession = Depends(get_db), _=Depends(require_perm("approve"))):
    rows = (await db.execute(select(Event).where(_queue_filter(Event, "pending_approval", "active"))
                             .order_by(Event.created_at))).scalars().all()
    hosts = await _users_by_id(db, [e.host_id for e in rows])
    comm_ids = {e.community_id for e in rows if e.community_id}
    comms = {c.id: c.name for c in (await db.execute(select(Community).where(Community.id.in_(comm_ids)))).scalars()} if comm_ids else {}
    out = []
    for e in rows:
        h = hosts.get(e.host_id)
        out.append({
            "id": str(e.id), "title": e.title, "handle": h.handle if h else "?", "host": h.name if h else "?",
            "starts_at": e.starts_at.isoformat() if e.starts_at else None,
            "ends_at": e.ends_at.isoformat() if e.ends_at else None,
            "mode": e.mode, "venue": e.venue or e.address or (e.online_url if e.mode == "online" else None),
            "city": e.city, "pricing": "Free" if e.is_free else f"Paid · {e.currency} {e.price / 100:,.0f}",
            "ticket": e.ticket_url, "contact": e.contact, "community": comms.get(e.community_id),
            "desc": e.description or "", "age_h": _age_h(e.created_at),
            "auto_approved": e.auto_approved, "status": e.status, "flags": event_flags(e, h),
        })
    return out


@router.get("/queue/database")
async def queue_database(db: AsyncSession = Depends(get_db), _=Depends(require_perm("catalogue"))):
    rows = (await db.execute(select(Catalogue).where(
        Catalogue.is_verified.is_(False), Catalogue.status == "live", Catalogue.submitted_by.is_not(None))
        .order_by(Catalogue.created_at))).scalars().all()
    subs = await _users_by_id(db, [c.submitted_by for c in rows])
    out = []
    for c in rows:
        photos = (await db.execute(select(ItemPhoto.url).join(Item, Item.id == ItemPhoto.item_id).where(
            Item.sku == c.sku, ItemPhoto.is_public.is_(True)).limit(6))).scalars().all()
        photos = ([c.thumbnail_url] if c.thumbnail_url else []) + [p for p in photos if p != c.thumbnail_url]
        s = subs.get(c.submitted_by)
        out.append({
            "id": c.sku, "title": c.title, "brand": c.brand, "category": c.category, "scale": c.scale,
            "year": c.year, "value": _inr(c.est_retail_price), "desc": c.description or "",
            "handle": s.handle if s else "?", "by": s.name if s else "?", "photos": photos[:6],
            "age_h": _age_h(c.created_at), "dupes": await catalogue_dupes(db, c),
            "flags": catalogue_flags(c, len(photos)),
        })
    return out


async def _resolve_group(db: AsyncSession, g: dict) -> dict:
    """Label, content snapshot and author for a report group's target."""
    t, tid = g["target_type"], g["target_id"]
    label, snap, author, exists, removable = g.get("target_ref") or "—", "", None, True, False
    if t == "post" and tid:
        p = await db.get(Post, uuid.UUID(tid))
        if p:
            author, exists, removable = p.user_id, p.status != "removed", True
            label, snap = f"{p.type.title()} post", (p.title + " — " if p.title else "") + (p.body or "")
    elif t == "listing" and tid:
        lst = await db.get(Listing, uuid.UUID(tid))
        if lst:
            author, exists, removable = lst.seller_id, lst.status != "removed", True
            title = await db.scalar(select(Catalogue.title).where(Catalogue.sku == lst.sku)) if lst.sku else None
            label = f"{title or lst.sku or 'Listing'} — {_inr(lst.price) if lst.currency == 'INR' else f'{lst.currency} {lst.price / 100:,.0f}'}"
            snap = lst.notes or lst.condition_notes or ""
    elif t == "comment" and tid:
        c = await db.get(Comment, uuid.UUID(tid))
        if c:
            author, exists, removable = c.user_id, not c.is_removed, True
            label, snap = "Comment", c.body
    elif t == "message" and tid:
        m = await db.get(Message, uuid.UUID(tid))
        if m:
            author, label, snap = m.sender_id, "Direct message", m.body or ""
    elif t == "user" and tid:
        author = uuid.UUID(tid)
    elif t == "catalogue":
        c = await db.scalar(select(Catalogue).where(Catalogue.sku == g.get("target_ref")))
        if c:
            author, exists, removable = c.submitted_by, c.status == "live", True
            label, snap = f"Database entry · {c.title}", c.description or ""
    u = await db.get(User, author) if author else None
    if t == "user":
        label = f"@{u.handle}" if u else "Unknown user"
        snap = (u.bio or "") if u else ""
        exists = bool(u) and not u.is_suspended
    elif u and t != "catalogue":
        label = f"{label} by @{u.handle}"
    return {"label": label, "snap": snap[:600], "author": u, "exists": exists, "removable": removable}


@router.get("/queue/reports")
async def queue_reports(db: AsyncSession = Depends(get_db), _=Depends(require_perm("reports"))):
    groups = await _report_groups(db)
    reporters = await _users_by_id(db, [r.reporter_id for g in groups for r in g["reports"]])
    authors: list = []
    out = []
    for g in groups:
        res = await _resolve_group(db, g)
        a = res["author"]
        if a:
            authors.append(a.id)
        out.append({
            "id": g["id"], "type": g["target_type"], "target": res["label"], "snap": res["snap"],
            "exists": res["exists"], "removable": res["removable"],
            "user": a.handle if a else None, "user_id": str(a.id) if a else None,
            "reason": g["reason"], "reason_label": REASON_LABEL.get(g["reason"], g["reason"]),
            "reasons": sorted({REASON_LABEL.get(r.reason, r.reason) for r in g["reports"]}),
            "count": len(g["reports"]), "priority": g["priority"], "age_h": g["age_h"], "source": g["source"],
            "notes": [{"by": (reporters[r.reporter_id].handle if r.reporter_id in reporters else "System"),
                       "text": r.notes} for r in g["reports"] if r.notes],
            "history": {"strikes": a.strikes if a else 0, "reports": 0,
                        "age_days": (_now() - a.created_at).days if a and a.created_at else None},
        })
    counts = await _reports_against(db, authors)
    for o in out:
        if o["user_id"]:
            o["history"]["reports"] = counts.get(uuid.UUID(o["user_id"]), 0)
    out.sort(key=lambda o: (PRIORITY_ORDER[o["priority"]], -o["age_h"]))
    return out


@router.get("/appeals")
async def list_appeals(db: AsyncSession = Depends(get_db), _=Depends(require_perm("appeals"))):
    rows = (await db.execute(select(Appeal).where(Appeal.status == "open").order_by(Appeal.created_at))).scalars().all()
    users = await _users_by_id(db, [a.user_id for a in rows])
    return [{"id": str(a.id), "user": users[a.user_id].handle if a.user_id in users else "?",
             "user_id": str(a.user_id), "kind": a.kind, "about": a.about or "—", "text": a.text,
             "source": a.source, "age_h": _age_h(a.created_at)} for a in rows]


class ManualAppealBody(BaseModel):
    handle: str
    kind: str = Field(pattern="^(appeal|grievance)$")
    about: str = ""
    text: str = Field(min_length=3)


@router.post("/appeals", status_code=201)
async def create_appeal_manual(body: ManualAppealBody, db: AsyncSession = Depends(get_db),
                               admin: User = Depends(require_perm("appeals"))):
    """Log an appeal/grievance that arrived by email (contact@scorred.com)."""
    u = await db.scalar(select(User).where(User.handle == body.handle.lstrip("@").lower()))
    if not u:
        raise HTTPException(status_code=404, detail="No account with that handle")
    a = Appeal(user_id=u.id, kind=body.kind, about=body.about, text=body.text, source="email")
    db.add(a)
    await db.flush()
    log_action(db, admin, "appeal.logged", "appeal", str(a.id), f"@{u.handle}", reason="Received by email",
               subject_user_id=u.id)
    return {"id": str(a.id)}


# ── Decisions ────────────────────────────────────────────────────────────────
class DecideBody(BaseModel):
    queue: str = Field(pattern="^(communities|events|database|reports|appeals)$")
    id: str
    action: str
    reason: str = ""
    message: str = ""
    notify: bool = True
    notify_reporters: bool = True
    strike: bool = True
    duration_days: int = Field(7, ge=1, le=365)
    note: str | None = None
    title: str | None = None        # database "edit & approve"
    merge_into: str | None = None   # database "merge into existing" (target SKU)


async def _ban(db: AsyncSession, admin: User, user: User, reason: str, note: str | None) -> str:
    """Ban = two admins. First call records the request; a different admin's call confirms."""
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Can't ban a staff account")
    if user.banned_at:
        return "already banned"
    if user.ban_requested_by and user.ban_requested_by != admin.id:
        user.banned_at, user.is_suspended = _now(), True
        user.suspended_until, user.suspension_reason = None, reason or user.ban_reason
        log_action(db, admin, "user.ban_confirm", "user", str(user.id), f"@{user.handle}",
                   reason=reason or user.ban_reason or "", note=note, subject_user_id=user.id)
        return "banned"
    if user.ban_requested_by == admin.id:
        raise HTTPException(status_code=400, detail="You requested this ban — a second admin must confirm it")
    user.ban_requested_by, user.ban_reason = admin.id, reason
    log_action(db, admin, "user.ban_request", "user", str(user.id), f"@{user.handle}",
               reason=reason, note=note, subject_user_id=user.id)
    return "ban requested — awaiting a second admin"


def _suspend(user: User, days: int, reason: str) -> None:
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Can't suspend a staff account")
    user.is_suspended = True
    user.suspended_until = _now() + timedelta(days=days)
    user.suspension_reason = reason


def _lift(user: User) -> None:
    user.is_suspended = False
    user.suspended_until = user.suspension_reason = None
    user.banned_at = user.ban_requested_by = user.ban_reason = None


async def _merge_catalogue(db: AsyncSession, src: Catalogue, target_sku: str) -> Catalogue:
    target = await db.scalar(select(Catalogue).where(Catalogue.sku == target_sku, Catalogue.status == "live"))
    if not target or target.sku == src.sku:
        raise HTTPException(status_code=400, detail="Merge target must be a different live database entry")
    # A collector may have rated both — keep their rating on the target.
    await db.execute(delete(CatalogueRating).where(
        CatalogueRating.sku == src.sku,
        CatalogueRating.user_id.in_(select(CatalogueRating.user_id).where(CatalogueRating.sku == target.sku))))
    for model in (CatalogueRating, CatalogueComment, Item, Listing, SavedSearch):
        await db.execute(update(model).where(model.sku == src.sku).values(sku=target.sku))
    await db.execute(update(Message).where(Message.ref_sku == src.sku).values(ref_sku=target.sku))
    src.status = "removed"
    return target


@router.post("/decide")
async def decide(body: DecideBody, db: AsyncSession = Depends(get_db), admin: User = Depends(get_current_admin)):
    perm = {"communities": "approve", "events": "approve", "database": "catalogue",
            "reports": "reports", "appeals": "appeals"}[body.queue]
    if perm not in ROLE_PERMS[role_of(admin)]:
        raise HTTPException(status_code=403, detail=f"Your role ({role_of(admin)}) can't do this")
    reason, a = body.reason.strip(), body.action
    msg = body.message.strip() if body.notify else ""
    result = "done"
    xp_reversed = 0

    if body.queue in ("communities", "events"):
        is_c = body.queue == "communities"
        obj = await db.get(Community, body.id) if is_c else await db.get(Event, uuid.UUID(body.id))
        if not obj:
            raise HTTPException(status_code=404, detail="Not found")
        live, owner_id = ("approved", obj.founder_id) if is_c else ("active", obj.host_id)
        new = {"approve": live, "changes": "changes_requested", "reject": "rejected"}.get(a)
        if not new:
            raise HTTPException(status_code=400, detail="Unknown action")
        obj.status, obj.reviewed_at = new, _now()
        obj.review_reason = None if a == "approve" else reason
        name = obj.name if is_c else obj.title
        kind = "community" if is_c else "event"
        log_action(db, admin, f"{kind}.{a}", kind, body.id, name, reason=reason, note=body.note,
                   subject_user_id=owner_id, meta={"was_auto_approved": obj.auto_approved})
        title = {"approve": f"Your {kind} was approved", "changes": f"Changes requested on your {kind}",
                 "reject": f"Your {kind} wasn't approved"}[a]
        await _moderation_notice(db, owner_id, title, msg, kind, body.id)

    elif body.queue == "database":
        entry = await db.scalar(select(Catalogue).where(Catalogue.sku == body.id))
        if not entry:
            raise HTTPException(status_code=404, detail="Not found")
        ref = entry.sku
        if a == "approve":
            entry.is_verified = True
        elif a == "edit":
            if not (body.title or "").strip():
                raise HTTPException(status_code=422, detail="Title required")
            entry.title, entry.norm_title, entry.is_verified = body.title.strip(), norm_title(body.title), True
        elif a == "merge":
            ref = (await _merge_catalogue(db, entry, (body.merge_into or "").strip())).sku
        elif a == "reject":
            entry.status = "removed"
        else:
            raise HTTPException(status_code=400, detail="Unknown action")
        # XP chargeback (design v8): a duplicate (merge) or rejected entry loses its +50.
        if a in ("merge", "reject"):
            xp_reversed = await reverse_xp(db, entry.submitted_by, "db_new", entry.sku)
            if xp_reversed and msg:
                msg = f"{msg}\n\nThe +{xp_reversed} XP for this entry has been reversed."
        log_action(db, admin, f"catalogue.{a}", "catalogue", entry.sku, entry.title, reason=reason,
                   note=body.note, subject_user_id=entry.submitted_by,
                   meta={**({"merged_into": ref} if a == "merge" else {}), **({"xp_reversed": xp_reversed} if xp_reversed else {})} or None)
        if entry.submitted_by:
            title = {"approve": "Your database entry is Scorred Reviewed", "edit": "Your database entry is Scorred Reviewed",
                     "merge": "Your database entry was merged", "reject": "Your database entry was removed"}[a]
            await _moderation_notice(db, entry.submitted_by, title, msg, "catalogue", ref)

    elif body.queue == "reports":
        group = next((g for g in await _report_groups(db) if g["id"] == body.id), None)
        if not group:
            raise HTTPException(status_code=404, detail="Report already handled")
        res = await _resolve_group(db, group)
        user: User | None = res["author"]
        if a != "dismiss" and a != "remove" and not user:
            raise HTTPException(status_code=400, detail="No account to act on")
        if a == "remove":
            if not res["removable"]:
                raise HTTPException(status_code=400, detail="This content type can't be removed — warn or suspend instead")
            from app.routers.admin import admin_remove_comment, admin_remove_listing, admin_remove_post
            why = f"Report: {reason or 'policy violation'}"
            tid = group["target_id"]
            if group["target_type"] == "post":
                await admin_remove_post(post_id=uuid.UUID(tid), reason=why, db=db, _=admin)
            elif group["target_type"] == "listing":
                await admin_remove_listing(listing_id=uuid.UUID(tid), reason=why, db=db, _=admin)
            elif group["target_type"] == "comment":
                await admin_remove_comment(comment_id=uuid.UUID(tid), reason=why, db=db, _=admin)
            elif group["target_type"] == "catalogue":
                await db.execute(update(Catalogue).where(Catalogue.sku == group["target_ref"]).values(status="removed"))
                submitter = await db.scalar(select(Catalogue.submitted_by).where(Catalogue.sku == group["target_ref"]))
                xp_reversed = await reverse_xp(db, submitter, "db_new", group["target_ref"])
        elif a == "warn":
            user.warned_at = _now()
        elif a == "suspend":
            _suspend(user, body.duration_days, reason)
        elif a == "ban":
            result = await _ban(db, admin, user, reason, body.note)
        elif a != "dismiss":
            raise HTTPException(status_code=400, detail="Unknown action")
        if user and body.strike and a in ("remove", "warn", "suspend", "ban"):
            user.strikes = (user.strikes or 0) + 1
        for r in group["reports"]:
            r.status = "dismissed" if a == "dismiss" else "actioned"
            r.resolution, r.resolved_at, r.reviewed_by = a, _now(), admin.id
        if a != "ban":  # _ban logs its own request/confirm rows
            log_action(db, admin, f"report.{a}", "report", group["id"], res["label"], reason=reason,
                       note=body.note, subject_user_id=user.id if user else None,
                       meta={"count": len(group["reports"]), "days": body.duration_days if a == "suspend" else None})
        if user and a != "dismiss" and not (a == "ban" and result != "banned"):
            title = {"remove": "Your content was removed", "warn": "A warning on your account",
                     "suspend": "Your account is suspended", "ban": "Your account has been banned"}[a]
            await _moderation_notice(db, user.id, title, msg)
        if body.notify_reporters:
            outcome = ("We reviewed your report and didn't find a violation of our Community Guidelines. Thanks for flagging it."
                       if a == "dismiss" else "We reviewed your report and took action. Thanks for helping keep Scorred safe.")
            for rid in {r.reporter_id for r in group["reports"] if r.reporter_id}:
                await notify(db, user_id=rid, kind="report_outcome", title="Update on your report", body=outcome)

    elif body.queue == "appeals":
        ap = await db.get(Appeal, uuid.UUID(body.id))
        if not ap or ap.status != "open":
            raise HTTPException(status_code=404, detail="Appeal already handled")
        u = await db.get(User, ap.user_id)
        status_for = {"uphold": "upheld", "reverse": "reversed", "partial": "partially_reversed"}
        if a not in status_for:
            raise HTTPException(status_code=400, detail="Unknown action")
        if u and a in ("reverse", "partial"):
            _lift(u)
            if a == "reverse":
                u.strikes = max(0, (u.strikes or 0) - 1)
        ap.status, ap.resolution_note = status_for[a], reason
        ap.resolved_by, ap.resolved_at = admin.id, _now()
        log_action(db, admin, f"appeal.{a}", "appeal", body.id, f"@{u.handle if u else '?'} · {ap.kind}",
                   reason=reason, note=body.note, subject_user_id=ap.user_id)
        if u:
            await _moderation_notice(db, u.id, f"Update on your {ap.kind}", msg)
    return {"ok": True, "result": result, "xp_reversed": xp_reversed}


# ── Users ────────────────────────────────────────────────────────────────────
def _user_row(u: User, vouches: int, reports: int) -> dict:
    return {"id": str(u.id), "handle": u.handle, "name": u.name, "city": u.city or "—",
            "joined": u.created_at.isoformat() if u.created_at else None, "status": account_status(u),
            "strikes": u.strikes or 0, "vouches": vouches, "listings": u.active_listings_count or 0,
            "reports": reports, "badges": _badges(u), "group": _group(u), "is_admin": u.is_admin}


@router.get("/users")
async def console_users(q: str | None = None, limit: int = Query(100, le=300),
                        db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    vq = select(Vouch.to_user_id, func.count().label("n")).group_by(Vouch.to_user_id).subquery()
    stmt = select(User, func.coalesce(vq.c.n, 0)).outerjoin(vq, vq.c.to_user_id == User.id).where(
        User.is_seed_account.is_(False) | User.is_admin.is_(True))
    if q:
        p = f"%{q.strip().lstrip('@')}%"
        stmt = stmt.where(or_(User.handle.ilike(p), User.name.ilike(p), User.email.ilike(p), User.city.ilike(p)))
    rows = (await db.execute(stmt.order_by(User.created_at.desc()).limit(limit))).all()
    reports = await _reports_against(db, [u.id for u, _ in rows])
    return [_user_row(u, v, reports.get(u.id, 0)) for u, v in rows]


# ── Add beta testers (replaces running scripts/provision_beta_users.py by hand) ──
# Same account shape as the script: verified email, provisional @handle from the
# email, a shared starter password the admin types (never stored in code), and
# must_reset_password so the first login forces their own password.
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class AddTestersBody(BaseModel):
    emails: list[str] = Field(min_length=1, max_length=50)
    password: str = Field(min_length=8, max_length=128)


async def _unique_handle(db: AsyncSession, email: str, taken: set[str]) -> str:
    base = "".join(c for c in email.split("@")[0].lower() if c.isalnum()) or "collector"
    handle = base
    while handle in taken or await db.scalar(select(User.id).where(User.handle == handle)):
        handle = f"{base}{secrets.randbelow(10000)}"
    taken.add(handle)
    return handle


@router.post("/testers")
async def add_testers(body: AddTestersBody, db: AsyncSession = Depends(get_db),
                      admin: User = Depends(require_perm("users"))):
    pw_hash = hash_password(body.password)
    out, seen, taken = [], set(), set()
    for raw in body.emails:
        email = raw.strip().lower()
        if not email or email in seen:
            continue
        seen.add(email)
        if not EMAIL_RE.match(email):
            out.append({"email": email, "handle": None, "status": "invalid"})
            continue
        existing = await db.scalar(select(User).where(User.email == email))
        if existing:
            out.append({"email": email, "handle": existing.handle, "status": "exists"})
            continue
        handle = await _unique_handle(db, email, taken)
        user = User(id=uuid.uuid4(), handle=handle, name=handle, email=email, password_hash=pw_hash,
                    email_verified=True, must_reset_password=True)
        db.add(user)
        await db.flush()  # the audit row's subject_user_id FK needs the user row first
        log_action(db, admin, "user.add_tester", "user", str(user.id), f"@{handle}", subject_user_id=user.id)
        out.append({"email": email, "handle": handle, "status": "created"})
    return {"results": out, "created": sum(r["status"] == "created" for r in out)}


@router.get("/users/{handle}")
async def console_user(handle: str, db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    u = await db.scalar(select(User).where(User.handle == handle.lstrip("@").lower()))
    if not u:
        raise HTTPException(status_code=404, detail="No account found")
    vouches = await db.scalar(select(func.count()).select_from(Vouch).where(Vouch.to_user_id == u.id)) or 0
    reports = (await _reports_against(db, [u.id])).get(u.id, 0)
    open_reports = []
    for g in await _report_groups(db):
        author = (await _resolve_group(db, g))["author"]
        if author is not None and author.id == u.id:
            open_reports.append(g)
    acts = (await db.execute(select(AdminAction).where(AdminAction.subject_user_id == u.id)
                             .order_by(AdminAction.created_at.desc()).limit(20))).scalars().all()
    actors = await _users_by_id(db, [a.actor_id for a in acts] + [u.ban_requested_by])
    row = _user_row(u, vouches, reports)
    row.update({
        "email": u.email, "xp": u.xp, "last_active_at": u.last_active_at.isoformat() if u.last_active_at else None,
        "suspended_until": u.suspended_until.isoformat() if u.suspended_until else None,
        "suspension_reason": u.suspension_reason, "first_start_badge": u.first_start_badge,
        "ban_requested_by": actors[u.ban_requested_by].name if u.ban_requested_by in actors else None,
        "ban_reason": u.ban_reason, "logged_in": not u.must_reset_password,
        "open_reports": [{"reason": REASON_LABEL.get(g["reason"], g["reason"]), "type": g["target_type"],
                          "count": len(g["reports"])} for g in open_reports],
        "history": [_action_out(a, actors) for a in acts],
    })
    return row


class UserActionBody(BaseModel):
    action: str = Field(pattern="^(badge|unbadge|reset|xp|warn|suspend|unsuspend|ban|cancel_ban)$")
    reason: str = ""
    message: str = ""
    notify: bool = True
    days: int = Field(7, ge=1, le=365)
    amount: int = Field(0, ge=0, le=5000)
    badge: str = "early_believer"


@router.post("/users/{user_id}/action")
async def console_user_action(user_id: uuid.UUID, body: UserActionBody, db: AsyncSession = Depends(get_db),
                              admin: User = Depends(require_perm("users"))):
    u = await db.get(User, user_id)
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.id == admin.id and body.action in ("warn", "suspend", "ban"):
        raise HTTPException(status_code=400, detail="You can't do that to your own account")
    a, reason, result = body.action, body.reason.strip() or "Manual action", "done"
    if a == "badge":
        if u.is_admin:
            raise HTTPException(status_code=400, detail="Staff accounts are outside the rewards system")
        if body.badge not in FIRST_START:
            raise HTTPException(status_code=400, detail="Unknown badge")
        u.first_start_badge = body.badge
    elif a == "unbadge":
        u.first_start_badge = None
    elif a == "reset":
        if not u.password_hash:
            raise HTTPException(status_code=400, detail="This account has no password to reset")
        url = f"{settings.frontend_url}/auth/reset?token={create_reset_token(str(u.id), u.password_hash)}"
        sent = await send_password_reset_email(u.email, url)
        result = "email sent" if sent and settings.resend_api_key else "email not configured — reset link logged on the server"
    elif a == "xp":
        if u.is_admin:
            raise HTTPException(status_code=400, detail="Staff accounts are outside the rewards system")
        if body.amount <= 0:
            raise HTTPException(status_code=422, detail="Enter a positive amount (XP is never deducted)")
        old = u.xp or 0
        db.add(XpEvent(user_id=u.id, action="admin_adjust", points=body.amount, ref_type="admin",
                       ref_id=str(uuid.uuid4())))
        u.xp = old + body.amount
        if tier_index_of(u.xp) > tier_index_of(old):
            await _emit_rank_up(db, u, old, u.xp)
    elif a == "warn":
        u.warned_at, u.strikes = _now(), (u.strikes or 0) + 1
    elif a == "suspend":
        _suspend(u, body.days, reason)
        u.strikes = (u.strikes or 0) + 1
    elif a == "unsuspend":
        _lift(u)
    elif a == "ban":
        result = await _ban(db, admin, u, reason, None)
    elif a == "cancel_ban":
        u.ban_requested_by = u.ban_reason = None
    if a != "ban":
        log_action(db, admin, f"user.{a}", "user", str(u.id), f"@{u.handle}", reason=reason,
                   subject_user_id=u.id, meta={"days": body.days} if a == "suspend" else
                   ({"amount": body.amount} if a == "xp" else ({"badge": body.badge} if a == "badge" else None)))
    if body.notify and body.message.strip() and a in ("warn", "suspend", "unsuspend", "badge", "xp") or (
            a == "ban" and result == "banned" and body.message.strip()):
        await _moderation_notice(db, u.id, {"warn": "A warning on your account", "suspend": "Your account is suspended",
                                            "unsuspend": "Your account is active again", "badge": "You earned a badge",
                                            "xp": "Bonus XP from the Scorred team",
                                            "ban": "Your account has been banned"}[a], body.message.strip())
    return {"ok": True, "result": result}


# ── Data requests (DPDP Act 2023) ────────────────────────────────────────────
@router.get("/data-requests")
async def list_data_requests(db: AsyncSession = Depends(get_db), _=Depends(require_perm("data"))):
    rows = (await db.execute(select(DataRequest).where(DataRequest.status == "open")
                             .order_by(DataRequest.created_at))).scalars().all()
    users = await _users_by_id(db, [r.user_id for r in rows])
    return [{"id": str(r.id), "user": users[r.user_id].handle if r.user_id in users else "?",
             "user_id": str(r.user_id), "email": users[r.user_id].email if r.user_id in users else None,
             "kind": r.kind, "source": r.source, "note": r.note,
             "age_d": (_now() - r.created_at).days if r.created_at else 0} for r in rows]


class ManualDataRequestBody(BaseModel):
    handle: str
    kind: str = Field(pattern="^(delete|export)$")
    note: str | None = None


@router.post("/data-requests", status_code=201)
async def create_data_request_manual(body: ManualDataRequestBody, db: AsyncSession = Depends(get_db),
                                     admin: User = Depends(require_perm("data"))):
    u = await db.scalar(select(User).where(User.handle == body.handle.lstrip("@").lower()))
    if not u:
        raise HTTPException(status_code=404, detail="No account with that handle")
    r = DataRequest(user_id=u.id, kind=body.kind, source="email", note=body.note or "Email to contact@scorred.com")
    db.add(r)
    await db.flush()
    log_action(db, admin, "data.logged", "data_request", str(r.id), f"@{u.handle} · {body.kind}",
               reason="Received by email", subject_user_id=u.id)
    return {"id": str(r.id)}


async def _export_payload(db: AsyncSession, u: User) -> dict:
    def rows(objs, fields):
        return [{f: (getattr(o, f).isoformat() if isinstance(getattr(o, f), datetime) else
                     str(getattr(o, f)) if isinstance(getattr(o, f), uuid.UUID) else getattr(o, f))
                 for f in fields} for o in objs]
    q = lambda stmt: db.execute(stmt)  # noqa: E731
    items = (await q(select(Item).where(Item.user_id == u.id))).scalars().all()
    return {
        "exported_at": _now().isoformat(),
        "profile": {f: (getattr(u, f).isoformat() if isinstance(getattr(u, f), datetime) else getattr(u, f))
                    for f in ("handle", "name", "email", "bio", "city", "country", "gender", "birth_year",
                              "interests", "sub_interests", "xp", "created_at", "last_active_at")},
        "collection": rows(items, ["id", "sku", "custom_title", "status", "condition", "value", "created_at"]),
        "listings": rows((await q(select(Listing).where(Listing.seller_id == u.id))).scalars().all(),
                         ["id", "sku", "price", "currency", "status", "created_at"]),
        "posts": rows((await q(select(Post).where(Post.user_id == u.id))).scalars().all(),
                      ["id", "type", "title", "body", "status", "created_at"]),
        "comments": rows((await q(select(Comment).where(Comment.user_id == u.id))).scalars().all(),
                         ["id", "post_id", "body", "created_at"]),
        "messages_sent": rows((await q(select(Message).where(Message.sender_id == u.id))).scalars().all(),
                              ["id", "thread_id", "body", "created_at"]),
        "following": rows((await q(select(Follow).where(Follow.follower_id == u.id))).scalars().all(),
                          ["following_type", "following_id", "created_at"]),
        "xp_history": rows((await q(select(XpEvent).where(XpEvent.user_id == u.id))).scalars().all(),
                           ["action", "points", "created_at"]),
    }


@router.get("/data-requests/{request_id}/export")
async def export_data(request_id: uuid.UUID, db: AsyncSession = Depends(get_db), _=Depends(require_perm("data"))):
    r = await db.get(DataRequest, request_id)
    u = await db.get(User, r.user_id) if r else None
    if not u:
        raise HTTPException(status_code=404, detail="Request not found")
    body = json.dumps(await _export_payload(db, u), indent=2, ensure_ascii=False, default=str)
    return Response(body, media_type="application/json",
                    headers={"Content-Disposition": f'attachment; filename="scorred-data-{u.handle}.json"'})


async def _anonymize(db: AsyncSession, u: User) -> None:
    """Erase personal data and take public content down. Collection records stay,
    attached to an anonymous locked account (no PII left on them)."""
    await db.execute(update(Post).where(Post.user_id == u.id).values(status="removed", removed_reason="Account deleted"))
    await db.execute(update(Listing).where(Listing.seller_id == u.id, Listing.status != "sold").values(
        status="removed", removed_reason="Account deleted"))
    await db.execute(update(Comment).where(Comment.user_id == u.id).values(is_removed=True, removed_reason="Account deleted"))
    await db.execute(delete(Follow).where(or_(Follow.follower_id == u.id, Follow.following_id == u.id)))
    await db.execute(delete(UserBlock).where(or_(UserBlock.blocker_id == u.id, UserBlock.blocked_id == u.id)))
    await db.execute(delete(Notification).where(Notification.user_id == u.id))
    await db.execute(delete(SavedSearch).where(SavedSearch.user_id == u.id))
    tag = uuid.uuid4().hex[:8]
    u.handle, u.name, u.email = f"deleted-{tag}", "Deleted user", f"deleted+{u.id}@scorred.invalid"
    u.password_hash = u.avatar_url = u.bio = u.city = u.country = u.gender = None
    u.birth_year = u.sub_interests = u.feed_prefs = u.notif_prefs = u.privacy_prefs = None
    u.interests, u.referral_code, u.first_start_badge = [], None, None
    u.is_suspended, u.banned_at, u.suspended_until = True, _now(), None
    u.followers_count = u.following_count = u.active_listings_count = 0


class CompleteDataBody(BaseModel):
    action: str = Field(pattern="^(export_sent|delete|reject)$")
    reason: str = ""


@router.post("/data-requests/{request_id}/complete")
async def complete_data_request(request_id: uuid.UUID, body: CompleteDataBody, db: AsyncSession = Depends(get_db),
                                admin: User = Depends(require_perm("data"))):
    r = await db.get(DataRequest, request_id)
    if not r or r.status != "open":
        raise HTTPException(status_code=404, detail="Request already handled")
    u = await db.get(User, r.user_id)
    label = f"@{u.handle if u else '?'}"
    if body.action == "delete":
        if not u or u.is_admin:
            raise HTTPException(status_code=400, detail="Staff accounts can't be deleted here")
        await _anonymize(db, u)
    r.status = "rejected" if body.action == "reject" else "done"
    r.completed_by, r.completed_at = admin.id, _now()
    log_action(db, admin, {"export_sent": "data.export", "delete": "data.delete", "reject": "data.reject"}[body.action],
               "data_request", str(r.id), label, reason=body.reason or "User request", subject_user_id=r.user_id)
    return {"ok": True}


# ── Audit log ────────────────────────────────────────────────────────────────
@router.get("/audit")
async def audit_log(limit: int = Query(200, le=2000), db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    rows = (await db.execute(select(AdminAction).order_by(AdminAction.created_at.desc()).limit(limit))).scalars().all()
    actors = await _users_by_id(db, [a.actor_id for a in rows])
    return [_action_out(a, actors) for a in rows]


# ── Announcements ────────────────────────────────────────────────────────────
AUDIENCES = {"testers": "All beta testers", "quiet": "Quiet 3+ days", "never_logged_in": "Never logged in",
             "everyone": "Everyone (testers + team)"}


def _audience_filter(key: str):
    tester = (User.created_at >= datetime.combine(settings.analytics_cohort_start, datetime.min.time(), timezone.utc)) \
        & User.is_admin.is_(False) & User.is_seed_account.is_(False) & User.is_suspended.is_(False)
    if key == "testers":
        return tester
    if key == "quiet":
        return tester & User.must_reset_password.is_(False) & (User.last_active_at < _now() - timedelta(days=3))
    if key == "never_logged_in":
        return tester & User.must_reset_password.is_(True)
    return User.is_seed_account.is_(False) & User.is_suspended.is_(False)


@router.get("/announcements")
async def list_announcements(db: AsyncSession = Depends(get_db), _=Depends(require_perm("announce"))):
    audiences = [{"key": k, "label": v, "count": await db.scalar(select(func.count()).select_from(User).where(_audience_filter(k))) or 0}
                 for k, v in AUDIENCES.items()]
    sent = (await db.execute(select(Announcement).order_by(Announcement.created_at.desc()).limit(20))).scalars().all()
    out = []
    for a in sent:
        read = await db.scalar(select(func.count()).select_from(Notification).where(
            Notification.ref_type == "announcement", Notification.ref_id == str(a.id), Notification.is_read.is_(True))) or 0
        out.append({"id": str(a.id), "title": a.title, "body": a.body, "audience": AUDIENCES.get(a.audience, a.audience),
                    "channels": a.channels, "recipients": a.recipients, "emails_sent": a.emails_sent,
                    "opened_pct": round(100 * read / a.recipients) if a.recipients else 0,
                    "created_at": a.created_at.isoformat() if a.created_at else None})
    return {"audiences": audiences, "sent": out, "email_configured": bool(settings.resend_api_key)}


class AnnouncementBody(BaseModel):
    audience: str = Field(pattern="^(testers|quiet|never_logged_in|everyone)$")
    channels: list[str] = ["in_app"]
    title: str = Field(min_length=2, max_length=120)
    body: str = Field(min_length=2, max_length=2000)


@router.post("/announcements", status_code=201)
async def send_announcement(body: AnnouncementBody, db: AsyncSession = Depends(get_db),
                            admin: User = Depends(require_perm("announce"))):
    channels = [c for c in body.channels if c in ("in_app", "email")] or ["in_app"]
    users = (await db.execute(select(User).where(_audience_filter(body.audience)))).scalars().all()
    ann = Announcement(title=body.title, body=body.body, audience=body.audience, channels=channels,
                       recipients=len(users), sent_by=admin.id)
    db.add(ann)
    await db.flush()
    if "in_app" in channels:
        db.add_all([Notification(user_id=u.id, kind="announcement", title=body.title, body=body.body,
                                 ref_type="announcement", ref_id=str(ann.id)) for u in users])
    if "email" in channels and settings.resend_api_key:
        html = f"<h2>{body.title}</h2><p>{body.body}</p><p>— The Scorred team</p>"
        sent = 0
        for u in users[:100]:  # Resend's free tier caps at 100/day
            sent += bool(await send_email(u.email, body.title, html))
        ann.emails_sent = sent
    log_action(db, admin, "announce.send", "announcement", str(ann.id), body.title,
               reason=AUDIENCES[body.audience], meta={"recipients": len(users), "channels": channels})
    return {"id": str(ann.id), "recipients": len(users), "emails_sent": ann.emails_sent}


# ── Team & roles ─────────────────────────────────────────────────────────────
@router.get("/team")
async def list_team(db: AsyncSession = Depends(get_db), _=Depends(get_current_admin)):
    staff = (await db.execute(select(User).where(User.is_admin.is_(True)).order_by(User.created_at))).scalars().all()
    return {"team": [{"id": str(u.id), "name": u.name, "handle": u.handle, "email": u.email, "role": role_of(u),
                      "last_active_at": u.last_active_at.isoformat() if u.last_active_at else None} for u in staff],
            "roles": list(ROLES), "perms": {r: sorted(p) for r, p in ROLE_PERMS.items()}}


class TeamBody(BaseModel):
    handle: str
    role: str = Field(pattern="^(owner|moderator|catalog|support)$")


async def _owners(db: AsyncSession) -> int:
    return await db.scalar(select(func.count()).select_from(User).where(
        User.is_admin.is_(True), or_(User.admin_role == "owner", User.admin_role.is_(None)))) or 0


@router.post("/team")
async def set_team_role(body: TeamBody, db: AsyncSession = Depends(get_db), admin: User = Depends(require_perm("team"))):
    u = await db.scalar(select(User).where(User.handle == body.handle.lstrip("@").lower()))
    if not u:
        raise HTTPException(status_code=404, detail="No account with that handle")
    if u.id == admin.id and body.role != "owner" and await _owners(db) <= 1:
        raise HTTPException(status_code=400, detail="You're the last owner — add another owner first")
    was = role_of(u) if u.is_admin else None
    u.is_admin, u.admin_role = True, body.role
    log_action(db, admin, "team.role", "user", str(u.id), f"@{u.handle}", reason=f"{was or 'member'} → {body.role}",
               subject_user_id=u.id)
    return {"ok": True}


@router.delete("/team/{user_id}")
async def remove_team_member(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), admin: User = Depends(require_perm("team"))):
    u = await db.get(User, user_id)
    if not u or not u.is_admin:
        raise HTTPException(status_code=404, detail="Not a team member")
    if u.id == admin.id:
        raise HTTPException(status_code=400, detail="You can't remove yourself")
    if role_of(u) == "owner" and await _owners(db) <= 1:
        raise HTTPException(status_code=400, detail="Can't remove the last owner")
    u.is_admin, u.admin_role = False, None
    log_action(db, admin, "team.remove", "user", str(u.id), f"@{u.handle}", reason="Removed from team", subject_user_id=u.id)
    return {"ok": True}


# ── User-facing: appeals + data requests ─────────────────────────────────────
class AppealBody(BaseModel):
    kind: str = Field(pattern="^(appeal|grievance)$")
    about: str = Field("", max_length=200)
    text: str = Field(min_length=10, max_length=3000)


@account_router.post("/appeals", status_code=201)
async def submit_appeal(body: AppealBody, db: AsyncSession = Depends(get_db), me: User = Depends(get_current_user)):
    db.add(Appeal(user_id=me.id, kind=body.kind, about=body.about.strip(), text=body.text.strip(), source="app"))
    # India IT Rules 2021: acknowledge a grievance within 24 h — done instantly here.
    due = "15 days" if body.kind == "grievance" else "7 days"
    await notify(db, user_id=me.id, kind="moderation", title=f"We received your {body.kind}",
                 body=f"Thanks — our team will review it and reply within {due}.")
    return {"ok": True}


class DataRequestBody(BaseModel):
    kind: str = Field(pattern="^(delete|export)$")


@account_router.get("/data-requests")
async def my_data_requests(db: AsyncSession = Depends(get_db), me: User = Depends(get_current_user)):
    rows = (await db.execute(select(DataRequest).where(DataRequest.user_id == me.id, DataRequest.status == "open"))).scalars().all()
    return [{"kind": r.kind, "created_at": r.created_at.isoformat() if r.created_at else None} for r in rows]


@account_router.post("/data-requests", status_code=201)
async def submit_data_request(body: DataRequestBody, db: AsyncSession = Depends(get_db), me: User = Depends(get_current_user)):
    exists = await db.scalar(select(DataRequest.id).where(
        DataRequest.user_id == me.id, DataRequest.kind == body.kind, DataRequest.status == "open"))
    if not exists:
        db.add(DataRequest(user_id=me.id, kind=body.kind, source="settings", note="Requested via Settings"))
        await notify(db, user_id=me.id, kind="moderation",
                     title="Account deletion requested" if body.kind == "delete" else "Data export requested",
                     body="We'll verify it's you and complete it within 30 days. We'll email your registered address.")
    return {"ok": True, "already_open": bool(exists)}
