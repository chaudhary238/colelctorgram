import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.database import get_db
from app.dependencies import get_current_user
from app.models.listing import Listing, ListingSave, ListingLike, ListingQuestion, ListingPriceVote
from app.services.notifications import notify
from app.models.item import Item, ItemPhoto
from app.models.catalogue import Catalogue
from app.models.user import User
from app.models.deal import Vouch
from app.workers.tasks import dispatch_wishlist_notifications

_bg_tasks: set = set()

router = APIRouter(prefix="/listings", tags=["listings"])


class CreateListingBody(BaseModel):
    item_id: uuid.UUID
    price: int  # minor units of `currency`
    currency: str = "INR"
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
    condition_notes: Optional[str] = None


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
    # DF-17: web Sell is allowed (founder decision) — verified is now an optional
    # badge a seller can earn later (live in-app photo), not a precondition to list.

    listing = Listing(
        item_id=item.id,
        seller_id=current_user.id,
        sku=item.sku,
        price=body.price,
        currency=body.currency,
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
    q: Optional[str] = None,
    category: Optional[list[str]] = Query(None),
    condition: Optional[list[str]] = Query(None),
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    trade: Optional[bool] = None,
    ship: Optional[bool] = None,
    saved: bool = False,
    sort: str = "new",
    db: AsyncSession = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    # Joins let us search/filter on the item + catalogue + seller (one row per listing).
    category_expr = func.coalesce(Catalogue.category, Item.category)
    title_expr = func.coalesce(Catalogue.title, Item.custom_title, Listing.sku)
    base = (
        select(Listing)
        .join(Item, Listing.item_id == Item.id)
        .outerjoin(Catalogue, Listing.sku == Catalogue.sku)
        .join(User, Listing.seller_id == User.id)
        .where(Listing.status == "available")
    )

    if q:
        like = f"%{q.strip()}%"
        base = base.where(or_(
            title_expr.ilike(like),
            Item.brand.ilike(like),
            User.handle.ilike(like),
            User.name.ilike(like),
        ))
    if category:
        base = base.where(or_(*[category_expr.ilike(f"%{c}%") for c in category]))
    if condition:
        base = base.where(Listing.condition.in_(condition))
    if min_price is not None:
        base = base.where(Listing.price >= min_price)
    if max_price is not None:
        base = base.where(Listing.price <= max_price)
    if trade is not None:
        base = base.where(Listing.trade_willing == trade)
    if ship:
        base = base.where(Listing.terms.any("Shipping included"))
    if saved:
        if not viewer:
            return {"page": page, "limit": limit, "total": 0, "has_more": False, "items": []}
        base = base.where(Listing.id.in_(
            select(ListingSave.listing_id).where(ListingSave.user_id == viewer.id)
        ))

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()

    order = {
        "low": Listing.price.asc(),
        "high": Listing.price.desc(),
        "saved": Listing.saves_count.desc(),
        "watched": Listing.watching_count.desc(),
    }.get(sort, Listing.created_at.desc())

    stmt = base.order_by(order).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    listings = result.scalars().all()

    enriched = await _enrich_listings(listings, db, viewer)
    has_more = (page - 1) * limit + len(listings) < total
    return {"page": page, "limit": limit, "total": total, "has_more": has_more, "items": enriched}


@router.get("/{listing_id}")
async def get_listing(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    enriched = await _enrich_listings([listing], db, viewer)
    enriched[0]["price_votes"] = await _price_vote_summary(listing_id, db, viewer)
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
    enriched = await _enrich_listings([listing], db, current_user)
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


@router.post("/{listing_id}/like", status_code=204)
async def toggle_like(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Public like on a listing (taxonomy 2026-07-11: Heart = like on posts AND
    listings; the old market heart was the save action, now the Bookmark)."""
    listing = (await db.execute(select(Listing).where(Listing.id == listing_id))).scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    existing = (await db.execute(
        select(ListingLike).where(
            ListingLike.user_id == current_user.id,
            ListingLike.listing_id == listing_id,
        )
    )).scalar_one_or_none()
    if existing:
        await db.delete(existing)
        listing.likes_count = max(0, listing.likes_count - 1)
    else:
        db.add(ListingLike(user_id=current_user.id, listing_id=listing_id))
        listing.likes_count += 1
        if listing.seller_id != current_user.id:
            await notify(
                db,
                user_id=listing.seller_id,
                actor_id=current_user.id,
                kind="like",
                title="New like",
                body="liked your listing.",
                ref_type="listing",
                ref_id=str(listing.id),
            )


class AskQuestionBody(BaseModel):
    body: str


class AnswerQuestionBody(BaseModel):
    answer: str


@router.get("/{listing_id}/questions")
async def list_questions(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ListingQuestion)
        .where(ListingQuestion.listing_id == listing_id)
        .order_by(ListingQuestion.created_at.desc())
    )
    questions = result.scalars().all()
    if not questions:
        return {"questions": []}

    asker_ids = list({q.asker_id for q in questions})
    askers_result = await db.execute(select(User).where(User.id.in_(asker_ids)))
    askers = {u.id: u for u in askers_result.scalars().all()}

    out = []
    for q in questions:
        asker = askers.get(q.asker_id)
        out.append({
            "id": str(q.id),
            "body": q.body,
            "answer": q.answer,
            "answered_at": q.answered_at.isoformat() if q.answered_at else None,
            "asker_handle": asker.handle if asker else None,
            "asker_name": asker.name if asker else None,
            "asker_avatar_url": asker.avatar_url if asker else None,
            "is_mine": bool(viewer and asker and viewer.id == asker.id),
            "created_at": q.created_at.isoformat(),
        })
    return {"questions": out}


@router.post("/{listing_id}/questions", status_code=status.HTTP_201_CREATED)
async def ask_question(
    listing_id: uuid.UUID,
    body: AskQuestionBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    text = body.body.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    listing_result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = listing_result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    question = ListingQuestion(listing_id=listing_id, asker_id=current_user.id, body=text)
    db.add(question)
    await db.flush()
    return {
        "id": str(question.id),
        "body": question.body,
        "answer": None,
        "answered_at": None,
        "asker_handle": current_user.handle,
        "asker_name": current_user.name,
        "asker_avatar_url": current_user.avatar_url,
        "is_mine": True,
        "created_at": question.created_at.isoformat(),
    }


@router.post("/{listing_id}/questions/{question_id}/answer")
async def answer_question(
    listing_id: uuid.UUID,
    question_id: uuid.UUID,
    body: AnswerQuestionBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    text = body.answer.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Answer cannot be empty")
    listing_result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = listing_result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the seller can answer")

    q_result = await db.execute(
        select(ListingQuestion).where(
            ListingQuestion.id == question_id, ListingQuestion.listing_id == listing_id
        )
    )
    question = q_result.scalar_one_or_none()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    question.answer = text
    question.answered_at = datetime.now(timezone.utc)
    return {"id": str(question.id), "answer": question.answer, "answered_at": question.answered_at.isoformat()}


class PriceVoteBody(BaseModel):
    vote: str  # low | fair | high


async def _price_vote_summary(listing_id: uuid.UUID, db: AsyncSession, viewer: Optional[User]) -> dict:
    rows = await db.execute(
        select(ListingPriceVote.vote, func.count())
        .where(ListingPriceVote.listing_id == listing_id)
        .group_by(ListingPriceVote.vote)
    )
    counts = {"low": 0, "fair": 0, "high": 0}
    for vote, n in rows.all():
        if vote in counts:
            counts[vote] = n
    my_vote = None
    if viewer:
        mine = await db.execute(
            select(ListingPriceVote.vote).where(
                ListingPriceVote.listing_id == listing_id, ListingPriceVote.user_id == viewer.id
            )
        )
        my_vote = mine.scalar_one_or_none()
    return {**counts, "total": sum(counts.values()), "my_vote": my_vote}


@router.post("/{listing_id}/price-vote")
async def price_vote(
    listing_id: uuid.UUID,
    body: PriceVoteBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.vote not in ("low", "fair", "high"):
        raise HTTPException(status_code=400, detail="vote must be low|fair|high")
    listing_result = await db.execute(select(Listing).where(Listing.id == listing_id))
    listing = listing_result.scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="You can't vote on your own listing")

    existing = await db.execute(
        select(ListingPriceVote).where(
            ListingPriceVote.listing_id == listing_id, ListingPriceVote.user_id == current_user.id
        )
    )
    vote = existing.scalar_one_or_none()
    if vote:
        vote.vote = body.vote
    else:
        db.add(ListingPriceVote(user_id=current_user.id, listing_id=listing_id, vote=body.vote))
    await db.flush()
    return await _price_vote_summary(listing_id, db, current_user)


async def _enrich_listings(listings: list[Listing], db: AsyncSession, viewer: Optional[User] = None) -> list[dict]:
    if not listings:
        return []

    seller_ids = list({l.seller_id for l in listings})
    item_ids = list({l.item_id for l in listings})
    skus = list({l.sku for l in listings if l.sku})

    sellers_result = await db.execute(select(User).where(User.id.in_(seller_ids)))
    sellers = {u.id: u for u in sellers_result.scalars().all()}

    # Vouches received per seller (DF-29b "Vouched by N" on the market card).
    # Read-only count over the existing vouches table — the give/request flow
    # stays decision-gated (DF-36a).
    vouch_rows = await db.execute(
        select(Vouch.to_user_id, func.count(Vouch.id))
        .where(Vouch.to_user_id.in_(seller_ids))
        .group_by(Vouch.to_user_id)
    )
    vouches_by_seller = dict(vouch_rows.all())

    items_result = await db.execute(select(Item).where(Item.id.in_(item_ids)))
    items = {i.id: i for i in items_result.scalars().all()}

    # Real uploaded photos (DF-17) — grouped by item, ordered oldest→newest so the
    # first photo the seller added is the cover. DV6-13: a public marketplace only shows
    # PUBLIC photos (listing photos are public by nature); items with none fall back to the
    # shared catalogue reference image below.
    photos_result = await db.execute(
        select(ItemPhoto)
        .where(ItemPhoto.item_id.in_(item_ids), ItemPhoto.is_public == True)
        .order_by(ItemPhoto.uploaded_at)
    )
    photos_by_item: dict = {}
    for p in photos_result.scalars().all():
        photos_by_item.setdefault(p.item_id, []).append(p.url)

    cats_result = await db.execute(select(Catalogue).where(Catalogue.sku.in_(skus))) if skus else None
    cats = {c.sku: c for c in (cats_result.scalars().all() if cats_result else [])}

    # Which of these listings has the viewer saved / liked?
    saved_ids: set = set()
    liked_ids: set = set()
    if viewer:
        listing_ids = [l.id for l in listings]
        saves_result = await db.execute(
            select(ListingSave.listing_id).where(
                ListingSave.user_id == viewer.id,
                ListingSave.listing_id.in_(listing_ids),
            )
        )
        saved_ids = set(saves_result.scalars().all())
        likes_result = await db.execute(
            select(ListingLike.listing_id).where(
                ListingLike.user_id == viewer.id,
                ListingLike.listing_id.in_(listing_ids),
            )
        )
        liked_ids = set(likes_result.scalars().all())

    # Which of these listings' underlying item the viewer has wishlisted (DF-24):
    # a status="wishlist" Item the viewer owns, matched by sku when present else
    # custom_title — the same rule as POST /items/{id}/wishlist. Powers the
    # MarketCard wishlist bookmark (distinct from the per-listing save heart).
    wl_skus: set = set()
    wl_titles: set = set()
    if viewer:
        wl_result = await db.execute(
            select(Item.sku, Item.custom_title).where(
                Item.user_id == viewer.id, Item.status == "wishlist"
            )
        )
        for sku, title in wl_result.all():
            if sku:
                wl_skus.add(sku)
            elif title:
                wl_titles.add(title)

    out = []
    for l in listings:
        seller = sellers.get(l.seller_id)
        item = items.get(l.item_id)
        if l.sku:
            is_wishlisted = l.sku in wl_skus
        elif item and item.custom_title:
            is_wishlisted = item.custom_title in wl_titles
        else:
            is_wishlisted = False
        cat = cats.get(l.sku) if l.sku else None

        title = (cat.title if cat else None) or (item.custom_title if item else None) or l.sku or "Unknown item"
        category = (cat.category if cat else None) or (item.category if item else None)
        # DV6-13 — inherit the shared catalogue reference image when the seller has no public photo.
        item_photos = photos_by_item.get(l.item_id, [])
        if not item_photos and cat and cat.thumbnail_url:
            item_photos = [cat.thumbnail_url]

        out.append({
            "id": str(l.id),
            "item_id": str(l.item_id),
            "seller_id": str(l.seller_id),
            "sku": l.sku,
            "title": title,
            "category": category,
            # item specs + real uploaded photos (DF-17)
            "brand": item.brand if item else None,
            "scale": item.scale if item else None,
            "release_year": item.release_year if item else None,
            "description": item.description if item else None,
            # Pre-order listing display (DV4-07a) — a listing whose underlying item is a
            # pre-order shows a "Pre-order" tag + launch window + ordered-from store, matching
            # design_v4 ListingView (l.acq/poDate/poSeller).
            "acq": "preorder" if (item and item.status == "preorder") else "inhand",
            "preorder_eta": item.preorder_eta if item else None,
            "preorder_seller": item.preorder_seller if item else None,
            "photos": item_photos,
            "cover_url": item_photos[0] if item_photos else None,
            # seller
            "handle": seller.handle if seller else None,
            "name": seller.name if seller else None,
            "seller_city": seller.city if seller else None,
            "avatar_url": seller.avatar_url if seller else None,
            "rating": float(seller.rating) if seller else 0,
            "vouches_count": vouches_by_seller.get(l.seller_id, 0),
            # listing
            "price": l.price,
            "currency": l.currency,
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
            "likes_count": l.likes_count,
            "watching_count": l.watching_count,
            "is_saved": l.id in saved_ids,
            "is_liked": l.id in liked_ids,
            "is_wishlisted": is_wishlisted,
            "is_mine": bool(viewer and viewer.id == l.seller_id),
            "created_at": l.created_at.isoformat(),
        })
    return out
