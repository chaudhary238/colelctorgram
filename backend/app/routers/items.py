import logging
import uuid
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import get_current_user
from app.models.item import Item, ItemPhoto
from app.models.user import Follow, User
from app.services.gamification import resolve_referral
from app.services.catalogue import resolve_or_create

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/items", tags=["items"])


class AddItemBody(BaseModel):
    sku: Optional[str] = None
    custom_title: Optional[str] = None
    brand: Optional[str] = None
    scale: Optional[str] = None
    release_year: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: str = "owned"
    value: int = 0
    value_currency: str = "INR"
    privacy: str = "public"
    # TCG spec (DV4-01)
    tcg_language: Optional[str] = None
    tcg_product_type: Optional[str] = None
    tcg_graded: bool = False
    tcg_grader: Optional[str] = None
    tcg_grade: Optional[str] = None
    # Pre-order financial + calendar layer (DV4-03)
    preorder_eta: Optional[str] = None
    preorder_window_precision: Optional[str] = None
    preorder_seller: Optional[str] = None
    preorder_ordered_at: Optional[date] = None
    preorder_total: Optional[int] = None
    preorder_deposit: Optional[int] = None
    wishlist_alert_enabled: bool = False
    # DV6-13 — mandatory public reference image when this add CREATES a new catalogue entry.
    cover_url: Optional[str] = None


class UpdateItemBody(BaseModel):
    status: Optional[str] = None
    value: Optional[int] = None
    value_currency: Optional[str] = None
    privacy: Optional[str] = None
    preorder_eta: Optional[str] = None
    preorder_window_precision: Optional[str] = None
    preorder_seller: Optional[str] = None
    preorder_ordered_at: Optional[date] = None
    preorder_total: Optional[int] = None
    preorder_deposit: Optional[int] = None
    wishlist_alert_enabled: Optional[bool] = None


class ItemOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    sku: Optional[str]
    custom_title: Optional[str]
    brand: Optional[str] = None
    scale: Optional[str] = None
    release_year: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: str
    verify_tier: str
    value: int
    value_currency: str = "INR"
    is_listed: bool
    photo_count: int
    # Uploaded ownership photos (cover first). image_url is the cover convenience field.
    images: list[str] = []
    image_url: Optional[str] = None
    tcg_language: Optional[str] = None
    tcg_product_type: Optional[str] = None
    tcg_graded: bool = False
    tcg_grader: Optional[str] = None
    tcg_grade: Optional[str] = None
    preorder_ordered_at: Optional[date] = None
    preorder_eta: Optional[str] = None
    preorder_window_precision: Optional[str] = None
    preorder_seller: Optional[str] = None
    preorder_total: Optional[int] = None
    preorder_deposit: Optional[int] = None
    privacy: str
    created_at: datetime
    # v6 DV6-02 — XP awarded for contributing this as a new item to the shared
    # catalogue DB (0 when it linked to an existing SKU or the daily cap was hit).
    db_new_xp: int = 0
    # v6 DV6-12 — True when a free-text add was auto-linked to an existing catalogue
    # entry by the resolve-or-create guard (no duplicate row was created).
    catalogue_matched: bool = False
    # v6 DV6-11h — owner identity for the "DB Contribution by @handle" attribution
    # on the item detail page (populated by get_item; None on create/update responses).
    owner_handle: Optional[str] = None
    owner_name: Optional[str] = None

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
        brand=body.brand,
        scale=body.scale,
        release_year=body.release_year,
        description=body.description,
        category=body.category,
        status=body.status,
        value=body.value,
        value_currency=body.value_currency,
        privacy=body.privacy,
        tcg_language=body.tcg_language,
        tcg_product_type=body.tcg_product_type,
        tcg_graded=body.tcg_graded,
        tcg_grader=body.tcg_grader,
        tcg_grade=body.tcg_grade,
        preorder_eta=body.preorder_eta,
        preorder_window_precision=body.preorder_window_precision,
        preorder_seller=body.preorder_seller,
        preorder_ordered_at=body.preorder_ordered_at,
        preorder_total=body.preorder_total,
        preorder_deposit=body.preorder_deposit,
        wishlist_alert_enabled=body.wishlist_alert_enabled,
    )
    db.add(item)
    await db.flush()
    # DV6-05 — adding a first collection item resolves a pending referral,
    # crediting the inviter +150 XP (idempotent; no-op if not referred).
    await resolve_referral(db, current_user)
    # DV6-12 — a free-text add is resolved against the central catalogue: a strong
    # fuzzy match links to the existing entry (no duplicate); otherwise a new pending
    # entry is created and the first contributor earns +50 XP. Either way the personal
    # item ends up linked to a real catalogue SKU.
    db_new_xp = 0
    catalogue_matched = False
    if not body.sku and body.custom_title:
        sku, db_new_xp, catalogue_matched = await resolve_or_create(
            db, current_user,
            title=body.custom_title, brand=body.brand, category=body.category,
            scale=body.scale, release_year=body.release_year, value=body.value,
            cover_url=body.cover_url,
        )
        item.sku = sku
        await db.flush()
    out = _item_out(item)
    out["db_new_xp"] = db_new_xp
    out["catalogue_matched"] = catalogue_matched
    return out


