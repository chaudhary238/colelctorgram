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
    cover_image_url: Optional[str] = None
    bring: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None


class UpdateEventBody(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    community_id: Optional[str] = None
    category: Optional[str] = None
    mode: Optional[str] = None
    city: Optional[str] = None
    venue: Optional[str] = None
    online_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    bring: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


async def _require_host(db: AsyncSession, event_id: uuid.UUID, user: User) -> Event:
    """Return the event if the user is its host (or an admin), else raise."""
    event = (
        await db.execute(select(Event).where(Event.id == event_id))
    ).scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if not (user.is_admin or event.host_id == user.id):
        raise HTTPException(status_code=403, detail="Not the event host")
    return event


@router.get("")
async def list_events(
    category: Optional[str] = None,
    city: Optional[str] = None,
    mode: Optional[str] = None,
    scope: Optional[str] = None,  # "mine" → the caller's own events (any status)
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    if scope == "mine":
        if not current_user:
            raise HTTPException(status_code=401, detail="Login required")
        # "Hosting" view — the host sees their own events in every state.
        stmt = select(Event).where(Event.host_id == current_user.id)
    else:
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

    my_rsvps: dict[uuid.UUID, str] = {}
    if current_user:
        rows = await db.execute(
            select(EventInterest.event_id, EventInterest.status).where(
                EventInterest.user_id == current_user.id
            )
        )
        my_rsvps = dict(rows.all())

    host_ids = list({e.host_id for e in events})
    hosts_result = await db.execute(select(User).where(User.id.in_(host_ids))) if host_ids else None
    hosts = {u.id: u for u in (hosts_result.scalars().all() if hosts_result else [])}

    return [
        _event_dict(e, hosts.get(e.host_id), my_rsvps.get(e.id), current_user)
        for e in events
    ]


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

    # Only the host (or an admin) may see an event that isn't live yet / was pulled.
    is_host = bool(current_user) and (current_user.is_admin or event.host_id == current_user.id)
    if event.status != "active" and not is_host:
        raise HTTPException(status_code=404, detail="Event not found")

    host_result = await db.execute(select(User).where(User.id == event.host_id))
    host = host_result.scalar_one_or_none()

    my_rsvp: Optional[str] = None
    if current_user:
        my_rsvp = (
            await db.execute(
                select(EventInterest.status).where(
                    EventInterest.event_id == event_id,
                    EventInterest.user_id == current_user.id,
                )
            )
        ).scalar_one_or_none()

    return _event_dict(event, host, my_rsvp, current_user)


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
        cover_image_url=body.cover_image_url,
        bring=body.bring,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        is_admin_created=current_user.is_admin,
        status="active" if current_user.is_admin else "pending_approval",
    )
    db.add(event)
    await db.flush()
    return _event_dict(event, current_user, None, current_user)


@router.patch("/{event_id}")
async def update_event(
    event_id: uuid.UUID,
    body: UpdateEventBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = await _require_host(db, event_id, current_user)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    await db.flush()

    host = (
        await db.execute(select(User).where(User.id == event.host_id))
    ).scalar_one_or_none()
    return _event_dict(event, host, None, current_user)


@router.post("/{event_id}/cancel", status_code=204)
async def cancel_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = await _require_host(db, event_id, current_user)
    event.status = "cancelled"


@router.get("/{event_id}/interested")
async def list_interested(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Guest list — everyone who RSVP'd, with their going/interested status. Visible to
    any logged-in user for a live event (Facebook-style); host/admin can always view."""
    event = (
        await db.execute(select(Event).where(Event.id == event_id))
    ).scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    is_host = current_user.is_admin or event.host_id == current_user.id
    if not is_host and event.status != "active":
        raise HTTPException(status_code=404, detail="Event not found")
    result = await db.execute(
        select(User, EventInterest.status)
        .join(EventInterest, EventInterest.user_id == User.id)
        .where(EventInterest.event_id == event_id)
        .order_by(EventInterest.created_at.desc())
    )
    return [
        {
            "handle": u.handle,
            "name": u.name,
            "avatar_url": u.avatar_url,
            "city": u.city,
            "tier": u.tier,
            "status": st,
        }
        for u, st in result.all()
    ]


def _adjust(event: Event, rsvp_status: str, delta: int) -> None:
    field = "going_count" if rsvp_status == "going" else "interested_count"
    setattr(event, field, max(0, getattr(event, field) + delta))


@router.post("/{event_id}/interest", status_code=204)
async def set_rsvp(
    event_id: uuid.UUID,
    rsvp: str = Query("going", alias="status"),  # going | interested
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if rsvp not in ("going", "interested"):
        raise HTTPException(status_code=400, detail="Invalid RSVP status")

    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    interest = (
        await db.execute(
            select(EventInterest).where(
                EventInterest.event_id == event_id,
                EventInterest.user_id == current_user.id,
            )
        )
    ).scalar_one_or_none()

    if interest is None:
        db.add(EventInterest(event_id=event_id, user_id=current_user.id, status=rsvp))
        _adjust(event, rsvp, +1)
    elif interest.status == rsvp:
        await db.delete(interest)             # tapping the same choice clears the RSVP
        _adjust(event, rsvp, -1)
    else:
        _adjust(event, interest.status, -1)   # switch going ↔ interested
        _adjust(event, rsvp, +1)
        interest.status = rsvp


def _event_dict(
    e: Event,
    host: Optional[User],
    my_rsvp: Optional[str] = None,   # "going" | "interested" | None
    viewer: Optional[User] = None,
) -> dict:
    is_host = bool(viewer) and (viewer.is_admin or e.host_id == viewer.id)
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
        "online_url": e.online_url,
        "cover_image_url": e.cover_image_url,
        "bring": e.bring,
        "starts_at": e.starts_at.isoformat(),
        "ends_at": e.ends_at.isoformat() if e.ends_at else None,
        "going_count": e.going_count,
        "interested_count": e.interested_count,
        "my_rsvp": my_rsvp,
        "is_host": is_host,
        "status": e.status,
        "created_at": e.created_at.isoformat(),
    }
