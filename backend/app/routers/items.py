import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.item import Item, ItemPhoto
from app.models.user import User

router = APIRouter(prefix="/items", tags=["items"])


class AddItemBody(BaseModel):
    sku: Optional[str] = None
    custom_title: Optional[str] = None
    status: str = "owned"
    value: int = 0
    privacy: str = "public"
    preorder_eta: Optional[str] = None
    wishlist_alert_enabled: bool = False


class UpdateItemBody(BaseModel):
    status: Optional[str] = None
    value: Optional[int] = None
    privacy: Optional[str] = None
    preorder_eta: Optional[str] = None
    wishlist_alert_enabled: Optional[bool] = None


class ItemOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    sku: Optional[str]
    custom_title: Optional[str]
    status: str
    verify_tier: str
    value: int
    is_listed: bool
    photo_count: int
    privacy: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
async def add_item(
    body: AddItemBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.sku and not body.custom_title:
        raise HTTPException(status_code=400, detail="Either sku or custom_title required")
    item = Item(
        user_id=current_user.id,
        sku=body.sku,
        custom_title=body.custom_title,
        status=body.status,
        value=body.value,
        privacy=body.privacy,
        preorder_eta=body.preorder_eta,
        wishlist_alert_enabled=body.wishlist_alert_enabled,
    )
    db.add(item)
    await db.flush()
    return _item_out(item)


@router.get("/{item_id}", response_model=ItemOut)
async def get_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return _item_out(item)


@router.patch("/{item_id}", response_model=ItemOut)
async def update_item(
    item_id: uuid.UUID,
    body: UpdateItemBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.id == item_id, Item.user_id == current_user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    return _item_out(item)


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.id == item_id, Item.user_id == current_user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)


@router.post("/{item_id}/verify", status_code=200)
async def verify_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.id == item_id, Item.user_id == current_user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.verify_tier != "shown":
        raise HTTPException(status_code=400, detail="Item must have a photo to verify")
    item.verify_tier = "verified"
    current_user.verified_items_count += 1
    return {"verify_tier": "verified"}


@router.post("/{item_id}/photos", status_code=201)
async def add_photo(
    item_id: uuid.UUID,
    url: str,
    is_verify_photo: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.id == item_id, Item.user_id == current_user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    photo = ItemPhoto(item_id=item.id, url=url, is_verify_photo=is_verify_photo)
    db.add(photo)
    item.photo_count += 1

    if is_verify_photo and item.verify_tier == "claimed":
        item.verify_tier = "shown"

    return {"id": str(photo.id), "url": url, "verify_tier": item.verify_tier}


def _item_out(item: Item) -> dict:
    return {
        "id": str(item.id),
        "user_id": str(item.user_id),
        "sku": item.sku,
        "custom_title": item.custom_title,
        "status": item.status,
        "verify_tier": item.verify_tier,
        "value": item.value,
        "is_listed": item.is_listed,
        "photo_count": item.photo_count,
        "privacy": item.privacy,
        "created_at": item.created_at.isoformat(),
    }