class WishlistToggleOut(BaseModel):
    wishlisted: bool


@router.post("/{item_id}/wishlist", response_model=WishlistToggleOut)
async def toggle_wishlist(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle a wishlist copy of another collector's item for the caller (DF-24).

    Wishlisting clones the source item's identity (sku/title + spec) into a
    `status="wishlist"` Item owned by the caller; toggling again removes it.
    Matched by sku when present, else by custom_title.
    """
    src = await db.execute(select(Item).where(Item.id == item_id))
    src_item = src.scalar_one_or_none()
    if not src_item:
        raise HTTPException(status_code=404, detail="Item not found")
    if src_item.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot wishlist your own item")

    existing_q = select(Item).where(
        Item.user_id == current_user.id, Item.status == "wishlist"
    )
    if src_item.sku:
        existing_q = existing_q.where(Item.sku == src_item.sku)
    else:
        existing_q = existing_q.where(Item.custom_title == src_item.custom_title)
    existing = (await db.execute(existing_q)).scalars().first()

    if existing:
        await db.delete(existing)
        return WishlistToggleOut(wishlisted=False)

    db.add(Item(
        user_id=current_user.id,
        sku=src_item.sku,
        custom_title=src_item.custom_title,
        brand=src_item.brand,
        scale=src_item.scale,
        release_year=src_item.release_year,
        category=src_item.category,
        status="wishlist",
        verify_tier="claimed",
        value=src_item.value,
        privacy="public",
        wishlist_alert_enabled=True,
    ))
    return WishlistToggleOut(wishlisted=True)


@router.get("/by-sku/{sku}")
async def get_my_item_by_sku(
    sku: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Resolve a catalogue SKU to the caller's own collection item (if any).

    Lets the search page mirror design_v4: tapping a catalogue result routes to the
    item's status-aware detail page when it's already in your collection, or to the
    "Add to my collection" flow when it isn't. Prefers owned > preorder > wishlist so a
    real shelf item wins over a wishlist entry for the same SKU.
    """
    result = await db.execute(
        select(Item.id, Item.status).where(
            Item.user_id == current_user.id, Item.sku == sku
        )
    )
    rows = result.all()
    if not rows:
        return {"item": None}
    priority = {"owned": 0, "preorder": 1, "wishlist": 2}
    best = min(rows, key=lambda r: priority.get(r.status, 3))
    return {"item": {"id": str(best.id), "status": best.status}}


def _item_view_allowed(item_user_id: uuid.UUID, privacy: str, viewer_id: uuid.UUID, is_follower: bool) -> bool:
    """Whether `viewer` may read a single item's full detail (Security Audit #1).

    Owner always sees their own item. Otherwise honour the item's `privacy` tier:
    `public` → anyone; `followers` → only people who follow the owner; anything
    else (`private`/unknown) → nobody but the owner.
    """
    if item_user_id == viewer_id:
        return True
    if privacy == "public":
        return True
    if privacy == "followers":
        return is_follower
    return False


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

    # Resource-level authorization: an item carries a `privacy` tier, but get_item
    # previously returned any item by UUID, leaking private collections (incl. value
    # and pre-order financials) to anyone who could guess a UUID. Enforce it here.
    if item.user_id != current_user.id and item.privacy != "public":
        is_follower = False
        if item.privacy == "followers":
            is_follower = bool(await db.scalar(
                select(Follow.follower_id).where(
                    Follow.following_type == "user",
                    Follow.follower_id == current_user.id,
                    Follow.following_id == item.user_id,
                ).limit(1)
            ))
        if not _item_view_allowed(item.user_id, item.privacy, current_user.id, is_follower):
            # 404 (not 403) so a private item is indistinguishable from a missing one.
            raise HTTPException(status_code=404, detail="Item not found")

    photos = (await db.execute(select(ItemPhoto).where(ItemPhoto.item_id == item.id))).scalars().all()
    out = _item_out(item, photos)
    # DV6-11h — attach the owner's identity for the "DB Contribution by @handle" attribution.
    owner = await db.get(User, item.user_id)
    if owner:
        out["owner_handle"] = owner.handle
        out["owner_name"] = owner.name
    return out


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
    photos = (await db.execute(select(ItemPhoto).where(ItemPhoto.item_id == item.id))).scalars().all()
    return _item_out(item, photos)


# DV4-04: remove-from-collection reasons (design_v4 ItemDetail "Remove from collection?" sheet).
REMOVE_REASONS = {"sold", "traded", "lost", "broken", "gifted", "other"}


@router.delete("/{item_id}", status_code=204)
async def delete_item(
    item_id: uuid.UUID,
    reason: Optional[str] = Query(None, description="sold | traded | lost | broken | gifted | other"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.id == item_id, Item.user_id == current_user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    # Reason is captured for trade-signal analytics (F-01 price history can later mine
    # sold/traded removals); stored items have no removal table yet, so we just log it.
    if reason and reason in REMOVE_REASONS:
        logger.info("item_removed item=%s user=%s reason=%s", item.id, current_user.id, reason)
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
    # v3 §7 removed the "Add a verified item" XP action — no reward is granted here.
    return {"verify_tier": "verified"}


# DV6-13 — a collector's shelf holds at most 4 personal (non-verify) photos per item.
MAX_ITEM_PHOTOS = 4


@router.post("/{item_id}/photos", status_code=201)
async def add_photo(
    item_id: uuid.UUID,
    url: str,
    is_verify_photo: bool = False,
    is_public: bool = False,  # DV6-13 — personal photos default private ("share to catalogue" opts in)
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.id == item_id, Item.user_id == current_user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Cap personal photos at 4 (verify/challenge shots are ownership proofs, not counted).
    if not is_verify_photo:
        n = await db.scalar(
            select(func.count()).select_from(ItemPhoto).where(
                ItemPhoto.item_id == item.id, ItemPhoto.is_verify_photo == False
            )
        )
        if (n or 0) >= MAX_ITEM_PHOTOS:
            raise HTTPException(status_code=400, detail=f"Up to {MAX_ITEM_PHOTOS} photos per item.")

    photo = ItemPhoto(item_id=item.id, url=url, is_verify_photo=is_verify_photo, is_public=is_public)
    db.add(photo)
    item.photo_count += 1

    if is_verify_photo and item.verify_tier == "claimed":
        item.verify_tier = "shown"

    await db.flush()  # assign photo.id before returning it
    return {"id": str(photo.id), "url": url, "verify_tier": item.verify_tier}


def _item_out(item: Item, photos: Optional[list[ItemPhoto]] = None) -> dict:
    # Cover = first non-verify upload (the AddToCollection photo); verify/challenge
    # shots sort last so the user's chosen cover wins.
    urls = [p.url for p in sorted(photos, key=lambda p: p.is_verify_photo)] if photos else []
    return {
        "id": str(item.id),
        "images": urls,
        "image_url": urls[0] if urls else None,
        "user_id": str(item.user_id),
        "sku": item.sku,
        "custom_title": item.custom_title,
        "brand": item.brand,
        "scale": item.scale,
        "release_year": item.release_year,
        "description": item.description,
        "category": item.category,
        "status": item.status,
        "verify_tier": item.verify_tier,
        "value": item.value,
        "value_currency": item.value_currency,
        "is_listed": item.is_listed,
        "photo_count": item.photo_count,
        "tcg_language": item.tcg_language,
        "tcg_product_type": item.tcg_product_type,
        "tcg_graded": item.tcg_graded,
        "tcg_grader": item.tcg_grader,
        "tcg_grade": item.tcg_grade,
        "preorder_ordered_at": item.preorder_ordered_at.isoformat() if item.preorder_ordered_at else None,
        "preorder_eta": item.preorder_eta,
        "preorder_window_precision": item.preorder_window_precision,
        "preorder_seller": item.preorder_seller,
        "preorder_total": item.preorder_total,
        "preorder_deposit": item.preorder_deposit,
        "privacy": item.privacy,
        "created_at": item.created_at.isoformat(),
    }
