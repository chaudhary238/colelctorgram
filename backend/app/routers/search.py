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
from app.services.blocks import blocked_user_ids

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
    limit: int = Query(5, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cross-entity search. Returns up to `limit` rows per type PLUS a `counts` object
    with the true total per type (DV7-06).

    `counts` exists because the Explore scope chips show a number next to every scope
    including zero — and `len(rows)` lies as soon as a type saturates `limit`. Each count
    reuses that type's exact filter, so "Posts 34" and the Posts list can't disagree.
    Note the Explore tab takes its **Items** count from GET /catalogue/browse instead:
    browse ranks the whole live catalogue while `catalogue` here is approved-only.
    """
    pattern = f"%{q}%"

    async def _count(stmt) -> int:
        return (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()

    # B-69: exclude users in a block relationship with the viewer from people + post results.
    blocked = await blocked_user_ids(db, current_user.id)

    # vouches received per user — subquery so people rows can show "N deals · N vouches"
    vouch_sq = (
        select(Vouch.to_user_id, func.count().label("vouches"))
        .group_by(Vouch.to_user_id)
        .subquery()
    )
    users_base = (
        select(
            User.id,
            User.handle,
            User.name,
            User.avatar_url,
            func.coalesce(vouch_sq.c.vouches, 0).label("vouches"),
        )
        .outerjoin(vouch_sq, vouch_sq.c.to_user_id == User.id)
        .where(_match(q, pattern, User.name, User.handle))
    )
    if blocked:
        users_base = users_base.where(User.id.not_in(blocked))
    users_stmt = users_base.order_by(_rank(q, User.name, User.handle).desc()).limit(limit)
    users_q = await db.execute(users_stmt)
    users = [
        {
            "id": str(r.id),
            "handle": r.handle,
            "name": r.name,
            # DV7-06 — Explore's People rows show a real avatar, not just initials.
            "avatar_url": r.avatar_url,
            "vouches_count": r.vouches or 0,
        }
        for r in users_q
    ]

    posts_base = (
        select(Post.id, Post.type, Post.title, Post.body, Post.iso_item, Post.community_id,
               User.handle, User.name, User.avatar_url)
        .join(User, User.id == Post.user_id)
        # QA2 — a post that lives in an unapproved (pending/rejected) community must not
        # surface in search. Feed posts (community_id NULL) are unaffected.
        .outerjoin(Community, Community.id == Post.community_id)
        .where(
            Post.status == "published",
            or_(Post.community_id.is_(None), Community.status == "approved"),
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
    )
    if blocked:
        posts_base = posts_base.where(Post.user_id.not_in(blocked))
    posts_stmt = posts_base.order_by(Post.created_at.desc()).limit(limit)
    posts_q = await db.execute(posts_stmt)
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
            "avatar_url": r.avatar_url,  # DV7-06 — author avatar on Explore's Posts rows
            "community": com_names.get(r.community_id) if r.community_id else None,
        }
        for r in post_rows
    ]

    catalogue_base = (
        select(Catalogue.sku, Catalogue.title, Catalogue.brand, Catalogue.category, Catalogue.thumbnail_url)
        .where(
            # Visibility = status != removed (DV6-13); verification is a badge, not a gate.
            Catalogue.status != "removed",
            _match(q, pattern, Catalogue.title, Catalogue.brand, Catalogue.sku),
        )
    )
    catalogue_q = await db.execute(
        catalogue_base.order_by(_rank(q, Catalogue.title, Catalogue.brand).desc()).limit(limit)
    )
    catalogue = [
        {"sku": r.sku, "title": r.title, "brand": r.brand, "category": r.category, "thumbnail_url": r.thumbnail_url}
        for r in catalogue_q
    ]

    communities_base = (
        select(Community.id, Community.name, Community.description, Community.category, Community.member_count)
        # QA2 — only approved communities are discoverable; pending/rejected ones stay hidden.
        .where(
            Community.status == "approved",
            _match(q, pattern, Community.name, Community.description),
        )
    )
    communities_q = await db.execute(
        communities_base.order_by(_rank(q, Community.name).desc()).limit(limit)
    )
    communities = [
        {"id": r.id, "name": r.name, "description": r.description, "category": r.category, "member_count": r.member_count}
        for r in communities_q
    ]

    events_base = (
        select(Event.id, Event.title, Event.city, Event.mode, Event.starts_at)
        .where(
            Event.status == "active",
            _match(q, pattern, Event.title, Event.city, Event.venue),
        )
    )
    events_q = await db.execute(
        events_base.order_by(_rank(q, Event.title).desc()).limit(limit)
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
        # True totals — NOT len(rows above), which saturates at `limit` (DV7-06).
        "counts": {
            "users": await _count(users_base),
            "posts": await _count(posts_base),
            "catalogue": await _count(catalogue_base),
            "communities": await _count(communities_base),
            "events": await _count(events_base),
        },
    }
