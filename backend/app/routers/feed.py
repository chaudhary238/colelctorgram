import math
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, Follow
from app.models.post import Post, PostLike, PostSave, PostCommunity, PollVote
from app.routers.posts import _iso_fields
from app.services.blocks import blocked_user_ids
from app.services.social import likers_preview

router = APIRouter(prefix="/feed", tags=["feed"])

# DF-10 — admin-curated popular hashtags for the feed filter slider.
# Static config for Phase 1; revisit (derive from post tags) when UGC volume justifies it.
CURATED_TAGS = [
    "#NewDrops", "#Grails", "#Sealed", "#Restock", "#Meetups",
    "#HotToys", "#Gunpla", "#PopMart", "#Diecast", "#Lego", "#Marvel",
]


@router.get("/tags")
async def get_popular_tags(current_user: User = Depends(get_current_user)):
    """Popular hashtags for the feed filter slider (curated, Phase 1)."""
    return {"tags": CURATED_TAGS}


def _recency_decay(created_at: datetime) -> float:
    hours = (datetime.now(timezone.utc) - created_at).total_seconds() / 3600
    return math.exp(-hours / 24)


def _score(post: Post, interests: set[str], followed_ids: set[str], viewer_id: str = "") -> float:
    interest_w = 1.0 if post.category in interests else 0.0
    follow_w = 1.0 if str(post.user_id) in followed_ids else 0.0
    recency = _recency_decay(post.created_at)
    engage = (post.likes_count + post.comments_count * 2 + post.saves_count * 3) / 1000
    base = interest_w * 0.4 + follow_w * 0.3 + recency * 0.2 + min(engage, 1.0) * 0.1
    # Your own freshly-posted content floats to the top of your feed (Instagram-style)
    # then decays with recency — otherwise a new post with no interest/follow/engagement
    # score sinks to the bottom and feels "lost".
    if viewer_id and str(post.user_id) == viewer_id:
        base += recency * 0.6
    return base


