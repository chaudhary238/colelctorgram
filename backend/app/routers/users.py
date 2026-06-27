import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.user import User, Follow
from app.models.item import Item
from app.models.listing import Listing
from app.models.post import Post, PostLike, PostSave
from app.models.deal import Deal
from app.models.community import Community, CommunityMember
from app.routers.communities import _community_dict
from app.services.notifications import notify

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
    portfolio_value: int = 0  # paise — sum of owned-item value
    # follow state relative to the requesting user (false for self / anon)
    is_following: bool = False
    # private fields — only populated for /users/me
    email: Optional[str] = None
    privacy_portfolio: Optional[str] = None
    privacy_value: Optional[str] = None
    gender: Optional[str] = None
    birth_year: Optional[int] = None
    feed_prefs: Optional[dict] = None
    notif_prefs: Optional[dict] = None
    privacy_prefs: Optional[dict] = None
    email_verified: Optional[bool] = None

    model_config = {"from_attributes": True}


# Defaults for the settings prefs (DF-23) so the client always gets a full object,
# even for users created before the columns existed (seed rows have NULL).
DEFAULT_NOTIF_PREFS = {
    "followers": True, "messages": True, "listing_activity": True,
    "trade_requests": True, "event_reminders": True, "community_activity": False,
    "price_drops": True, "new_listings": False,
}
DEFAULT_PRIVACY_PREFS = {
    "messaging": "everyone",   # everyone | followers | none
    "wishlist": "followers",   # public | followers | private
    "show_online": True,
}


def _fill_pref_defaults(out: "ProfileOut") -> "ProfileOut":
    out.notif_prefs = {**DEFAULT_NOTIF_PREFS, **(out.notif_prefs or {})}
    out.privacy_prefs = {**DEFAULT_PRIVACY_PREFS, **(out.privacy_prefs or {})}
    return out


