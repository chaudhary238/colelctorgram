import math
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.database import get_db
from app.dependencies import get_current_user
from app.models.deal import Vouch
from app.models.user import User, Follow
from app.models.post import Comment, Post, PostLike, PostSave, PostCommunity, PollVote
from app.models.community import Community
from app.models.listing import Listing
from app.models.item import Item, ItemPhoto
from app.models.catalogue import Catalogue
from app.routers.posts import _iso_fields
from app.services import feed_cache
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


# For You ranking (founder 2026-11-01, DECISIONS.md): a post's score is its publish
# time in hours; signals only add a bounded number of hours, so nothing can gain more
# than 30h and a post older than that never beats a brand-new one.
FOLLOW_BONUS_HOURS = 12.0
INTEREST_BONUS_HOURS = 6.0
ENGAGEMENT_MAX_BONUS_HOURS = 12.0
ENGAGEMENT_WINDOW_HOURS = 48


def _engagement_bonus(engagement: int) -> float:
    # Log scale: the first reactions matter most, and the cap keeps old hits buried.
    return min(6.0 * math.log10(1 + engagement), ENGAGEMENT_MAX_BONUS_HOURS)


def _score(
    post: Post, interests: set[str], followed_ids: set[str], viewer_id: str = "", engagement: int = 0,
) -> float:
    # Absolute hours rather than age, so the order stays stable between page requests.
    score = post.created_at.timestamp() / 3600
    author_id = str(post.user_id)
    # Your own post ranks like a followed author's; POST-publish visibility is the
    # one-time `pin` on GET /feed, not a permanent lift.
    if author_id == viewer_id or author_id in followed_ids:
        score += FOLLOW_BONUS_HOURS
    if post.category in interests:
        score += INTEREST_BONUS_HOURS
    return score + _engagement_bonus(engagement)


async def _recent_engagement(db: AsyncSession) -> dict[uuid.UUID, int]:
    """likes + 2×people who commented + 3×saves per post, last 48h only, excluding the
    author. Recent-only so age and seeded totals don't count; people rather than
    comments so a two-person argument can't climb. Shared across viewers (feed_cache)."""
    totals = feed_cache.get_engagement()
    if totals is not None:
        return totals
    since = datetime.now(timezone.utc) - timedelta(hours=ENGAGEMENT_WINDOW_HOURS)
    likes = select(PostLike.post_id, func.count()).join(Post, Post.id == PostLike.post_id).where(
        PostLike.created_at >= since, PostLike.user_id != Post.user_id,
    ).group_by(PostLike.post_id)
    commenters = select(Comment.post_id, func.count(func.distinct(Comment.user_id))).join(
        Post, Post.id == Comment.post_id,
    ).where(
        Comment.created_at >= since, Comment.user_id != Post.user_id,
        Comment.is_removed.is_(False),
    ).group_by(Comment.post_id)
    saves = select(PostSave.post_id, func.count()).join(Post, Post.id == PostSave.post_id).where(
        PostSave.created_at >= since, PostSave.user_id != Post.user_id,
    ).group_by(PostSave.post_id)
    totals = {}
    for stmt, weight in ((likes, 1), (commenters, 2), (saves, 3)):
        for post_id, count in (await db.execute(stmt)).all():
            totals[post_id] = totals.get(post_id, 0) + count * weight
    feed_cache.put_engagement(totals)
    return totals


