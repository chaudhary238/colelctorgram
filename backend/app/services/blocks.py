"""Block enforcement helpers (B-69).

`UserBlock` rows are written by the block/unblock endpoints (routers/moderation.py);
this module is the single place that READS them so every surface enforces blocks the
same way. A block is treated as BIDIRECTIONAL for interaction/visibility: if A blocked
B, then A and B neither message each other nor appear in each other's feed / search /
suggestions / follower lists / comments.
"""
import uuid

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.trust import UserBlock


async def is_blocked_pair(db: AsyncSession, a: uuid.UUID, b: uuid.UUID) -> bool:
    """True if either user has blocked the other. Gate for messaging / direct interaction."""
    if a == b:
        return False
    row = await db.scalar(
        select(UserBlock.blocker_id)
        .where(
            or_(
                and_(UserBlock.blocker_id == a, UserBlock.blocked_id == b),
                and_(UserBlock.blocker_id == b, UserBlock.blocked_id == a),
            )
        )
        .limit(1)
    )
    return row is not None


async def blocked_user_ids(db: AsyncSession, user_id: uuid.UUID) -> set[uuid.UUID]:
    """Every user in a block relationship (either direction) with `user_id`.

    Use to filter listings of people out of feeds/search/suggestions/followers/comments:
    `if blocked: stmt = stmt.where(User.id.not_in(blocked))`.
    """
    rows = await db.execute(
        select(UserBlock.blocker_id, UserBlock.blocked_id).where(
            or_(UserBlock.blocker_id == user_id, UserBlock.blocked_id == user_id)
        )
    )
    out: set[uuid.UUID] = set()
    for blocker, blocked in rows.all():
        out.add(blocked if blocker == user_id else blocker)
    return out
