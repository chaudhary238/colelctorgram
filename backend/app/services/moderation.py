"""Shared moderation logic for the admin console: roles/permissions, the audit
log writer, suspension expiry, report priority, and the auto-flags shown on
approval queues. Kept out of the router so auth (suspension expiry) and the
listings router (price-anomaly auto-flag) can reuse it."""
import re
import uuid
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from fastapi import Depends, HTTPException, status
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_admin
from app.models.admin import AdminAction
from app.models.catalogue import Catalogue
from app.models.trust import Report
from app.models.user import User

# ── Roles (design "Team & roles" permission matrix) ─────────────────────────
ROLES = ("owner", "moderator", "catalog", "support")
ROLE_PERMS: dict[str, set[str]] = {
    "owner": {"approve", "catalogue", "reports", "users", "ban", "appeals", "data", "announce", "team"},
    "moderator": {"approve", "catalogue", "reports", "users", "ban", "appeals"},
    "catalog": {"catalogue"},
    "support": {"appeals", "data", "announce"},
}


def role_of(user: User) -> str:
    return user.admin_role if user.admin_role in ROLES else "owner"  # pre-role admins = owner


def require_perm(perm: str):
    async def dep(admin: User = Depends(get_current_admin)) -> User:
        if perm not in ROLE_PERMS[role_of(admin)]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail=f"Your role ({role_of(admin)}) can't do this")
        return admin
    return dep


# ── Audit log ────────────────────────────────────────────────────────────────
def log_action(db: AsyncSession, actor: User | None, action: str, target_type: str,
               target_id: str | None, label: str, *, reason: str = "", note: str | None = None,
               subject_user_id: uuid.UUID | None = None, meta: dict | None = None) -> None:
    db.add(AdminAction(
        actor_id=actor.id if actor else None, action=action, target_type=target_type,
        target_id=str(target_id) if target_id is not None else None, target_label=label[:300],
        subject_user_id=subject_user_id, reason=reason or "", note=note or None, meta=meta,
    ))


# ── Suspension ───────────────────────────────────────────────────────────────
def lift_expired_suspension(user: User) -> bool:
    """A timed suspension ends on its own. Returns True if it was lifted. Bans
    (banned_at set, no expiry) never lift here. Caller's session commits it."""
    if (user.is_suspended and user.suspended_until and not user.banned_at
            and user.suspended_until <= datetime.now(timezone.utc)):
        user.is_suspended = False
        user.suspended_until = None
        user.suspension_reason = None
        return True
    return False


def suspension_message(user: User) -> str:
    if user.banned_at:
        return "This account has been permanently banned. To appeal, email contact@scorred.com."
    if user.suspended_until:
        return (f"This account is suspended until {user.suspended_until:%d %b %Y, %H:%M} UTC. "
                "To appeal, email contact@scorred.com.")
    return "This account is suspended. To appeal, email contact@scorred.com."


def account_status(user: User) -> str:
    if user.banned_at:
        return "Banned"
    if user.ban_requested_by and not user.banned_at:
        return "Ban pending"
    if user.is_suspended:
        return "Suspended"
    if user.warned_at and user.warned_at > datetime.now(timezone.utc) - timedelta(days=30):
        return "Warned"
    return "Active"


# ── Reports ──────────────────────────────────────────────────────────────────
REPORT_REASONS = {"spam", "harassment", "counterfeit", "scam", "impersonation", "other"}
REASON_LABEL = {
    "counterfeit": "Counterfeit / replica", "scam": "Scam or fraud", "harassment": "Harassment or abuse",
    "spam": "Spam", "impersonation": "Fake / impersonation", "other": "Other",
    "price_anomaly": "Auto-flag: price anomaly",
}
_PRIORITY = {"counterfeit": "High", "scam": "High", "harassment": "Medium", "impersonation": "Medium",
             "spam": "Medium", "price_anomaly": "Low", "other": "Low"}
PRIORITY_ORDER = {"High": 0, "Medium": 1, "Low": 2}
SLA_HOURS = {"High": 24, "Medium": 48, "Low": 72}


def priority_of(reason: str) -> str:
    return _PRIORITY.get(reason, "Low")


async def maybe_flag_price_anomaly(db: AsyncSession, *, listing_id: uuid.UUID, sku: str | None,
                                   price: int) -> None:
    """System report when a listing is priced far below the database estimate —
    the classic counterfeit / scam tell. One open flag per listing."""
    if not sku or not price:
        return
    est = await db.scalar(select(Catalogue.est_retail_price).where(Catalogue.sku == sku))
    if not est or price >= est * 0.4:
        return
    exists = await db.scalar(select(Report.id).where(
        Report.target_type == "listing", Report.target_id == listing_id,
        Report.source == "system", Report.status == "pending"))
    if exists:
        return
    pct = round(100 - 100 * price / est)
    db.add(Report(
        reporter_id=None, source="system", target_type="listing", target_id=listing_id,
        reason="price_anomaly",
        notes=f"Listed {pct}% below the database estimate (₹{est // 100:,} est. vs ₹{price // 100:,}).",
    ))