@router.get("")
async def get_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    category: Optional[str] = None,
    type: Optional[str] = None,
    tag: Optional[str] = None,
    sort: str = Query("foryou", pattern="^(foryou|latest|top)$"),
    following_only: bool = False,
    pin: Optional[uuid.UUID] = None,
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

    # The candidate window is shared across viewers and cached (feed_cache):
    # only content filters go in the query; per-viewer filters (blocks,
    # following_only) are applied in Python below so the cache stays shared.
    cache_key = (category, type, tag)
    posts = feed_cache.get(cache_key)
    if posts is None:
        # No age cutoff: candidates are simply the newest 500 posts. A fixed 30-day
        # window emptied the feed on a small network (closed beta: seeded posts aged
        # out, Home showed 3 of 28); _score still ranks fresh first.
        # DF-27 — pending (awaiting-mod-review) community posts never appear in the feed.
        # DF-30h — to_feed gates posts the author chose to keep community-only.
        stmt = select(Post).where(Post.status == "published", Post.to_feed.is_(True))
        if category:
            stmt = stmt.where(Post.category == category)
        if type:
            stmt = stmt.where(Post.type == type)
        if tag:
            # hashtag slider filter (DF-09/DF-10) — tags stored with leading '#'
            stmt = stmt.where(Post.tags.contains([tag]))
        result = await db.execute(stmt.order_by(Post.created_at.desc()).limit(500))
        posts = result.scalars().all()
        # Detach before caching: rows outlive this session (read-only reuse is
        # safe — expire_on_commit=False keeps loaded values readable).
        for p in posts:
            db.expunge(p)
        feed_cache.put(cache_key, posts)

    # The author's just-published post leads page 1 once, whatever the filters below do.
    pinned = None
    if pin and page == 1:
        pinned = next((p for p in posts if p.id == pin and p.user_id == current_user.id), None)

    if following_only:
        # only posts authored by users the viewer follows
        followed_uuids = {uuid.UUID(fid) for fid in followed_ids}
        posts = [p for p in posts if p.user_id in followed_uuids]

    # B-69: hide posts by users in a block relationship with the viewer (either direction).
    blocked = await blocked_user_ids(db, current_user.id)
    if blocked:
        posts = [p for p in posts if p.user_id not in blocked]

    # For You honours Customize-feed categories: category-tagged posts outside the
    # selection drop; untagged posts (and a no-op full selection) pass through (DF-11).
    # Followed authors bypass it — following someone outranks a topic filter (2026-11-01).
    if sort == "foryou" and pref_cats:
        posts = [
            p for p in posts
            if not p.category or p.category in pref_cats or str(p.user_id) in followed_ids
        ]

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
        engagement = await _recent_engagement(db)
        scored = sorted(
            posts,
            key=lambda p: _score(p, interests, followed_ids, viewer_id, engagement.get(p.id, 0)),
            reverse=True,
        )
    start = (page - 1) * limit
    page_posts = scored[start: start + limit]
    if pinned:
        # Prepended, not swapped in, so no ranked post is lost from page 1; the page can
        # run to limit + 1. Clients dedupe it if it recurs on a later page.
        page_posts = [pinned, *(p for p in page_posts if p.id != pinned.id)]

    if not page_posts:
        return {"page": page, "limit": limit, "items": []}

    items = await serialize_posts(db, page_posts, current_user, followed_ids)
    return {"page": page, "limit": limit, "items": items}


async def listing_summaries(db: AsyncSession, listing_ids: set) -> dict:
    """SharedListingCard summaries for posts carrying ref_listing_id — one query
    for the listings (+item/catalogue identity), one for public cover photos."""
    if not listing_ids:
        return {}
    rows = await db.execute(
        select(Listing, Item.custom_title, Catalogue.title, Catalogue.thumbnail_url)
        .join(Item, Item.id == Listing.item_id)
        .outerjoin(Catalogue, Catalogue.sku == Listing.sku)
        .where(Listing.id.in_(listing_ids))
    )
    listings = rows.all()
    item_ids = [l.item_id for (l, _, _, _) in listings]
    covers: dict = {}
    if item_ids:
        ph = await db.execute(
            select(ItemPhoto.item_id, ItemPhoto.url)
            .where(ItemPhoto.item_id.in_(item_ids), ItemPhoto.is_public == True)  # noqa: E712
            .order_by(ItemPhoto.uploaded_at)
        )
        for iid, url in ph.all():
            covers.setdefault(iid, url)  # oldest public photo = cover (DF-17 rule)
    out: dict = {}
    for l, custom_title, cat_title, cat_thumb in listings:
        out[l.id] = {
            "id": str(l.id),
            "sku": l.sku,
            "title": custom_title or cat_title or l.sku or "Listing",
            "price": l.price,
            "currency": l.currency,
            "condition": l.condition,
            "cover_url": covers.get(l.item_id) or cat_thumb,
            "status": l.status,
            "retail_price": l.retail_price or None,
        }
    return out


