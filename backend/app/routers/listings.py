import asyncio
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.listing import Listing, ListingSave
from app.models.item import Item
from app.models.catalogue import Catalogue
from app.models.user import User
from app.workers.tasks import dispatch_wishlist_notifications

_bg_tasks: set = set()

router = APIRouter(prefix="/listings", tags=["listings"])


class CreateListingBody(BaseModel):
    item_id: uuid.UUID
    price: int  # paise
    condition: str
    condition_notes: Optional[str] = None
    qty: int = 1
    trade_willing: bool = False
    ships_from_city: Optional[str] = None
    ships_nationwide: bool = True
    shipping_cost: int = 0
    notes: Optional[str] = None
    terms: list[str] = []


class UpdateListingBody(BaseModel):
    price: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_listing(
    body: CreateListingBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item_result = await db.execute(
        select(Item).where(Item.id == body.item_id, Item.user_id == current_user.id)
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.verify_tier == "claimed":
        raise HTTPException(status_code=400, detail="Item must be 'shown' or 'verified' to list for sale")

    listing = Listing(
        item_id=item.id,
        seller_id=current_user.id,
        sku=item.sku,
        price=body.price,
        condition=body.condition,
        condition_notes=body.condition_notes,
        qty=body.qty,
        trade_willing=body.trade_willing,
        ships_from_city=body.ships_from_city,
        ships_nationwide=body.ships_nationwide,
        shipping_cost=body.shipping_cost,
        notes=body.notes,
        terms=body.terms,
    )
    db.add(listing)
    item.is_listed = True
    current_user.active_listings_count += 1
    await db.flush()
    task = asyncio.create_task(dispatch_wishlist_notifications(str(listing.id)))
    _bg_tasks.add(task)
    task.add_done_callback(_bg_tasks.discard)
    return {"id": str(listing.id)}


@router.get("")
async def browse_listings(
    page: int = Query(1, ge=1),
    limit: int = Query(24, le=60),
    condition: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    city: Optional[str] = None,
    trade: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    viewer: Optional[User] = Depends(get_optional_user),
):
    stmt = select(Listing).where(Listing.status == "available")
    if condition:
        stmt = stmt.where(Listing.condition == condition)
    if min_price is not None:
        stmt = stmt.where(Listing.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Listing.price <= max_price)
    if city:
        stmt = stmt.where(Listing.ships_from_city == city)
    if trade is not None:
        stmt = stmt.where(Listing.trade_willing == trade)

    stmt = stmt.order_by(Listing.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    listings = result.scalars().all()

    enriched = await _enrich_listings(listings, db, viewer)
    return {"page": page, "limit": limit, "items": enriched}


@router.get("/{listing_id}")
async def get_listing(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    viewer: Optional[User] = Depends(get_optional_user),
):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    enriched = await _enrich_listings([listing], db, viewer)
    return enriched[0]


@router.patch("/{listing_id}")
async def update_listing(
    listing_id: uuid.UUID,
    body: UpdateListingBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Listing).where(Listing.id == listing_id, Listing.seller_id == current_user.id)
    )
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(listing, field, value)
    enriched = await _enrich_listings([listing], db)
    return enriched[0]


@router.post("/{listing_id}/save", status_code=204)
async def toggle_save(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing_result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = listing_result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    existing = await db.execute(
        select(ListingSave).where(
            ListingSave.user_id == current_user.id,
            ListingSave.listing_id == listing_id,
        )
    )
    save = existing.scalar_one_or_none()
    if save:
        await db.delete(save)
        listing.saves_count = max(0, listing.saves_count - 1)
    else:
        db.add(ListingSave(user_id=current_user.id, listing_id=listing_id))
        listing.saves_count += 1


async def _enrich_listings(listings: list[Listing], db: AsyncSession, viewer: Optional[User] = None) -> list[dict]:
    if not listings:
        return []

    seller_ids = list({l.seller_id for l in listings})
    item_ids = list({l.item_id for l in listings})
    skus = list({l.sku for l in listings if l.sku})

    sellers_result = await db.execute(select(User).where(User.id.in_(seller_ids)))
    sellers = {u.id: u for u in sellers_result.scalars().all()}

    items_result = await db.execute(select(Item).where(Item.id.in_(item_ids)))
    items = {i.id: i for i in items_result.scalars().all()}

    cats_result = await db.execute(select(Catalogue).where(Catalogue.sku.in_(skus))) if skus else None
    cats = {c.sku: c for c in (cats_result.scalars().all() if cats_result else [])}

    # Which of these listings has the viewer saved?
    saved_ids: set = set()
    if viewer:
        listing_ids = [l.id for l in listings]
        saves_result = await db.execute(
            select(ListingSave.listing_id).where(
                ListingSave.user_id == viewer.id,
                ListingSave.listing_id.in_(listing_ids),
            )
        )
        saved_ids = set(saves_result.scalars().all())

    out = []
    for l in listings:
        seller = sellers.get(l.seller_id)
        item = items.get(l.item_id)
        cat = cats.get(l.sku) if l.sku else None

        title = (cat.title if cat else None) or (item.custom_title if item else None) or l.sku or "Unknown item"
        category = cat.category if cat else None
        verify_tier = item.verify_tier if item else "claimed"

        out.append({
            "id": str(l.id),
            "item_id": str(l.item_id),
            "seller_id": str(l.seller_id),
            "sku": l.sku,
            "title": title,
            "category": category,
            "verify_tier": verify_tier,
            # seller
            "handle": seller.handle if seller else None,
            "name": seller.name if seller else None,
            "avatar_url": seller.avatar_url if seller else None,
            "tier": seller.tier if seller else "verified",
            "rating": float(seller.rating) if seller else 0,
            "deals_count": seller.deals_count if seller else 0,
            # listing
            "price": l.price,
            "retail_price": l.retail_price,
            "qty": l.qty,
            "condition": l.condition,
            "condition_notes": l.condition_notes,
            "trade_willing": l.trade_willing,
            "ships_from_city": l.ships_from_city,
            "ships_nationwide": l.ships_nationwide,
            "shipping_cost": l.shipping_cost,
            "notes": l.notes,
            "terms": l.terms or [],
            "status": l.status,
            "saves_count": l.saves_count,
            "watching_count": l.watching_count,
            "is_saved": l.id in saved_ids,
            "created_at": l.created_at.isoformat(),
        })
    return out
