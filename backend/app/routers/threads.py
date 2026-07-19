import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.dependencies import get_current_user
from app.models.thread import Thread, Message
from app.models.user import User, Follow
from app.models.listing import Listing
from app.models.catalogue import Catalogue
from app.models.item import Item

router = APIRouter(prefix="/threads", tags=["messages"])


class CreateThreadBody(BaseModel):
    other_user_id: uuid.UUID
    listing_id: Optional[uuid.UUID] = None
    initial_message: Optional[str] = None


class SendMessageBody(BaseModel):
    body: Optional[str] = None
    image_url: Optional[str] = None
    offer_item_id: Optional[uuid.UUID] = None


@router.get("")
async def list_threads(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Thread).where(
        or_(Thread.participant_a == current_user.id, Thread.participant_b == current_user.id)
    ).order_by(Thread.last_message_at.desc())
    result = await db.execute(stmt)
    threads = result.scalars().all()

    if not threads:
        return []

    # Batch-load other users and listings
    other_user_ids = [
        t.participant_b if t.participant_a == current_user.id else t.participant_a
        for t in threads
    ]
    users_result = await db.execute(select(User).where(User.id.in_(other_user_ids)))
    users = {u.id: u for u in users_result.scalars().all()}

    listing_ids = [t.listing_id for t in threads if t.listing_id]
    listings: dict = {}
    if listing_ids:
        lst_result = await db.execute(select(Listing).where(Listing.id.in_(listing_ids)))
        raw_listings = {l.id: l for l in lst_result.scalars().all()}

        skus = [l.sku for l in raw_listings.values() if l.sku]
        cats: dict = {}
        if skus:
            cats_result = await db.execute(select(Catalogue).where(Catalogue.sku.in_(skus)))
            cats = {c.sku: c for c in cats_result.scalars().all()}

        item_ids = [l.item_id for l in raw_listings.values()]
        items: dict = {}
        if item_ids:
            items_result = await db.execute(select(Item).where(Item.id.in_(item_ids)))
            items = {i.id: i for i in items_result.scalars().all()}

        for lid, l in raw_listings.items():
            cat = cats.get(l.sku) if l.sku else None
            item = items.get(l.item_id)
            title = (cat.title if cat else None) or (item.custom_title if item else None) or l.sku or "Listing"
            listings[lid] = {"id": str(l.id), "title": title, "price": l.price, "status": l.status}

    # Batch-load last message per thread — DISTINCT ON returns one row per
    # thread (the latest), instead of loading every message in every thread.
    thread_ids = [t.id for t in threads]
    msgs_result = await db.execute(
        select(Message)
        .where(Message.thread_id.in_(thread_ids))
        .order_by(Message.thread_id, Message.created_at.desc())
        .distinct(Message.thread_id)
    )
    last_msgs = {m.thread_id: m for m in msgs_result.scalars().all()}

    return [_thread_dict_full(t, current_user.id, users, listings, last_msgs) for t in threads]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_thread(
    body: CreateThreadBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.other_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")

    a, b = sorted([current_user.id, body.other_user_id], key=str)
    existing = await db.execute(
        select(Thread).where(Thread.participant_a == a, Thread.participant_b == b)
    )
    thread = existing.scalar_one_or_none()
    is_new_thread = thread is None

    if not thread:
        # Messaging privacy (DF-23): honour the recipient's "who can message me"
        # setting when STARTING a new conversation. Listing inquiries (a buyer
        # contacting a seller about something they listed) always go through.
        if not body.listing_id:
            target = await db.scalar(select(User).where(User.id == body.other_user_id))
            if not target:
                raise HTTPException(status_code=404, detail="User not found")
            mode = (target.privacy_prefs or {}).get("messaging", "everyone")
            if mode == "none":
                raise HTTPException(status_code=403, detail="This user isn't accepting new messages.")
            if mode == "followers":
                connected = await db.scalar(
                    select(Follow.follower_id).where(
                        Follow.following_type == "user",
                        ((Follow.follower_id == current_user.id) & (Follow.following_id == target.id))
                        | ((Follow.follower_id == target.id) & (Follow.following_id == current_user.id)),
                    ).limit(1)
                )
                if not connected:
                    raise HTTPException(
                        status_code=403,
                        detail="This user only accepts messages from people they're connected with.",
                    )
        thread = Thread(participant_a=a, participant_b=b, listing_id=body.listing_id)
        db.add(thread)
        await db.flush()

    # Only seed the auto-generated opener on a *brand-new* thread. Re-opening an
    # existing conversation (e.g. tapping ISO "I have this" a second time) must
    # NOT keep re-posting the same canned message — just return the thread.
    if body.initial_message and is_new_thread:
        msg = Message(thread_id=thread.id, sender_id=current_user.id, body=body.initial_message)
        db.add(msg)
        _bump_unread(thread, current_user.id)
        thread.last_message_at = datetime.now(timezone.utc)

    return _thread_dict(thread, current_user.id)


@router.get("/{thread_id}/messages")
async def get_messages(
    thread_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = await _get_thread(thread_id, current_user.id, db)

    # Load thread with other user and listing context
    other_user_id = thread.participant_b if thread.participant_a == current_user.id else thread.participant_a
    other_user_result = await db.execute(select(User).where(User.id == other_user_id))
    other_user = other_user_result.scalar_one_or_none()

    listing_context = None
    if thread.listing_id:
        lst_result = await db.execute(select(Listing).where(Listing.id == thread.listing_id))
        lst = lst_result.scalar_one_or_none()
        if lst:
            cat, item = None, None
            if lst.sku:
                cat_r = await db.execute(select(Catalogue).where(Catalogue.sku == lst.sku))
                cat = cat_r.scalar_one_or_none()
            item_r = await db.execute(select(Item).where(Item.id == lst.item_id))
            item = item_r.scalar_one_or_none()
            title = (cat.title if cat else None) or (item.custom_title if item else None) or lst.sku or "Listing"
            listing_context = {
                "id": str(lst.id), "title": title, "price": lst.price,
                "status": lst.status, "seller_id": str(lst.seller_id),
            }

    stmt = select(Message).where(Message.thread_id == thread_id)\
        .order_by(Message.created_at.desc())\
        .offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    messages = list(reversed(result.scalars().all()))

    # Opening the thread clears the viewer's unread count
    if thread.participant_a == current_user.id:
        thread.unread_a = 0
    else:
        thread.unread_b = 0

    return {
        "thread_id": str(thread.id),
        "viewer_id": str(current_user.id),
        "other_user": {
            "id": str(other_user.id),
            "handle": other_user.handle,
            "name": other_user.name,
            "avatar_url": other_user.avatar_url,
            "rating": float(other_user.rating),
        } if other_user else None,
        "listing": listing_context,
        "unread": thread.unread_a if thread.participant_a == current_user.id else thread.unread_b,
        "messages": [_msg_dict(m) for m in messages],
    }


@router.post("/{thread_id}/messages", status_code=201)
async def send_message(
    thread_id: uuid.UUID,
    body: SendMessageBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    thread = await _get_thread(thread_id, current_user.id, db)
    if not body.body and not body.image_url and not body.offer_item_id:
        raise HTTPException(status_code=400, detail="Message must have body, image, or offer")

    msg = Message(
        thread_id=thread.id,
        sender_id=current_user.id,
        body=body.body,
        image_url=body.image_url,
        offer_item_id=body.offer_item_id,
    )
    db.add(msg)
    _bump_unread(thread, current_user.id)
    thread.last_message_at = datetime.now(timezone.utc)
    await db.flush()
    return _msg_dict(msg)


async def _get_thread(thread_id, user_id, db):
    result = await db.execute(select(Thread).where(Thread.id == thread_id))
    thread = result.scalar_one_or_none()
    if not thread or (thread.participant_a != user_id and thread.participant_b != user_id):
        raise HTTPException(status_code=404, detail="Thread not found")
    return thread


def _bump_unread(thread: Thread, sender_id: uuid.UUID):
    if thread.participant_a == sender_id:
        thread.unread_b += 1
    else:
        thread.unread_a += 1


def _thread_dict(t: Thread, me: uuid.UUID) -> dict:
    return {
        "id": str(t.id),
        "other_user_id": str(t.participant_b if t.participant_a == me else t.participant_a),
        "listing_id": str(t.listing_id) if t.listing_id else None,
        "last_message_at": t.last_message_at.isoformat(),
        "unread": t.unread_a if t.participant_a == me else t.unread_b,
    }


def _thread_dict_full(
    t: Thread, me: uuid.UUID,
    users: dict, listings: dict, last_msgs: dict,
) -> dict:
    other_id = t.participant_b if t.participant_a == me else t.participant_a
    other = users.get(other_id)
    listing = listings.get(t.listing_id) if t.listing_id else None
    last = last_msgs.get(t.id)

    return {
        "id": str(t.id),
        "other_user": {
            "id": str(other.id),
            "handle": other.handle,
            "name": other.name,
            "avatar_url": other.avatar_url,
            "rating": float(other.rating),
        } if other else None,
        "listing": listing,
        "last_message": last.body if last else None,
        "last_message_at": t.last_message_at.isoformat(),
        "unread": t.unread_a if t.participant_a == me else t.unread_b,
    }


def _msg_dict(m: Message) -> dict:
    return {
        "id": str(m.id),
        "thread_id": str(m.thread_id),
        "sender_id": str(m.sender_id),
        "body": m.body,
        "image_url": m.image_url,
        "offer_item_id": str(m.offer_item_id) if m.offer_item_id else None,
        "created_at": m.created_at.isoformat(),
    }
