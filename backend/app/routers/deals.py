import uuid
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import get_current_user
from app.models.deal import Deal, Vouch
from app.models.listing import Listing
from app.models.item import Item
from app.models.user import User
from app.services.notifications import notify

router = APIRouter(prefix="/deals", tags=["deals"])


class InitDealBody(BaseModel):
    item_id: uuid.UUID
    buyer_id: uuid.UUID
    listing_id: Optional[uuid.UUID] = None
    agreed_price: Optional[int] = None
    deal_type: str = "sale"


class RateDealBody(BaseModel):
    rating: int
    vouch_body: Optional[str] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def init_deal(
    body: InitDealBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # current_user is asserting they are the seller — verify they own the item
    item = (await db.execute(select(Item).where(Item.id == body.item_id))).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the item owner can record a sale")
    if body.buyer_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot create a deal with yourself")

    deal = Deal(
        listing_id=body.listing_id,
        item_id=body.item_id,
        seller_id=current_user.id,
        buyer_id=body.buyer_id,
        agreed_price=body.agreed_price,
        deal_type=body.deal_type,
        initiated_by="seller",
    )
    db.add(deal)
    await db.flush()
    return {"id": str(deal.id), "status": deal.status}


@router.post("/{deal_id}/confirm", status_code=204)
async def confirm_deal(
    deal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    # Seller initiates; only the counterparty (buyer) can confirm — prevents self-confirm.
    if current_user.id != deal.buyer_id:
        raise HTTPException(status_code=403, detail="Only the buyer can confirm this deal")
    if deal.status != "pending":
        raise HTTPException(status_code=400, detail="Deal already resolved")

    deal.status = "confirmed"
    deal.confirmed_at = datetime.now(timezone.utc)

    # Credit both parties' completed-deal counts
    parties = await db.execute(select(User).where(User.id.in_([deal.seller_id, deal.buyer_id])))
    for u in parties.scalars().all():
        u.deals_count += 1

    # Close the listing if the deal was tied to one
    if deal.listing_id:
        lst = (await db.execute(select(Listing).where(Listing.id == deal.listing_id))).scalar_one_or_none()
        if lst and lst.status != "sold":
            lst.status = "sold"
            lst.closed_at = datetime.now(timezone.utc)

    # Let the seller know their buyer confirmed
    notify(
        db,
        user_id=deal.seller_id,
        kind="deal",
        title="Deal confirmed",
        body=f"{current_user.name} confirmed the deal. Leave a vouch to build trust.",
        ref_type="listing",
        ref_id=str(deal.listing_id) if deal.listing_id else None,
    )


@router.post("/{deal_id}/rate", status_code=204)
async def rate_deal(
    deal_id: uuid.UUID,
    body: RateDealBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    if deal.status != "confirmed":
        raise HTTPException(status_code=400, detail="Can only rate confirmed deals")

    is_seller = deal.seller_id == current_user.id
    is_buyer = deal.buyer_id == current_user.id
    if not is_seller and not is_buyer:
        raise HTTPException(status_code=403, detail="Not a participant")

    if is_seller and not deal.seller_vouch_done:
        deal.seller_rating = body.rating
        deal.seller_vouch_done = True
        target_id = deal.buyer_id
    elif is_buyer and not deal.buyer_vouch_done:
        deal.buyer_rating = body.rating
        deal.buyer_vouch_done = True
        target_id = deal.seller_id
    else:
        raise HTTPException(status_code=400, detail="Already rated this deal")

    db.add(Vouch(
        from_user_id=current_user.id,
        to_user_id=target_id,
        deal_id=deal_id,
        kind="trade_vouch",
        rating=body.rating,
        body=body.vouch_body,
    ))
    await db.flush()

    # Recompute the rated user's aggregate rating from all received vouches
    agg = await db.execute(
        select(func.count(Vouch.id), func.avg(Vouch.rating))
        .where(Vouch.to_user_id == target_id, Vouch.rating.isnot(None))
    )
    count, avg = agg.one()
    target = (await db.execute(select(User).where(User.id == target_id))).scalar_one_or_none()
    if target:
        target.rating_count = count or 0
        target.rating = round(float(avg), 2) if avg is not None else 0

    notify(
        db,
        user_id=target_id,
        kind="vouch",
        title="New vouch",
        body=f"{current_user.name} rated you {body.rating}★ on a completed deal.",
        ref_type="profile",
        ref_id=current_user.handle,
    )
