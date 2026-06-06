import uuid
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.deal import Deal, Vouch
from app.models.listing import Listing
from app.models.user import User

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
    if deal.buyer_id != current_user.id and deal.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not a participant")
    if deal.status != "pending":
        raise HTTPException(status_code=400, detail="Deal already resolved")

    deal.status = "confirmed"
    deal.confirmed_at = datetime.now(timezone.utc)

    # Update seller's deal count
    seller_result = await db.execute(select(User).where(User.id == deal.seller_id))
    seller = seller_result.scalar_one_or_none()
    if seller:
        seller.deals_count += 1


@router.post("/{deal_id}/rate", status_code=204)
async def rate_deal(
    deal_id: uuid.UUID,
    body: RateDealBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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
