"""Social-proof helpers shared by the feed and post detail.

QA 2026-08-04 §5 — a post's action row shows *who* liked it, not just how many:
three overlapping avatars (initials when there's no photo) followed by the count,
matching design_v7's `StackedAvatars` strip under the action bar.
"""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.post import PostLike
from app.models.user import User

# How many faces the strip shows before it collapses to "+N". Keep in step with
# `StackedAvatars`'s `max` on the web (3) — asking for more just wastes rows.
LIKERS_PREVIEW = 3


async def likers_preview(
    db: AsyncSession,
    post_ids: list[uuid.UUID],
    *,
    limit: int = LIKERS_PREVIEW,
) -> dict[uuid.UUID, list[dict]]:
    """Newest `limit` likers per post, batched for a whole feed page.

    Returns ``{post_id: [{handle, name, avatar_url}, …]}`` — posts with no likes
    are simply absent. A window function does the per-post cut server-side, so a
    post with 10k likes still costs `limit` rows rather than 10k.
    """
    if not post_ids:
        return {}

    rn = func.row_number().over(
        partition_by=PostLike.post_id,
        order_by=PostLike.created_at.desc(),
    ).label("rn")
    ranked = (
        select(PostLike.post_id.label("post_id"), PostLike.user_id.label("user_id"), rn)
        .where(PostLike.post_id.in_(post_ids))
        .subquery()
    )
    rows = await db.execute(
        select(ranked.c.post_id, User.handle, User.name, User.avatar_url)
        .join(User, User.id == ranked.c.user_id)
        .where(ranked.c.rn <= limit)
        .order_by(ranked.c.post_id, ranked.c.rn)
    )

    out: dict[uuid.UUID, list[dict]] = {}
    for post_id, handle, name, avatar_url in rows.all():
        out.setdefault(post_id, []).append(
            {"handle": handle, "name": name, "avatar_url": avatar_url}
        )
    return out
