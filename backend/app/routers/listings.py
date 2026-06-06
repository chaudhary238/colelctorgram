import asyncio
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.dependencies import get_current_user
from app.models.listing import Listing, ListingSave
from app.models.item import Item
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

    return {
        "page": page,
        "limit": limit,
        "items": [_listing_dict(l) for l in listings],
    }


@router.get("/{listing_id}")
async def get_listing(listing_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _listing_dict(listing)


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
    return _listing_dict(listing)


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


def _listing_dict(l: Listing) -> dict:
    return {
        "id": str(l.id),
        "item_id": str(l.item_id),
        "seller_id": str(l.seller_id),
        "sku": l.sku,
        "price": l.price,
        "condition": l.condition,
        "condition_notes": l.condition_notes,
        "trade_willing": l.trade_willing,
        "ships_from_city": l.ships_from_city,
        "ships_nationwide": l.ships_nationwide,
        "shipping_cost": l.shipping_cost,
        "notes": l.notes,
        "status": l.status,
        "saves_count": l.saves_count,
        "created_at": l.created_at.isoformat(),
    }
