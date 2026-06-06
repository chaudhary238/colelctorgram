import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, Follow
from app.models.item import Item
from app.models.listing import Listing
from app.models.post import Post

router = APIRouter(prefix="/users", tags=["users"])


class ProfileOut(BaseModel):
    id: uuid.UUID
    handle: str
    name: str
    bio: Optional[str]
    city: Optional[str]
    avatar_url: Optional[str]
    tier: str
    interests: list[str]
    deals_count: int
    rating: float
    rating_count: int
    followers_count: int
    following_count: int
    active_listings_count: int
    verified_items_count: int

    model_config = {"from_attributes": True}


class EditProfileBody(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    interests: Optional[list[str]] = None
    privacy_portfolio: Optional[str] = None
    privacy_value: Optional[str] = None


@router.get("/me", response_model=ProfileOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=ProfileOut)
async def edit_me(
    body: EditProfileBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.add(current_user)
    return current_user


@router.get("/{handle}", response_model=ProfileOut)
async def get_profile(handle: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.handle == handle.lower()))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/{handle}/follow", status_code=204)
async def follow_user(
    handle: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    existing = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.following_type == "user",
            Follow.following_id == target_user.id,
        )
    )
    if existing.scalar_one_or_none():
        return  # already following

    db.add(Follow(follower_id=current_user.id, following_type="user", following_id=target_user.id))
    target_user.followers_count += 1
    current_user.following_count += 1


class FollowUserOut(BaseModel):
    handle: str
    name: str
    avatar_url: Optional[str]
    tier: str

    model_config = {"from_attributes": True}


@router.get("/{handle}/followers", response_model=list[FollowUserOut])
async def list_followers(
    handle: str,
    db: AsyncSession = Depends(get_db),
    limit: int = 40,
    offset: int = 0,
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(User)
        .join(Follow, (Follow.follower_id == User.id) & (Follow.following_type == "user") & (Follow.following_id == target_user.id))
        .order_by(Follow.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/{handle}/following", response_model=list[FollowUserOut])
async def list_following(
    handle: str,
    db: AsyncSession = Depends(get_db),
    limit: int = 40,
    offset: int = 0,
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(User)
        .join(Follow, (Follow.following_id == User.id) & (Follow.following_type == "user") & (Follow.follower_id == target_user.id))
        .order_by(Follow.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/{handle}/posts")
async def get_user_posts(
    handle: str,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = (
        select(Post)
        .where(Post.user_id == target_user.id)
        .order_by(Post.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(stmt)
    posts = result.scalars().all()
    return {
        "page": page,
        "items": [
            {
                "id": str(p.id),
                "type": p.type,
                "body": p.body,
                "images": p.images,
                "category": p.category,
                "likes_count": p.likes_count,
                "comments_count": p.comments_count,
                "saves_count": p.saves_count,
                "created_at": p.created_at.isoformat(),
            }
            for p in posts
        ],
    }


@router.get("/{handle}/collection")
async def get_collection(
    handle: str,
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(24, le=60),
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = select(Item).where(Item.user_id == target_user.id, Item.privacy == "public")
    if status:
        stmt = stmt.where(Item.status == status)
    stmt = stmt.order_by(Item.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return {
        "page": page,
        "items": [
            {
                "id": str(i.id),
                "sku": i.sku,
                "custom_title": i.custom_title,
                "status": i.status,
                "verify_tier": i.verify_tier,
                "value": i.value,
                "is_listed": i.is_listed,
                "photo_count": i.photo_count,
                "created_at": i.created_at.isoformat(),
            }
            for i in items
        ],
    }


@router.get("/{handle}/listings")
async def get_user_listings(
    handle: str,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(24, le=60),
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = (
        select(Listing)
        .where(Listing.seller_id == target_user.id, Listing.status == "available")
        .order_by(Listing.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(stmt)
    listings = result.scalars().all()
    return {
        "page": page,
        "items": [
            {
                "id": str(l.id),
                "sku": l.sku,
                "price": l.price,
                "condition": l.condition,
                "trade_willing": l.trade_willing,
                "ships_from_city": l.ships_from_city,
                "saves_count": l.saves_count,
                "created_at": l.created_at.isoformat(),
            }
            for l in listings
        ],
    }


@router.delete("/{handle}/follow", status_code=204)
async def unfollow_user(
    handle: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.following_type == "user",
            Follow.following_id == target_user.id,
        )
    )
    follow = result.scalar_one_or_none()
    if follow:
        await db.delete(follow)
        target_user.followers_count = max(0, target_user.followers_count - 1)
        current_user.following_count = max(0, current_user.following_count - 1)