# ── Approval-queue auto-flags ────────────────────────────────────────────────
SUSPECT_WORDS = re.compile(r"\b(replica|ko|bootleg|fake|first copy|master copy|1st copy|clone|copy)\b", re.I)
# Ticketing sites that are fine to link; anything else gets a "check this link" flag.
KNOWN_TICKET_HOSTS = ("bookmyshow.com", "insider.in", "district.in", "paytm.com", "townscript.com",
                      "allevents.in", "eventbrite.com", "eventbrite.co.in", "skillboxes.com",
                      "comicconindia.com", "meetup.com", "luma.com", "lu.ma", "zomato.com")


def _young(user: User | None) -> str | None:
    if not user or not user.created_at:
        return None
    days = (datetime.now(timezone.utc) - user.created_at).days
    if days >= 3:
        return None
    return "Account is less than a day old" if days == 0 else f"Account is {days} day{'s' if days != 1 else ''} old"


async def community_flags(db: AsyncSession, c, founder: User | None) -> list[str]:
    flags: list[str] = []
    row = (await db.execute(text(
        "SELECT name, member_count, similarity(lower(name), lower(:n)) AS s FROM communities "
        "WHERE id <> :id AND status IN ('approved','pending') AND similarity(lower(name), lower(:n)) > 0.45 "
        "ORDER BY s DESC LIMIT 1"), {"n": c.name, "id": c.id})).first()
    if row:
        flags.append(f"Similar name exists: “{row.name}” ({row.member_count} members)")
    words = sorted({m.group(0).lower() for m in SUSPECT_WORDS.finditer(f"{c.name} {c.description or ''} {c.short_desc or ''}")})
    if words:
        flags.append("Keyword match: " + ", ".join(f"“{w}”" for w in words))
    if y := _young(founder):
        flags.append(y)
    return flags


def event_flags(e, host: User | None) -> list[str]:
    flags: list[str] = []
    if e.ticket_url:
        host_name = (urlparse(e.ticket_url if "://" in e.ticket_url else "https://" + e.ticket_url).hostname or "").lower()
        if not any(host_name == h or host_name.endswith("." + h) for h in KNOWN_TICKET_HOSTS):
            flags.append("External payment link on an unfamiliar domain")
    if "scorred" in (e.title or "").lower():
        flags.append("Uses “Scorred” in title")
    if e.mode != "online" and not (e.venue or e.address):
        flags.append("No venue given")
    if y := _young(host):
        flags.append(y)
    return flags


async def catalogue_dupes(db: AsyncSession, entry: Catalogue, limit: int = 3) -> list[dict]:
    rows = (await db.execute(text(
        "SELECT sku, title, thumbnail_url, similarity(norm_title, :t) AS s FROM catalogue "
        "WHERE sku <> :sku AND status = 'live' AND similarity(norm_title, :t) > 0.45 "
        "ORDER BY s DESC LIMIT :lim"), {"t": entry.norm_title or "", "sku": entry.sku, "lim": limit})).all()
    return [{"sku": r.sku, "title": r.title, "thumbnail_url": r.thumbnail_url, "match": round(r.s * 100)} for r in rows]


def catalogue_flags(entry: Catalogue, photo_count: int) -> list[str]:
    flags: list[str] = []
    if photo_count <= 1:
        flags.append("Only 1 photo" if photo_count == 1 else "No photos")
    if (entry.est_retail_price or 0) >= 50_000 * 100:
        flags.append("High value — check authenticity")
    return flags


async def reports_against(db: AsyncSession, user_id: uuid.UUID) -> int:
    """Reports about this account or anything it authored (posts, listings,
    comments, messages)."""
    return await db.scalar(text("""
        SELECT count(*) FROM reports r WHERE
          (r.target_type = 'user' AND r.target_id = :u)
          OR (r.target_type = 'post' AND r.target_id IN (SELECT id FROM posts WHERE user_id = :u))
          OR (r.target_type = 'listing' AND r.target_id IN (SELECT id FROM listings WHERE seller_id = :u))
          OR (r.target_type = 'comment' AND r.target_id IN (SELECT id FROM comments WHERE user_id = :u))
          OR (r.target_type = 'message' AND r.target_id IN (SELECT id FROM messages WHERE sender_id = :u))
    """), {"u": user_id}) or 0


async def count_open(db: AsyncSession, model, *conds) -> int:
    return await db.scalar(select(func.count()).select_from(model).where(*conds)) or 0
