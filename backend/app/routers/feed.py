import math
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, Follow
from app.models.post import Post

router = APIRouter(prefix="/feed", tags=["feed"])

FEED_PAGE_TTL = 300  # 5 minutes


def _recency_decay(created_at: datetime) -> float:
    hours = (datetime.now(timezone.utc) - created_at).total_seconds() / 3600
    return math.exp(-hours / 24)


def _score(post: Post, interests: set[str], followed_ids: set[str]) -> float:
    interest_w = 1.0 if post.category in interests else 0.0
    follow_w = 1.0 if str(post.user_id) in followed_ids else 0.0
    recency = _recency_decay(post.created_at)
    engage = (post.likes_count + post.comments_count * 2 + post.saves_count * 3) / 1000
    return interest_w * 0.4 + follow_w * 0.3 + recency * 0.2 + min(engage, 1.0) * 0.1


@router.get("")
async def get_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    category: Optional[str] = None,
    type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    interests = set(current_user.interests or [])

    # Get followed user IDs
    follows = await db.execute(
        select(Follow.following_id).where(
            Follow.follower_id == current_user.id,
            Follow.following_type == "user",
        )
    )
    followed_ids = {str(r) for r in follows.scalars().all()}

    # Query recent posts (last 7 days as working set)
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    stmt = select(Post).where(Post.created_at >= cutoff)
    if category:
        stmt = stmt.where(Post.category == category)
    if type:
        stmt = stmt.where(Post.type == type)

    result = await db.execute(stmt.order_by(Post.created_at.desc()).limit(500))
    posts = result.scalars().all()

    scored = sorted(posts, key=lambda p: _score(p, interests, followed_ids), reverse=True)
    start = (page - 1) * limit
    page_posts = scored[start: start + limit]

    return {
        "page": page,
        "limit": limit,
        "items": [
            {
                "id": str(p.id),
                "user_id": str(p.user_id),
                "type": p.type,
                "body": p.body,
                "images": p.images,
                "category": p.category,
                "likes_count": p.likes_count,
                "comments_count": p.comments_count,
                "saves_count": p.saves_count,
                "created_at": p.created_at.isoformat(),
            }
            for p in page_posts
        ],
    }
