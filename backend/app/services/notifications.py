"""Helper for creating in-app notifications from request handlers.

Notifications are added to the caller's existing session and committed with the
request (see app.database.get_db). Keep these calls cheap — a single INSERT.
"""
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.user import User

# Map a notification `kind` to the notif_prefs toggle that gates it (DF-23). Kinds
# absent here have no user toggle and are always delivered (vouches, rank-ups, etc.).
NOTIF_KIND_PREF = {
    "follow": "followers",
    "message": "messages",
    "deal": "trade_requests",
    "listing_save": "listing_activity",
    "listing_watch": "listing_activity",
    "event_reminder": "event_reminders",
    "community": "community_activity",
    "price_drop": "price_drops",
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
