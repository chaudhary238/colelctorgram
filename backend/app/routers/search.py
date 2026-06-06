from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.models.user import User
from app.models.catalogue import Catalogue
from app.models.listing import Listing
from app.models.community import Community
from app.models.event import Event

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def global_search(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, le=10),
    db: AsyncSession = Depends(get_db),
):
    pattern = f"%{q}%"

    users_q = await db.execute(
        select(User.id, User.handle, User.name)
        .where(or_(User.handle.ilike(pattern), User.name.ilike(pattern)))
        .limit(limit)
    )
    users = [{"id": str(r.id), "handle": r.handle, "name": r.name} for r in users_q]

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

    listings_q = await db.execute(
        select(Listing.id, Listing.sku, Listing.price, Listing.condition, Listing.ships_from_city)
        .where(
            Listing.status == "available",
            or_(Listing.sku.ilike(pattern), Listing.notes.ilike(pattern)),
        )
        .limit(limit)
    )
    listings = [
        {"id": str(r.id), "sku": r.sku, "price": r.price, "condition": r.condition, "city": r.ships_from_city}
        for r in listings_q
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
        "catalogue": catalogue,
        "listings": listings,
        "communities": communities,
        "events": events,
    }
