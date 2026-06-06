import uuid
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
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
    current_user: Optional[User] = Depends(get_optional_user),
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
    events = result.scalars().all()

    interested_ids: set[uuid.UUID] = set()
    if current_user:
        int_result = await db.execute(
            select(EventInterest.event_id).where(EventInterest.user_id == current_user.id)
        )
        interested_ids = set(int_result.scalars().all())

    host_ids = list({e.host_id for e in events})
    hosts_result = await db.execute(select(User).where(User.id.in_(host_ids))) if host_ids else None
    hosts = {u.id: u for u in (hosts_result.scalars().all() if hosts_result else [])}

    return [_event_dict(e, hosts.get(e.host_id), e.id in interested_ids) for e in events]


@router.get("/{event_id}")
async def get_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    host_result = await db.execute(select(User).where(User.id == event.host_id))
    host = host_result.scalar_one_or_none()

    is_interested = False
    if current_user:
        int_result = await db.execute(
            select(EventInterest).where(
                EventInterest.event_id == event_id,
                EventInterest.user_id == current_user.id,
            )
        )
        is_interested = int_result.scalar_one_or_none() is not None

    return _event_dict(event, host, is_interested)


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
    return _event_dict(event, current_user, False)


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


def _event_dict(e: Event, host: Optional[User], is_interested: bool = False) -> dict:
    return {
        "id": str(e.id),
        "title": e.title,
        "description": e.description,
        "host_id": str(e.host_id),
        "host_handle": host.handle if host else None,
        "host_name": host.name if host else None,
        "host_avatar_url": host.avatar_url if host else None,
        "community_id": e.community_id,
        "category": e.category,
        "mode": e.mode,
        "city": e.city,
        "venue": e.venue,
        "starts_at": e.starts_at.isoformat(),
        "interested_count": e.interested_count,
        "is_interested": is_interested,
        "status": e.status,
        "created_at": e.created_at.isoformat(),
    }