@router.get("")
async def get_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    category: Optional[str] = None,
    type: Optional[str] = None,
    tag: Optional[str] = None,
    sort: str = Query("foryou", pattern="^(foryou|latest|top)$"),
    following_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Guests (no token) get a non-personalized feed instead of a 401, so
    # "Explore as guest" can actually browse content (DF-37a).
    interests = set(current_user.interests or []) if current_user else set()

    # DF-08/DF-11 — "Customize feed" prefs tune the For You tab server-side.
    # {"categories": [...]} narrows category-tagged posts; untagged posts always pass.
    prefs = (current_user.feed_prefs or {}) if current_user else {}
    pref_cats = set(prefs.get("categories") or [])

    followed_ids: set[str] = set()
    if current_user:
        follows = await db.execute(
            select(Follow.following_id).where(
                Follow.follower_id == current_user.id,
                Follow.following_type == "user",
            )
        )
        followed_ids = {str(r) for r in follows.scalars().all()}

    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    # DF-27 — pending (awaiting-mod-review) community posts never appear in the feed.
    # DF-30h — to_feed gates posts the author chose to keep community-only.
    stmt = select(Post).where(
        Post.created_at >= cutoff, Post.status == "published", Post.to_feed.is_(True)
    )
    if category:
        stmt = stmt.where(Post.category == category)
    if type:
        stmt = stmt.where(Post.type == type)
    if tag:
        # hashtag slider filter (DF-09/DF-10) — tags stored with leading '#'
        stmt = stmt.where(Post.tags.contains([tag]))
    if following_only:
        # only posts authored by users the viewer follows
        stmt = stmt.where(Post.user_id.in_([uuid.UUID(fid) for fid in followed_ids] or [None]))

    # B-69: hide posts by users in a block relationship with the viewer (either direction).
    blocked = await blocked_user_ids(db, current_user.id)
    if blocked:
        stmt = stmt.where(Post.user_id.not_in(blocked))

    result = await db.execute(stmt.order_by(Post.created_at.desc()).limit(500))
    posts = result.scalars().all()

    # For You honours Customize-feed categories: category-tagged posts outside the
    # selection drop; untagged posts (and a no-op full selection) pass through (DF-11)
    if sort == "foryou" and pref_cats:
        posts = [p for p in posts if not p.category or p.category in pref_cats]

    if sort == "latest":
        scored = sorted(posts, key=lambda p: p.created_at, reverse=True)
    elif sort == "top":
        scored = sorted(
            posts,
            key=lambda p: p.likes_count + p.comments_count * 2 + p.saves_count * 3,
            reverse=True,
        )
    else:
        viewer_id = str(current_user.id) if current_user else ""
        scored = sorted(posts, key=lambda p: _score(p, interests, followed_ids, viewer_id), reverse=True)
    start = (page - 1) * limit
    page_posts = scored[start: start + limit]

    if not page_posts:
        return {"page": page, "limit": limit, "items": []}

    # Batch-load authors
    author_ids = list({p.user_id for p in page_posts})
    users_result = await db.execute(select(User).where(User.id.in_(author_ids)))
    users_by_id = {u.id: u for u in users_result.scalars().all()}

    # Batch-load current user's likes + saves for this page (guests have none)
    post_ids = [p.id for p in page_posts]
    liked_ids: set = set()
    saved_ids: set = set()
    if current_user:
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

    # Batch the viewer's poll votes for any poll posts on this page (locked votes)
    poll_votes_by_post: dict = {}
    if current_user:
        poll_ids = [p.id for p in page_posts if p.type == "poll"]
        if poll_ids:
            pv_result = await db.execute(
                select(PollVote.post_id, PollVote.option_index).where(
                    PollVote.user_id == current_user.id,
                    PollVote.post_id.in_(poll_ids),
                )
            )
            poll_votes_by_post = dict(pv_result.all())

    # DF-30h — batch the published community memberships for this page
    pc_result = await db.execute(
        select(PostCommunity.post_id, PostCommunity.community_id).where(
            PostCommunity.post_id.in_(post_ids), PostCommunity.status == "published"
        )
    )
    communities_by_post: dict = {}
    for pid, cid in pc_result.all():
        communities_by_post.setdefault(pid, []).append(cid)

    # QA §5 — the three newest likers per post, for the social-proof strip.
    likers_by_post = await likers_preview(db, post_ids)

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
                communities_by_post.get(p.id, []),
                poll_votes_by_post.get(p.id),
                likers_by_post.get(p.id, []),
            )
            for p in page_posts
        ],
    }


def _feed_badge(author: Optional[User]) -> Optional[dict]:
    """The single rewards badge for an author (v3 §3), or None for a missing author."""
    if author is None:
        return None
    from app.services.gamification import feed_badge
    return feed_badge(author)


def _post_dict(p: Post, author: Optional[User], is_liked: bool, is_saved: bool, is_following: bool = False, community_ids: Optional[list] = None, my_poll_vote: Optional[int] = None, likers: Optional[list] = None) -> dict:
    return {
        "id": str(p.id),
        "user_id": str(p.user_id),
        "handle": author.handle if author else None,
        "name": author.name if author else None,
        "avatar_url": author.avatar_url if author else None,
        # Rewards badge shown next to the author (v3 §2.4/§3): First Start badge if
        # the author has one, else their rank badge. Exactly one per post — and
        # None for staff, who carry the Official tag instead (QA 2026-08-04 §4).
        "badge": _feed_badge(author),
        # Authored by staff → renders as "Scorred · Official", not as the person.
        "is_official": bool(author is not None and author.is_admin),
        # QA §5 — up to 3 recent likers for the social-proof strip.
        "likers": likers or [],
        "type": p.type,
        "title": p.title,
        "body": p.body,
        "images": p.images or [],
        "category": p.category,
        "tags": p.tags or [],
        "community_id": p.community_id,
        "community_ids": community_ids or [],
        **_iso_fields(p),
        "review_rating": p.review_rating,
        "poll_options": p.poll_options,
        "my_poll_vote": my_poll_vote,
        "status": p.status,
        "likes_count": p.likes_count,
        "comments_count": p.comments_count,
        "saves_count": p.saves_count,
        "is_liked": is_liked,
        "is_saved": is_saved,
        "is_following": is_following,
        "created_at": p.created_at.isoformat(),
    }