class EditProfileBody(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    interests: Optional[list[str]] = None
    privacy_portfolio: Optional[str] = None
    privacy_value: Optional[str] = None
    gender: Optional[str] = None        # 'f' | 'm' | 'x' (DF-01 / DF-22)
    birth_year: Optional[int] = None    # DF-05
    feed_prefs: Optional[dict] = None   # {"categories": [...], "hide_listings": bool} (DF-08)
    notif_prefs: Optional[dict] = None  # per-type notification toggles (DF-23)
    privacy_prefs: Optional[dict] = None  # messaging / wishlist visibility / show-online (DF-23)


class SuggestedUserOut(BaseModel):
    id: uuid.UUID
    handle: str
    name: str
    tier: str
    followers_count: int
    verified_items_count: int

    model_config = {"from_attributes": True}


@router.get("/me", response_model=ProfileOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return _fill_pref_defaults(ProfileOut.model_validate(current_user))


@router.get("/me/suggested", response_model=list[SuggestedUserOut])
async def get_suggested(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 8,
):
    """Return users with shared interests that the current user doesn't already follow."""
    following_ids_q = await db.execute(
        select(Follow.following_id).where(
            Follow.follower_id == current_user.id,
            Follow.following_type == "user",
        )
    )
    following_ids = {row[0] for row in following_ids_q.all()}
    following_ids.add(current_user.id)

    stmt = (
        select(User)
        .where(User.id.not_in(following_ids))
        .where(User.is_suspended == False)  # noqa: E712
        .order_by(User.followers_count.desc(), User.verified_items_count.desc())
        .limit(limit)
    )
    if current_user.interests:
        stmt = stmt.where(User.interests.overlap(current_user.interests))

    result = await db.execute(stmt)
    rows = result.scalars().all()
    if not rows:
        # Fallback: no interest overlap — return anyone not followed
        result2 = await db.execute(
            select(User)
            .where(User.id.not_in(following_ids), User.is_suspended == False)  # noqa: E712
            .order_by(User.followers_count.desc())
            .limit(limit)
        )
        rows = result2.scalars().all()
    return rows


@router.get("/me/saved")
async def get_saved_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Posts the current user has bookmarked, newest-saved first (paginated)."""
    from app.routers.feed import _post_dict

    saves_q = await db.execute(
        select(PostSave.post_id)
        .where(PostSave.user_id == current_user.id)
        .order_by(PostSave.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    saved_post_ids = list(saves_q.scalars().all())
    if not saved_post_ids:
        return {"page": page, "limit": limit, "items": []}

    posts_result = await db.execute(select(Post).where(Post.id.in_(saved_post_ids)))
    posts_by_id = {p.id: p for p in posts_result.scalars().all()}
    # Preserve save-order (newest saved first)
    ordered = [posts_by_id[pid] for pid in saved_post_ids if pid in posts_by_id]

    author_ids = list({p.user_id for p in ordered})
    users_result = await db.execute(select(User).where(User.id.in_(author_ids)))
    users_by_id = {u.id: u for u in users_result.scalars().all()}

    liked_q = await db.execute(
        select(PostLike.post_id).where(
            PostLike.user_id == current_user.id,
            PostLike.post_id.in_(saved_post_ids),
        )
    )
    liked_ids = set(liked_q.scalars().all())

    follows_q = await db.execute(
        select(Follow.following_id).where(
            Follow.follower_id == current_user.id,
            Follow.following_type == "user",
        )
    )
    followed_ids = {str(r) for r in follows_q.scalars().all()}

    return {
        "page": page,
        "limit": limit,
        "items": [
            _post_dict(
                p,
                users_by_id.get(p.user_id),
                p.id in liked_ids,
                True,  # every post here is saved by definition
                str(p.user_id) in followed_ids,
            )
            for p in ordered
        ],
    }


@router.patch("/me", response_model=ProfileOut)
async def edit_me(
    body: EditProfileBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.add(current_user)
    await db.flush()
    return _fill_pref_defaults(ProfileOut.model_validate(current_user))


@router.get("/{handle}", response_model=ProfileOut)
async def get_profile(
    handle: str,
    db: AsyncSession = Depends(get_db),
    viewer: Optional[User] = Depends(get_optional_user),
):
    result = await db.execute(select(User).where(User.handle == handle.lower()))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    out = ProfileOut.model_validate(user)
    is_self = bool(viewer and viewer.id == user.id)
    if is_self:
        _fill_pref_defaults(out)
    else:
        # private fields are only for the owner (see /users/me)
        out.email = None
        out.privacy_portfolio = None
        out.privacy_value = None
        out.gender = None
        out.birth_year = None
        out.feed_prefs = None
        out.notif_prefs = None
        out.privacy_prefs = None
        out.email_verified = None
        if viewer:
            follow = await db.execute(
                select(Follow).where(
                    Follow.follower_id == viewer.id,
                    Follow.following_type == "user",
                    Follow.following_id == user.id,
                )
            )
            out.is_following = follow.scalar_one_or_none() is not None
    return out


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
    notify(
        db,
        user_id=target_user.id,
        actor_id=current_user.id,
        kind="follow",
        title="New follower",
        body="started following you.",
        ref_type="profile",
        ref_id=current_user.handle,
    )


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
    viewer: Optional[User] = Depends(get_optional_user),
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

    # When a logged-in viewer looks at someone else's collection, flag which items
    # they've already wishlisted (powers the ProfileCollection bookmark button, DF-24).
    wl_skus: set[str] = set()
    wl_titles: set[str] = set()
    if viewer and viewer.id != target_user.id:
        wl = await db.execute(
            select(Item.sku, Item.custom_title).where(
                Item.user_id == viewer.id, Item.status == "wishlist"
            )
        )
        for sku, title in wl.all():
            if sku:
                wl_skus.add(sku)
            if title:
                wl_titles.add(title.strip().lower())

    def _wishlisted(i: Item) -> bool:
        if i.sku and i.sku in wl_skus:
            return True
        if i.custom_title and i.custom_title.strip().lower() in wl_titles:
            return True
        return False

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
                "preorder_eta": i.preorder_eta,
                "is_wishlisted": _wishlisted(i),
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


@router.get("/{handle}/communities")
async def get_user_communities(
    handle: str,
    db: AsyncSession = Depends(get_db),
    viewer: Optional[User] = Depends(get_optional_user),
    page: int = Query(1, ge=1),
    limit: int = Query(24, le=60),
):
    """Communities the user has joined — feeds the profile Communities tab."""
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = (
        select(Community)
        .join(CommunityMember, CommunityMember.community_id == Community.id)
        .where(CommunityMember.user_id == target_user.id)
        .order_by(CommunityMember.joined_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(stmt)
    communities = result.scalars().all()

    # which of these does the viewer also belong to (drives the Join/Joined chip)
    viewer_member_ids: set[str] = set()
    if viewer:
        vm = await db.execute(
            select(CommunityMember.community_id).where(CommunityMember.user_id == viewer.id)
        )
        viewer_member_ids = set(vm.scalars().all())

    return {
        "page": page,
        "items": [_community_dict(c, c.id in viewer_member_ids) for c in communities],
    }


@router.get("/{handle}/deals")
async def get_user_deals(
    handle: str,
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(24, le=60),
):
    """Confirmed trade history (from this user's perspective) — profile Trades tab."""
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = (
        select(Deal, Item, User)
        .join(Item, Deal.item_id == Item.id)
        .join(
            User,
            User.id == func.coalesce(
                func.nullif(Deal.seller_id, target_user.id),
                Deal.buyer_id,
            ),
        )
        .where(
            Deal.status == "confirmed",
            (Deal.seller_id == target_user.id) | (Deal.buyer_id == target_user.id),
        )
        .order_by(Deal.confirmed_at.desc().nullslast())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(stmt)

    items = []
    for deal, item, other in result:
        is_seller = deal.seller_id == target_user.id
        # rating this user received, and whether the counterparty vouched for them
        received_rating = deal.seller_rating if is_seller else deal.buyer_rating
        vouched = deal.buyer_vouch_done if is_seller else deal.seller_vouch_done
        items.append({
            "id": str(deal.id),
            "direction": "Sold" if is_seller else "Bought",
            "deal_type": deal.deal_type,
            "item": item.custom_title or item.sku or "Item",
            "with": {
                "handle": other.handle,
                "name": other.name,
                "avatar_url": other.avatar_url,
            },
            "when": deal.confirmed_at.isoformat() if deal.confirmed_at else None,
            "rating": received_rating,
            "vouched": vouched,
        })
    return {"page": page, "items": items}


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
