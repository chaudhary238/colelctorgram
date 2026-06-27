"""Helper for creating in-app notifications from request handlers.

Notifications are added to the caller's existing session and committed with the
request (see app.database.get_db). Keep these calls cheap — a single INSERT.
"""
import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


def notify(
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
    """Queue a notification for `user_id` on the current session.

    No-op safety is the caller's job (e.g. don't notify a user about their own
    action). Body is NOT NULL in the schema, so an empty string is coerced in.
    Pass `actor_id` for user-triggered notifications (like/follow/comment/…) so
    the UI can show the actor's avatar; leave it None for system notifications.
    """
    db.add(Notification(
        user_id=user_id,
        actor_id=actor_id,
        kind=kind,
        title=title,
        body=body or "",
        ref_type=ref_type,
        ref_id=ref_id,
    ))
