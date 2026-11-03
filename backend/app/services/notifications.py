"""Helper for creating in-app notifications from request handlers.

Notifications are added to the caller's existing session and committed with the
request (see app.database.get_db). Keep these calls cheap — a single INSERT.
"""
import re
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.user import User
from app.services.blocks import blocked_user_ids
from app.ws.manager import manager

# Map a notification `kind` to the notif_prefs toggle that gates it (DF-23). Kinds
# absent here have no user toggle and are always delivered (vouches, rank-ups, etc.).
NOTIF_KIND_PREF = {
    "follow": "followers",
    "message": "messages",
    "listing_save": "listing_activity",
    "listing_watch": "listing_activity",
    "event_reminder": "event_reminders",
    "community": "community_activity",
    "price_drop": "price_drops",
    "listing_sold": "price_drops",  # C-06 — "sold" alert rides the saved-listing toggle
    "new_listing": "new_listings",
}
# Defaults must match DEFAULT_NOTIF_PREFS in routers/users.py — kept here to avoid a
# circular import. A user with NULL prefs (seed rows) gets these.
_NOTIF_DEFAULTS = {
    "followers": True, "messages": True, "listing_activity": True,
    "trade_requests": True, "event_reminders": True, "community_activity": False,
    "price_drops": True, "new_listings": False,
}


async def notify(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    kind: str,
    title: str,
    body: str,
    actor_id: Optional[uuid.UUID] = None,
    ref_type: Optional[str] = None,
    ref_id: Optional[str] = None,
) -> None:
    """Queue a notification for `user_id` on the current session, respecting the
    recipient's notif_prefs (DF-23) — kinds the user disabled are silently dropped.

    No-op safety is the caller's job (e.g. don't notify a user about their own
    action). Body is NOT NULL in the schema, so an empty string is coerced in.
    Pass `actor_id` for user-triggered notifications (like/follow/comment/…) so
    the UI can show the actor's avatar; leave it None for system notifications.
    """
    pref_key = NOTIF_KIND_PREF.get(kind)
    if pref_key:
        prefs = await db.scalar(select(User.notif_prefs).where(User.id == user_id))
        merged = {**_NOTIF_DEFAULTS, **(prefs or {})}
        if not merged.get(pref_key, True):
            return  # recipient turned this category off

    db.add(Notification(
        user_id=user_id,
        actor_id=actor_id,
        kind=kind,
        title=title,
        body=body or "",
        ref_type=ref_type,
        ref_id=ref_id,
    ))
    # Realtime nudge (notification.push) for live badge/Activity refresh. The
    # row commits with the request a beat later; clients refetch, not render this.
    await manager.publish(str(user_id), "notification.push", {"kind": kind, "title": title})


# @handles in comment text — the HANDLE_RE charset (routers/users.py); handles are
# stored lowercase.
MENTION_RE = re.compile(r"@([A-Za-z0-9_]{3,20})\b")
# Mentions notified per comment, so one comment can't ping a crowd.
MAX_MENTIONS = 10


async def notify_comment(
    db: AsyncSession,
    *,
    actor_id: uuid.UUID,
    text: str,
    ref_type: str,
    ref_id: str,
    reply_to_id: Optional[uuid.UUID] = None,
    owner_id: Optional[uuid.UUID] = None,
) -> None:
    """Notify everyone a new comment concerns, once each, most specific reason first:
    the commenter it replies to ("reply"), anyone it @mentions ("mention"), then the
    owner of what was commented on ("comment"). Never the actor, and no one in a block
    relationship with them."""
    handles = list({h.lower() for h in MENTION_RE.findall(text)})[:MAX_MENTIONS]
    mentioned = (await db.execute(
        select(User.id).where(User.handle.in_(handles))
    )).scalars().all() if handles else []
    snippet = text if len(text) <= 80 else text[:80] + "…"
    skip = {actor_id, *(await blocked_user_ids(db, actor_id))}
    for user_id, kind, title, body in (
        (reply_to_id, "reply", "New reply", f"replied to your comment: {snippet}"),
        *((m, "mention", "New mention", f"mentioned you: {snippet}") for m in mentioned),
        (owner_id, "comment", "New comment", f"commented: {snippet}"),
    ):
        if user_id is None or user_id in skip:
            continue
        skip.add(user_id)
        await notify(
            db, user_id=user_id, actor_id=actor_id, kind=kind, title=title, body=body,
            ref_type=ref_type, ref_id=ref_id,
        )
