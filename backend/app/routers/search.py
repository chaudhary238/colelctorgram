from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.catalogue import Catalogue
from app.models.community import Community
from app.models.event import Event
from app.models.post import Post
from app.models.deal import Vouch

router = APIRouter(prefix="/search", tags=["search"])

# pg_trgm fuzzy threshold (migration e4a7c2f9b8d1). word_similarity(q, col) >= this
# tolerates typos/partial words; 0.4 ≈ "one typo in a short term" without much noise.
SIM_THRESHOLD = 0.4
# Trending interest boost: an in-interest tag's count is scaled by this when ranking,
# so a collector's categories float up without hiding genuinely huge global trends.
INTEREST_BOOST = 1.6


def _match(q: str, pattern: str, *cols):
    """Substring (index-backed ILIKE) OR trigram fuzzy match across the given columns."""
    conds = []
    for c in cols:
        conds.append(c.ilike(pattern))
        conds.append(func.word_similarity(q, c) >= SIM_THRESHOLD)
    return or_(*conds)


def _rank(q: str, *cols):
    """Relevance score = best trigram word-similarity across columns (for ORDER BY)."""
    sims = [func.word_similarity(q, c) for c in cols]
    return func.greatest(*sims) if len(sims) > 1 else sims[0]


@router.get("/trending")
async def trending(
    limit: int = Query(5, le=10),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """DF-31 — 'Trending now' ranked terms for the search empty state.

    Stays a GLOBAL discovery rail (real hashtag counts over recent published posts —
    so a collector can still discover a category they haven't opted into), but
    interest-boosted: a term whose dominant category is in the viewer's interests has
    its count scaled by INTEREST_BOOST for ranking only. Displayed count = real count.
    """
    since = datetime.now(timezone.utc) - timedelta(days=30)
    # Explode tags so we can attach each post's category, then take the dominant
    # category per tag (mode) alongside the real usage count.
    exploded = (
        select(
            func.unnest(Post.tags).label("tag"),
            Post.category.label("category"),
        )
        .where(Post.status == "published", Post.created_at >= since)
        .subquery()
    )
    rows = await db.execute(
        select(
            exploded.c.tag,
            func.count().label("n"),
            func.mode().within_group(exploded.c.category).label("top_cat"),
        )
        .group_by(exploded.c.tag)
        .order_by(func.count().desc())
        # Pull a wider pool than `limit` so the interest boost can reorder before trimming.
        .limit(max(limit * 4, 20))
    )
    interests = set(current_user.interests or [])
    pool = [
        {"term": r.tag, "count": r.n, "top_cat": r.top_cat}
        for r in rows
        if r.tag
    ]
    # Boost in-interest terms for ordering; real count is still what we display.
    pool.sort(
        key=lambda t: t["count"] * (INTEREST_BOOST if t["top_cat"] in interests else 1.0),
        reverse=True,
    )
    # The hottest two terms get the 🔥 flag, the rest 📈 (mirrors v3 SearchOverlay).
    items = [
        {"rank": i + 1, "term": t["term"], "count": t["count"], "hot": i < 2}
        for i, t in enumerate(pool[:limit])
    ]
    return {"trending": items}


@router.get("")
async def global_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, le=10),
    db: AsyncSession = Depends(get_db),
):
    pattern = f"%{q}%"

    # vouches received per user — subquery so people rows can show "N deals · N vouches"
    vouch_sq = (
        select(Vouch.to_user_id, func.count().label("vouches"))
        .group_by(Vouch.to_user_id)
        .subquery()
    )
    users_q = await db.execute(
        select(
            User.id,
            User.handle,
            User.name,
            User.tier,
            User.deals_count,
            func.coalesce(vouch_sq.c.vouches, 0).label("vouches"),
        )
        .outerjoin(vouch_sq, vouch_sq.c.to_user_id == User.id)
        .where(_match(q, pattern, User.name, User.handle))
        .order_by(_rank(q, User.name, User.handle).desc())
        .limit(limit)
    )
    users = [
        {
            "id": str(r.id),
            "handle": r.handle,
            "name": r.name,
            "tier": r.tier,
            "deals_count": r.deals_count or 0,
            "vouches_count": r.vouches or 0,
        }
        for r in users_q
    ]

    posts_q = await db.execute(
        select(Post.id, Post.type, Post.title, Post.body, Post.iso_item, Post.community_id, User.handle, User.name)
        .join(User, User.id == Post.user_id)
        .where(
            Post.status == "published",
            or_(
                Post.body.ilike(pattern),
                Post.title.ilike(pattern),
                Post.iso_item.ilike(pattern),
                # Trending terms are hashtags from Post.tags (e.g. "#NewDrops"); without this
                # a tag-only post (text doesn't contain the hashtag) returns 0 results when a
                # user taps a trending term. Match against the joined tag list too.
                func.array_to_string(Post.tags, " ").ilike(pattern),
            ),
        )
        .order_by(Post.created_at.desc())
        .limit(limit)
    )
    post_rows = list(posts_q)
    # resolve community names in one pass
    com_ids = {r.community_id for r in post_rows if r.community_id}
    com_names: dict[str, str] = {}
    if com_ids:
        cres = await db.execute(select(Community.id, Community.name).where(Community.id.in_(com_ids)))
        com_names = {r.id: r.name for r in cres}
    def _snippet(text: str | None) -> str:
        t = text or ""
        return t[:80] + "…" if len(t) > 80 else t

    posts = [
        {
            "id": str(r.id),
            "type": r.type,
            "snippet": _snippet(r.iso_item or r.title or r.body),
            "handle": r.handle,
            "name": r.name,
            "community": com_names.get(r.community_id) if r.community_id else None,
        }
        for r in post_rows
    ]

    catalogue_q = await db.execute(
        select(Catalogue.sku, Catalogue.title, Catalogue.brand, Catalogue.category, Catalogue.thumbnail_url)
        .where(
            Catalogue.is_approved == True,
            _match(q, pattern, Catalogue.title, Catalogue.brand, Catalogue.sku),
        )
        .order_by(_rank(q, Catalogue.title, Catalogue.brand).desc())
        .limit(limit)
    )
    catalogue = [
        {"sku": r.sku, "title": r.title, "brand": r.brand, "category": r.category, "thumbnail_url": r.thumbnail_url}
        for r in catalogue_q
    ]

    communities_q = await db.execute(
        select(Community.id, Community.name, Community.description, Community.category, Community.member_count)
        .where(_match(q, pattern, Community.name, Community.description))
        .order_by(_rank(q, Community.name).desc())
        .limit(limit)
    )
    communities = [
        {"id": r.id, "name": r.name, "description": r.description, "category": r.category, "member_count": r.member_count}
        for r in communities_q
    ]

    events_q = await db.execute(
        select(Event.id, Event.title, Event.city, Event.mode, Event.starts_at)
        .where(
            Event.status == "active",
            _match(q, pattern, Event.title, Event.city, Event.venue),
        )
        .order_by(_rank(q, Event.title).desc())
        .limit(limit)
    )
    events = [
        {"id": str(r.id), "title": r.title, "city": r.city, "mode": r.mode, "starts_at": r.starts_at.isoformat()}
        for r in events_q
    ]

    return {
        "users": users,
        "posts": posts,
        "catalogue": catalogue,
        "communities": communities,
        "events": events,
    }
