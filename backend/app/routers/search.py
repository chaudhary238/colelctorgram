from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from datetime import datetime, timedelta, timezone

from app.database import get_db
from app.models.user import User
from app.models.catalogue import Catalogue
from app.models.community import Community
from app.models.event import Event
from app.models.post import Post
from app.models.deal import Vouch

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/trending")
async def trending(
    limit: int = Query(5, le=10),
    db: AsyncSession = Depends(get_db),
):
    """DF-31 — 'Trending now' ranked terms for the search empty state.
    Derived from hashtags on recent published posts (real counts), most-used first."""
    since = datetime.now(timezone.utc) - timedelta(days=30)
    tag = func.unnest(Post.tags).label("tag")
    rows = await db.execute(
        select(tag, func.count().label("n"))
        .where(Post.status == "published", Post.created_at >= since)
        .group_by(tag)
        .order_by(func.count().desc())
        .limit(limit)
    )
    # The hottest two terms get the 🔥 flag, the rest 📈 (mirrors v3 SearchOverlay).
    items = [
        {"rank": i + 1, "term": r.tag, "count": r.n, "hot": i < 2}
        for i, r in enumerate(rows)
        if r.tag
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
        .where(or_(User.handle.ilike(pattern), User.name.ilike(pattern)))
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
            or_(
                Catalogue.title.ilike(pattern),
                Catalogue.brand.ilike(pattern),
                Catalogue.sku.ilike(pattern),
            ),
        )
        .limit(limit)
    )
    catalogue = [
        {"sku": r.sku, "title": r.title, "brand": r.brand, "category": r.category, "thumbnail_url": r.thumbnail_url}
        for r in catalogue_q
    ]

    communities_q = await db.execute(
        select(Community.id, Community.name, Community.description, Community.category, Community.member_count)
        .where(or_(Community.name.ilike(pattern), Community.description.ilike(pattern)))
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
            or_(
                Event.title.ilike(pattern),
                Event.city.ilike(pattern),
                Event.venue.ilike(pattern),
            ),
        )
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
