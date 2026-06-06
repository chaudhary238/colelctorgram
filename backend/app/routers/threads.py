import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.database import get_db
from app.dependencies import get_current_user
from app.models.thread import Thread, Message
from app.models.user import User

router = APIRouter(prefix="/threads", tags=["messages"])


class CreateThreadBody(BaseModel):
    other_user_id: uuid.UUID
    listing_id: Optional[uuid.UUID] = None
    initial_message: Optional[str] = None


class SendMessageBody(BaseModel):
    body: Optional[str] = None
    image_url: Optional[str] = None
    offer_item_id: Optional[uuid.UUID] = None
    is_deal_init: bool = False


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
    return [_thread_dict(t, current_user.id) for t in threads]


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

    if not thread:
        thread = Thread(participant_a=a, participant_b=b, listing_id=body.listing_id)
        db.add(thread)
        await db.flush()

    if body.initial_message:
        msg = Message(thread_id=thread.id, sender_id=current_user.id, body=body.initial_message)
        db.add(msg)
        _bump_unread(thread, current_user.id)

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
    stmt = select(Message).where(Message.thread_id == thread_id)\
        .order_by(Message.created_at.desc())\
        .offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    messages = result.scalars().all()
    return [_msg_dict(m) for m in reversed(messages)]


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
        is_deal_init=body.is_deal_init,
    )
    db.add(msg)
    _bump_unread(thread, current_user.id)
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


def _msg_dict(m: Message) -> dict:
    return {
        "id": str(m.id),
        "thread_id": str(m.thread_id),
        "sender_id": str(m.sender_id),
        "body": m.body,
        "image_url": m.image_url,
        "offer_item_id": str(m.offer_item_id) if m.offer_item_id else None,
        "is_deal_init": m.is_deal_init,
        "created_at": m.created_at.isoformat(),
    }