async def serialize_posts(
    db: AsyncSession,
    page_posts: list,
    current_user: Optional[User],
    followed_ids: Optional[set[str]] = None,
) -> list[dict]:
    """The one batched serializer behind every post-list surface (feed, saved,
    profile posts). Fixed query count regardless of page size: authors, viewer
    like/save flags, follow state, poll votes, community memberships + names,
    likers preview, tagged catalogue entries, shared-listing summaries."""
    if not page_posts:
        return []

    post_ids = [p.id for p in page_posts]

    author_ids = list({p.user_id for p in page_posts})
    users_result = await db.execute(select(User).where(User.id.in_(author_ids)))
    users_by_id = {u.id: u for u in users_result.scalars().all()}

    # v8 Sep-13 drop — ISO/Wanted cards show "@handle + vouch count", so every
    # post carries its author's received-vouch total (same grouped count the
    # market cards use, listings.py).
    vouch_rows = await db.execute(
        select(Vouch.to_user_id, func.count(Vouch.id))
        .where(Vouch.to_user_id.in_(author_ids))
        .group_by(Vouch.to_user_id)
    )
    vouches_by_author = dict(vouch_rows.all())

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

    if followed_ids is None:
        followed_ids = set()
        if current_user:
            follows = await db.execute(
                select(Follow.following_id).where(
                    Follow.follower_id == current_user.id,
                    Follow.following_type == "user",
                )
            )
            followed_ids = {str(r) for r in follows.scalars().all()}

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

    # v8 Cards.jsx:44 — the byline carries the home community's name inline.
    home_community_ids = {p.community_id for p in page_posts if p.community_id}
    community_names: dict = {}
    if home_community_ids:
        cn_rows = await db.execute(
            select(Community.id, Community.name).where(Community.id.in_(home_community_ids))
        )
        community_names = dict(cn_rows.all())

    # QA §5 — the three newest likers per post, for the social-proof strip.
    likers_by_post = await likers_preview(db, post_ids)

    # DV8 — batch-resolve tagged catalogue entries for the "Tagged item" chip.
    tagged_skus = {p.ref_sku for p in page_posts if p.ref_sku}
    cat_titles: dict = {}
    if tagged_skus:
        cat_rows = await db.execute(
            select(Catalogue.sku, Catalogue.title, Catalogue.brand).where(Catalogue.sku.in_(tagged_skus))
        )
        cat_titles = {sku: {"title": title, "brand": brand} for sku, title, brand in cat_rows.all()}

    # v8 Cards.jsx:844-898 — SharedListingCard data for share-to-feed posts.
    ref_listings = await listing_summaries(
        db, {p.ref_listing_id for p in page_posts if p.ref_listing_id}
    )

    return [
        _post_dict(
            p,
            users_by_id.get(p.user_id),
            p.id in liked_ids,
            p.id in saved_ids,
            str(p.user_id) in followed_ids,
            communities_by_post.get(p.id, []),
            poll_votes_by_post.get(p.id),
            likers_by_post.get(p.id, []),
            cat_titles.get(p.ref_sku or ""),
            community_names.get(p.community_id),
            ref_listings.get(p.ref_listing_id),
            vouches_by_author.get(p.user_id, 0),
        )
        for p in page_posts
    ]


def _feed_badge(author: Optional[User]) -> Optional[dict]:
    """The single rewards badge for an author (v3 §3), or None for a missing author."""
    if author is None:
        return None
    from app.services.gamification import feed_badge
    return feed_badge(author)


def _post_dict(p: Post, author: Optional[User], is_liked: bool, is_saved: bool, is_following: bool = False, community_ids: Optional[list] = None, my_poll_vote: Optional[int] = None, likers: Optional[list] = None, ref_entry: Optional[dict] = None, community_name: Optional[str] = None, ref_listing: Optional[dict] = None, vouches_count: int = 0) -> dict:
    return {
        # DV8 composer item-tagging — the tagged catalogue entry, when resolvable.
        "ref_sku": p.ref_sku,
        "ref_sku_title": (ref_entry or {}).get("title"),
        "ref_sku_brand": (ref_entry or {}).get("brand"),
        "id": str(p.id),
        "user_id": str(p.user_id),
        "handle": author.handle if author else None,
        "name": author.name if author else None,
        "avatar_url": author.avatar_url if author else None,
        # Rewards badge shown next to the author (v3 §2.4/§3): First Start badge if
        # the author has one, else their rank badge. Exactly one per post — and
        # None for staff, who carry the Official tag instead (QA 2026-08-04 §4).
        "badge": _feed_badge(author),
        # v8 Sep-13 drop — seller-trust line on ISO/Wanted cards.
        "vouches_count": vouches_count,
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
        # v8 Cards.jsx:44 — byline shows "@handle · {community} · time" when posted
        # into a community.
        "community_name": community_name,
        "community_ids": community_ids or [],
        # v8 Cards.jsx:844-898 SharedListingCard — listing summary for share-to-feed
        # posts (null on ordinary posts; prices in paise).
        "ref_listing": ref_listing,
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
