import logging
import uuid
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.database import get_db
from app.dependencies import get_current_user
from app.models.item import Item, ItemPhoto, item_is_complete
from app.models.catalogue import Catalogue
from app.models.user import Follow, User
from app.services.gamification import EARN_RULES, award_xp, resolve_referral
from app.services.catalogue import resolve_or_create, norm_scale, resolved_item_facts

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/items", tags=["items"])

# DV8 — `status` was a free String(16) accepted verbatim; lock it to the real vocabulary.
VALID_ITEM_STATUSES = {"owned", "wishlist", "preorder", "intel"}


_is_complete = item_is_complete  # shared with users.py's collection endpoint


class AddItemBody(BaseModel):
    sku: Optional[str] = None
    custom_title: Optional[str] = None
    brand: Optional[str] = None
    scale: Optional[str] = None
    release_year: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: str = "owned"
    # DV8 — condition of your copy (category-specific vocabulary; the add forms
    # collected this since v6 and silently dropped it).
    condition: Optional[str] = None
    # DV8 quick-add — True when the "+" tap adds with no form. Enables the
    # duplicate guard (an owned copy blocks; a wishlist row converts instead).
    quick: bool = False
    value: int = 0
    value_currency: str = "INR"
    privacy: str = "public"
    # TCG spec (DV4-01)
    tcg_language: Optional[str] = None
    tcg_product_type: Optional[str] = None
    tcg_graded: bool = False
    tcg_grader: Optional[str] = None
    tcg_grade: Optional[str] = None
    tcg_cert_no: Optional[str] = None  # DV8 grading card — slab cert number
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
    condition: Optional[str] = None
    description: Optional[str] = None  # DV8 — the sell/edit page lets you edit your copy's notes
    # v8 AddListing.jsx:513 "Fix item details" — identity edits on YOUR copy.
    # Owner precedence in resolved_item_facts means these override the linked
    # catalogue entry for this item only; the shared record is untouched.
    custom_title: Optional[str] = None
    brand: Optional[str] = None
    scale: Optional[str] = None
    category: Optional[str] = None
    release_year: Optional[int] = None
    tcg_graded: Optional[bool] = None
    tcg_grader: Optional[str] = None
    tcg_grade: Optional[str] = None
    tcg_cert_no: Optional[str] = None
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
    condition: Optional[str] = None
    # DV8 — None for non-owners: what you paid is visible only to you (v8 §1).
    value: Optional[int] = None
    value_currency: str = "INR"
    is_listed: bool
    photo_count: int
    # DV8 completeness — condition + price present (preorder: ETA + total).
    is_complete: bool = True
    # DV8 sold state (owner-only price; sold copies are shelf history).
    sold_at: Optional[str] = None
    sold_price: Optional[int] = None
    # DV8 quick-add XP split — amounts actually granted by this request (0 when
    # deduped/capped); the client toasts what the server says, like db_new_xp.
    add_xp: int = 0
    complete_xp: int = 0
    # DV8 "NEW DB" tile chip — this add created its catalogue entry.
    is_new_to_db: bool = False
    # v8 CompleteItems.jsx:193 — a condition PATCH also updated a live listing.
    listing_synced: bool = False
    # Uploaded ownership photos (cover first). image_url is the cover convenience field.
    images: list[str] = []
    image_url: Optional[str] = None
    tcg_language: Optional[str] = None
    tcg_product_type: Optional[str] = None
    tcg_graded: bool = False
    tcg_grader: Optional[str] = None
    tcg_grade: Optional[str] = None
    tcg_cert_no: Optional[str] = None
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
    # DV8 §1 — the ownership card's "Sale · ₹x · View listing →" row needs the
    # ACTUAL listing behind the Listed tag (one source of truth, not is_listed).
    listing_id: Optional[uuid.UUID] = None
    listing_price: Optional[int] = None
    listing_currency: Optional[str] = None
    # v8 "Relist for sale" (ItemDetail :114) — the owner's newest CLOSED listing for
    # this copy, so the manage sheet can offer one-tap relist at the archived terms.
    closed_listing_id: Optional[uuid.UUID] = None
    closed_listing_price: Optional[int] = None
    closed_listing_currency: Optional[str] = None
    # v8 AddListing :724 — photo ids beside `images`, so the edit form can delete
    # existing uploads (DELETE /items/{id}/photos/{photo_id}).
    photos: Optional[list[dict]] = None

    model_config = {"from_attributes": True}


