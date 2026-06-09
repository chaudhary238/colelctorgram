import math
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, Follow
from app.models.post import Post, PostLike, PostSave

router = APIRouter(prefix="/feed", tags=["feed"])


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

    follows = await db.execute(
        select(Follow.following_id).where(
            Follow.follower_id == current_user.id,
            Follow.following_type == "user",
        )
    )
    followed_ids = {str(r) for r in follows.scalars().all()}

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

    if not page_posts:
        return {"page": page, "limit": limit, "items": []}

    # Batch-load authors
    author_ids = list({p.user_id for p in page_posts})
    users_result = await db.execute(select(User).where(User.id.in_(author_ids)))
    users_by_id = {u.id: u for u in users_result.scalars().all()}

    # Batch-load current user's likes + saves for this page
    post_ids = [p.id for p in page_posts]
    likes_result = await db.execute(
        select(PostLike.post_id).where(
            PostLike.user_id == current_user.id,
            PostLike.post_id.in_(post_ids),
        )
    )
    liked_ids = set(likes_result.scalars().all())

    saves_result = await db.execute(
        select(PostSave.post_id).where(
            PostSave.user_id == current_user.id,
            PostSave.post_id.in_(post_ids),
        )
    )
    saved_ids = set(saves_result.scalars().all())

    return {
        "page": page,
        "limit": limit,
        "items": [
            _post_dict(
                p,
                users_by_id.get(p.user_id),
                p.id in liked_ids,
                p.id in saved_ids,
                str(p.user_id) in followed_ids,
            )
            for p in page_posts
        ],
    }


def _post_dict(p: Post, author: Optional[User], is_liked: bool, is_saved: bool, is_following: bool = False) -> dict:
    return {
        "id": str(p.id),
        "user_id": str(p.user_id),
        "handle": author.handle if author else None,
        "name": author.name if author else None,
        "avatar_url": author.avatar_url if author else None,
        "tier": author.tier if author else "verified",
        "type": p.type,
        "body": p.body,
        "images": p.images or [],
        "category": p.category,
        "community_id": p.community_id,
        "review_rating": p.review_rating,
        "poll_options": p.poll_options,
        "is_admin_post": p.is_admin_post,
        "likes_count": p.likes_count,
        "comments_count": p.comments_count,
        "saves_count": p.saves_count,
        "is_liked": is_liked,
        "is_saved": is_saved,
        "is_following": is_following,
        "created_at": p.created_at.isoformat(),
    }
