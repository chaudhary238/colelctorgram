import uuid
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.event import Event, EventInterest
from app.models.user import User

router = APIRouter(prefix="/events", tags=["events"])


class CreateEventBody(BaseModel):
    title: str
    description: Optional[str] = None
    community_id: Optional[str] = None
    category: Optional[str] = None
    mode: str = "in_person"
    city: Optional[str] = None
    venue: Optional[str] = None
    online_url: Optional[str] = None
    starts_at: datetime


@router.get("")
async def list_events(
    category: Optional[str] = None,
    city: Optional[str] = None,
    mode: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Event).where(Event.status == "active")
    if category:
        stmt = stmt.where(Event.category == category)
    if city:
        stmt = stmt.where(Event.city == city)
    if mode:
        stmt = stmt.where(Event.mode == mode)
    stmt = stmt.order_by(Event.starts_at).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    return [_event_dict(e) for e in result.scalars().all()]


@router.get("/{event_id}")
async def get_event(event_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return _event_dict(event)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_event(
    body: CreateEventBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = Event(
        title=body.title,
        description=body.description,
        host_id=current_user.id,
        community_id=body.community_id,
        category=body.category,
        mode=body.mode,
        city=body.city,
        venue=body.venue,
        online_url=body.online_url,
        starts_at=body.starts_at,
        is_admin_created=current_user.is_admin,
        status="active" if current_user.is_admin else "pending_approval",
    )
    db.add(event)
    await db.flush()
    return _event_dict(event)


@router.post("/{event_id}/interest", status_code=204)
async def toggle_interest(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing = await db.execute(
        select(EventInterest).where(
            EventInterest.event_id == event_id,
            EventInterest.user_id == current_user.id,
        )
    )
    interest = existing.scalar_one_or_none()
    if interest:
        await db.delete(interest)
        event.interested_count = max(0, event.interested_count - 1)
    else:
        db.add(EventInterest(event_id=event_id, user_id=current_user.id))
        event.interested_count += 1


def _event_dict(e: Event) -> dict:
    return {
        "id": str(e.id),
        "title": e.title,
        "description": e.description,
        "host_id": str(e.host_id),
        "community_id": e.community_id,
        "category": e.category,
        "mode": e.mode,
        "city": e.city,
        "venue": e.venue,
        "starts_at": e.starts_at.isoformat(),
        "interested_count": e.interested_count,
        "status": e.status,
        "created_at": e.created_at.isoformat(),
    }