@router.post("", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
async def add_item(
    body: AddItemBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.sku and not body.custom_title:
        raise HTTPException(status_code=400, detail="Either sku or custom_title required")
    if body.status not in VALID_ITEM_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid item status")

    # DV8 quick-add duplicate guard — only a REAL copy blocks (v8 bug list: a
    # wishlist row must not count as owned; it converts to the new copy instead).
    converted_wish: Optional[Item] = None
    if body.quick and body.sku and body.status in ("owned", "preorder"):
        rows = (await db.execute(
            select(Item).where(
                Item.user_id == current_user.id,
                Item.sku == body.sku,
                Item.status.in_(["owned", "wishlist"]),
            )
        )).scalars().all()
        # A SOLD copy is history, not a duplicate — re-buying the same sku is legit.
        if any(i.status == "owned" and i.sold_at is None for i in rows):
            raise HTTPException(status_code=409, detail="Already in your collection")
        converted_wish = next((i for i in rows if i.status == "wishlist"), None)

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
        condition=body.condition,
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
    # DV8 — the wishlist row this quick-add supersedes goes away (owning and
    # wishing the same SKU is blocked elsewhere: POST /catalogue/{sku}/wishlist).
    if converted_wish is not None:
        await db.delete(converted_wish)
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
        # DV8 "NEW DB" chip — this add CREATED the catalogue entry (first
        # contributor). Flag regardless of the XP daily cap.
        item.is_new_to_db = not catalogue_matched
        await db.flush()
    # DV8 — adding earns +5; finishing (condition + price) earns +20 more. Both
    # dedup per item, so re-adds and later PATCHes can never double-grant.
    add_xp = complete_xp = 0
    if item.status in ("owned", "preorder"):
        if await award_xp(db, current_user, "add_item", ref_id=str(item.id), ref_type="item"):
            add_xp = EARN_RULES["add_item"]["points"]
        if _is_complete(item) and await award_xp(db, current_user, "complete_item", ref_id=str(item.id), ref_type="item"):
            complete_xp = EARN_RULES["complete_item"]["points"]
    out = _item_out(item)
    out["db_new_xp"] = db_new_xp
    out["catalogue_matched"] = catalogue_matched
    out["add_xp"] = add_xp
    out["complete_xp"] = complete_xp
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
    # DV8 §1 — resolve the live listing behind the Listed tag (newest available
    # wins) so the ownership card can deep-link and show the asking price.
    if item.is_listed:
        from app.models.listing import Listing
        lrow = (await db.execute(
            select(Listing.id, Listing.price, Listing.currency)
            .where(Listing.item_id == item.id, Listing.status == "available")
            .order_by(Listing.created_at.desc()).limit(1)
        )).first()
        if lrow:
            out["listing_id"] = lrow.id
            out["listing_price"] = lrow.price
            out["listing_currency"] = lrow.currency
    elif is_owner and getattr(item, "sold_at", None) is None:
        # v8 ItemDetail :40-42/:114 "Relist for sale — back on the market at ₹X":
        # unlisting keeps the closed listing row, so relisting is one tap at the
        # archived terms. Owner-only, and pointless on a sold copy.
        from app.models.listing import Listing
        crow = (await db.execute(
            select(Listing.id, Listing.price, Listing.currency)
            .where(Listing.item_id == item.id, Listing.status == "closed")
            .order_by(Listing.created_at.desc()).limit(1)
        )).first()
        if crow:
            out["closed_listing_id"] = crow.id
            out["closed_listing_price"] = crow.price
            out["closed_listing_currency"] = crow.currency
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
        # DV8 §1 — what you paid is visible only to you. Before this, ANY viewer of
        # a public item saw the Est. value tile and the pre-order financials.
        out["value"] = None
        out["preorder_total"] = None
        out["preorder_deposit"] = None
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
    if "status" in patch and patch["status"] not in VALID_ITEM_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid item status")
    if "scale" in patch:
        patch["scale"] = norm_scale(patch["scale"])  # slash form only (Change Spec §5)
    was_preorder = item.status == "preorder"
    was_complete = _is_complete(item)
    for field, value in patch.items():
        setattr(item, field, value)
    # DV8-07 "It arrived — mark as owned": PATCH uses exclude_none, so the client
    # can never null the pre-order fields itself — the flip clears them here.
    if was_preorder and patch.get("status") == "owned":
        item.preorder_ordered_at = None
        item.preorder_eta = None
        item.preorder_window_precision = None
        item.preorder_seller = None
        item.preorder_total = None
        item.preorder_deposit = None
    # DV8 — finishing an item (condition + price landing) earns +20, exactly once.
    complete_xp = 0
    if not was_complete and item.status in ("owned", "preorder") and _is_complete(item):
        if await award_xp(db, current_user, "complete_item", ref_id=str(item.id), ref_type="item"):
            complete_xp = EARN_RULES["complete_item"]["points"]
    # v8 CompleteItems.jsx:193-204 — a corrected condition syncs the LIVE listing
    # so the market never says something different from the shelf ("reads as
    # dishonesty"). The client toasts "Your listing now says X too" off this flag.
    listing_synced = False
    if "condition" in patch:
        from app.models.listing import Listing
        live_rows = (await db.execute(
            select(Listing).where(Listing.item_id == item.id, Listing.status == "available")
        )).scalars().all()
        for live in live_rows:
            live.condition = patch["condition"]
        listing_synced = bool(live_rows)
    photos = (await db.execute(select(ItemPhoto).where(ItemPhoto.item_id == item.id))).scalars().all()
    out = _item_out(item, photos)
    out["complete_xp"] = complete_xp
    out["listing_synced"] = listing_synced
    return out


class MarkSoldBody(BaseModel):
    price: Optional[int] = None  # minor units, optional ("what it went for")


@router.post("/{item_id}/sold", response_model=ItemOut)
async def mark_item_sold(
    item_id: uuid.UUID,
    body: MarkSoldBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """DV8 sold state — the copy STAYS on the shelf as history (v8: grayscale
    tile, struck-through value, Sold tag) instead of being deleted. Closes any
    live listing for the copy as sold in the same stroke."""
    result = await db.execute(select(Item).where(Item.id == item_id, Item.user_id == current_user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.status not in ("owned", "preorder"):
        raise HTTPException(status_code=422, detail="Only items you hold can be marked sold")
    if item.sold_at is None:
        item.sold_at = datetime.now(timezone.utc)
    item.sold_price = body.price if body.price and body.price > 0 else item.sold_price
    # Close the live listing (if any): market history keeps the sold record.
    from app.models.listing import Listing
    live = (await db.execute(
        select(Listing).where(Listing.item_id == item.id, Listing.status == "available")
    )).scalars().all()
    for l in live:
        l.status = "sold"
    if live:
        await db.execute(
            update(User).where(User.id == current_user.id)
            .values(active_listings_count=func.greatest(User.active_listings_count - len(live), 0))
        )
    item.is_listed = False
    photos = (await db.execute(select(ItemPhoto).where(ItemPhoto.item_id == item.id))).scalars().all()
    return _item_out(item, photos)


@router.delete("/{item_id}/sold", response_model=ItemOut)
async def undo_item_sold(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """v8 undo-sold — clears the sold stamp; the copy reads owned again. The
    closed listing stays sold (history); relist via the normal sell flow."""
    result = await db.execute(select(Item).where(Item.id == item_id, Item.user_id == current_user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.sold_at = None
    item.sold_price = None
    photos = (await db.execute(select(ItemPhoto).where(ItemPhoto.item_id == item.id))).scalars().all()
    return _item_out(item, photos)


# DV4-04: remove-from-collection reasons (design_v4 ItemDetail "Remove from collection?" sheet).
REMOVE_REASONS = {
    "sold", "traded", "lost", "broken", "gifted", "other",
    # v8 ItemDetail.jsx:417-458 — the pre-order cancel sheet's own vocabulary.
    "po-cancelled", "po-refunded", "po-transfer",
}


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


# DV8 — v8's in-hand add allows 8 personal photos (was 4 since DV6-13).
MAX_ITEM_PHOTOS = 8


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


@router.delete("/{item_id}/photos/{photo_id}", status_code=204)
async def remove_photo(
    item_id: uuid.UUID,
    photo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """v8 AddListing :724 — every photo tile carries a delete X, existing uploads
    included (the edit form previously could only drop photos queued that session)."""
    result = await db.execute(select(Item).where(Item.id == item_id, Item.user_id == current_user.id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    photo = (await db.execute(
        select(ItemPhoto).where(ItemPhoto.id == photo_id, ItemPhoto.item_id == item.id)
    )).scalar_one_or_none()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    await db.delete(photo)
    await db.execute(update(Item).where(Item.id == item.id).values(
        photo_count=func.greatest(Item.photo_count - 1, 0)
    ))


def _item_out(item: Item, photos: Optional[list[ItemPhoto]] = None) -> dict:
    # Cover = earliest upload (the AddToCollection photo).
    ordered = sorted(photos, key=lambda p: p.uploaded_at) if photos else []
    urls = [p.url for p in ordered]
    return {
        "id": str(item.id),
        "images": urls,
        "image_url": urls[0] if urls else None,
        # v8 AddListing :724 — the edit form deletes EXISTING uploads too, which
        # needs the photo ids alongside the bare urls.
        "photos": [{"id": str(p.id), "url": p.url} for p in ordered],
        "user_id": str(item.user_id),
        "sku": item.sku,
        "custom_title": item.custom_title,
        "brand": item.brand,
        "scale": item.scale,
        "release_year": item.release_year,
        "description": item.description,
        "category": item.category,
        "status": item.status,
        "condition": item.condition,
        "is_complete": _is_complete(item),
        "sold_at": item.sold_at.isoformat() if item.sold_at else None,
        "sold_price": item.sold_price,
        "value": item.value,
        "value_currency": item.value_currency,
        "is_listed": item.is_listed,
        "is_new_to_db": item.is_new_to_db,
        "photo_count": item.photo_count,
        "tcg_language": item.tcg_language,
        "tcg_product_type": item.tcg_product_type,
        "tcg_graded": item.tcg_graded,
        "tcg_grader": item.tcg_grader,
        "tcg_grade": item.tcg_grade,
        "tcg_cert_no": item.tcg_cert_no,
        "preorder_ordered_at": item.preorder_ordered_at.isoformat() if item.preorder_ordered_at else None,
        "preorder_eta": item.preorder_eta,
        "preorder_window_precision": item.preorder_window_precision,
        "preorder_seller": item.preorder_seller,
        "preorder_total": item.preorder_total,
        "preorder_deposit": item.preorder_deposit,
        "privacy": item.privacy,
        "created_at": item.created_at.isoformat(),
    }
