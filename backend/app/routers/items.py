import logging
import uuid
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.database import get_db
from app.dependencies import get_current_user
from app.models.item import Item, ItemPhoto
from app.models.catalogue import Catalogue
from app.models.user import Follow, User
from app.services.gamification import resolve_referral
from app.services.catalogue import resolve_or_create, norm_scale, resolved_item_facts

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
    # QA 2026-08-05 §5/§6 — ready-to-render name: custom_title → catalogue title → sku.
    # Clients should show this instead of re-deriving from custom_title/sku, which is
    # how items added from the Database ended up displaying raw SKU codes. NOTE: this
    # model is a `response_model`, so a field missing HERE is stripped from the response
    # no matter what the handler puts in the dict.
    title: Optional[str] = None
    # The linked catalogue entry's own title, when there is one (lets the UI show
    # "your name for it" alongside the shared record).
    catalogue_title: Optional[str] = None
    brand: Optional[str] = None
    scale: Optional[str] = None
    release_year: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: str
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
    # v6 DV6-13 — Official badge from the linked catalogue entry (admin-blessed).
    catalogue_is_verified: bool = False
    # Wishlist taxonomy (2026-07-11) — whether the VIEWER has a wishlist copy of this
    # item's identity (drives the Star toggle's initial state on item detail).
    is_wishlisted: bool = False

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
        # Slash form only (Change Spec §5) — a hand-typed "1:6" must group with "1/6".
        scale=norm_scale(body.scale),
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
            cover_url=body.cover_url, description=body.description,
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
        value=src_item.value,
        privacy="public",
        wishlist_alert_enabled=True,
    ))
    return WishlistToggleOut(wishlisted=True)


@router.get("/wishlist")
async def my_wishlist(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """The caller's wishlist (status="wishlist" items), newest first, enriched with
    the linked catalogue entry's thumbnail/title. Feeds the Saved page's Wishlist tab
    (wishlist taxonomy, 2026-07-11 — wishlist lives in the Saved drawer, not the
    Collection, which is owned things only per DV6-11e).

    NOTE: literal path — must stay registered before GET /{item_id}.
    """
    rows = (await db.execute(
        select(Item, Catalogue)
        .outerjoin(Catalogue, Catalogue.sku == Item.sku)
        .where(Item.user_id == current_user.id, Item.status == "wishlist")
        .order_by(Item.created_at.desc())
    )).all()
    return {"items": [
        {
            "id": str(i.id),
            "sku": i.sku,
            "title": i.custom_title or (c.title if c else None) or i.sku,
            "brand": i.brand or (c.brand if c else None),
            "category": i.category or (c.category if c else None),
            "value": i.value,
            "thumbnail_url": c.thumbnail_url if c else None,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        }
        for i, c in rows
    ]}


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
    # DV6-13 — privacy: a non-owner only sees the owner's PUBLIC photos.
    is_owner = item.user_id == current_user.id
    visible = photos if is_owner else [p for p in photos if p.is_public]
    out = _item_out(item, visible)
    # DV6-13 — cover fallback + Official badge from the linked catalogue entry: if the
    # viewer has no visible photo, show the shared reference image instead of a blank.
    cat = await db.get(Catalogue, item.sku) if item.sku else None
    # QA 2026-08-05 §6 — inherit the catalogue's facts so an item linked to a SKU reads
    # the same here as it does on the Database tab. Owner values still win; the
    # catalogue only fills the gaps, so nothing a user typed is overwritten.
    out.update(resolved_item_facts(item, cat))
    if cat:
        out["catalogue_is_verified"] = cat.is_verified
        out["catalogue_title"] = cat.title
        if not out.get("images") and cat.thumbnail_url:
            out["images"] = [cat.thumbnail_url]
            out["image_url"] = cat.thumbnail_url
    # DV6-11h — attach the owner's identity for the "DB Contribution by @handle" attribution.
    owner = await db.get(User, item.user_id)
    if owner:
        out["owner_handle"] = owner.handle
        out["owner_name"] = owner.name
    # Wishlist taxonomy (2026-07-11) — viewer's wishlist state for the Star toggle.
    if not is_owner:
        wish_q = select(Item.id).where(Item.user_id == current_user.id, Item.status == "wishlist")
        wish_q = wish_q.where(Item.sku == item.sku) if item.sku else wish_q.where(Item.custom_title == item.custom_title)
        out["is_wishlisted"] = bool((await db.execute(wish_q.limit(1))).scalar_one_or_none())
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
    patch = body.model_dump(exclude_none=True)
    if "scale" in patch:
        patch["scale"] = norm_scale(patch["scale"])  # slash form only (Change Spec §5)
    for field, value in patch.items():
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


# DV6-13 — a collector's shelf holds at most 4 personal photos per item.
MAX_ITEM_PHOTOS = 4


@router.post("/{item_id}/photos", status_code=201)
async def add_photo(
    item_id: uuid.UUID,
    url: str,
    is_public: bool = False,  # DV6-13 — personal photos default private ("share to catalogue" opts in)
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Item).where(Item.id == item_id, Item.user_id == current_user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    n = await db.scalar(
        select(func.count()).select_from(ItemPhoto).where(ItemPhoto.item_id == item.id)
    )
    if (n or 0) >= MAX_ITEM_PHOTOS:
        raise HTTPException(status_code=400, detail=f"Up to {MAX_ITEM_PHOTOS} photos per item.")

    photo = ItemPhoto(item_id=item.id, url=url, is_public=is_public)
    db.add(photo)
    # B-75 — atomic increment
    await db.execute(update(Item).where(Item.id == item.id).values(photo_count=Item.photo_count + 1))

    await db.flush()  # assign photo.id before returning it
    return {"id": str(photo.id), "url": url}


def _item_out(item: Item, photos: Optional[list[ItemPhoto]] = None) -> dict:
    # Cover = earliest upload (the AddToCollection photo).
    urls = [p.url for p in sorted(photos, key=lambda p: p.uploaded_at)] if photos else []
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
