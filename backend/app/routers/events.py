import uuid
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.database import get_db
from app.dependencies import get_current_user
from app.models.event import Event, EventInterest, EventReminder
from app.models.community import Community
from app.models.user import User
from app.services.gamification import award_xp

router = APIRouter(prefix="/events", tags=["events"])


class CreateEventBody(BaseModel):
    title: str
    description: Optional[str] = None
    community_id: Optional[str] = None
    categories: list[str] = []
    mode: str = "in_person"
    city: Optional[str] = None
    country: Optional[str] = None       # DV8 — CityPicker's second output
    pincode: Optional[str] = None
    venue: Optional[str] = None         # DV8 — venue NAME only
    address: Optional[str] = None       # DV8 — full address details (shown post-RSVP)
    online_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    starts_at: datetime
    ends_at: Optional[datetime] = None
    # DV8 events rebuild — real pricing + ticketing/contact.
    is_free: bool = True
    price: int = 0                      # minor units of currency
    currency: str = "INR"
    ticket_url: Optional[str] = None
    contact: Optional[str] = None


class UpdateEventBody(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    community_id: Optional[str] = None
    categories: Optional[list[str]] = None
    mode: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None
    venue: Optional[str] = None
    address: Optional[str] = None
    online_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    is_free: Optional[bool] = None
    price: Optional[int] = None
    currency: Optional[str] = None
    ticket_url: Optional[str] = None
    contact: Optional[str] = None


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
    upcoming: Optional[bool] = None,  # default: True for browse, False for scope=mine
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if scope == "mine":
        if not current_user:
            raise HTTPException(status_code=401, detail="Login required")
        # "Hosting" view — the host sees their own events in every state.
        stmt = select(Event).where(Event.host_id == current_user.id)
    else:
        stmt = select(Event).where(Event.status == "active")
    # Nothing ever flips status to "past", so a date filter is the only thing
    # standing between "Upcoming events" and July: browse defaults to upcoming
    # (an event stays visible until it ENDS); hosts default to full history.
    if upcoming is None:
        upcoming = scope != "mine"
    if upcoming:
        stmt = stmt.where(func.coalesce(Event.ends_at, Event.starts_at) >= func.now())
    if category:
        stmt = stmt.where(Event.categories.contains([category]))
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

    com_ids = list({e.community_id for e in events if e.community_id})
    coms_result = await db.execute(select(Community).where(Community.id.in_(com_ids))) if com_ids else None
    coms = {c.id: c for c in (coms_result.scalars().all() if coms_result else [])}

    return [
        _event_dict(e, hosts.get(e.host_id), my_rsvps.get(e.id), current_user, coms.get(e.community_id))
        for e in events
    ]


@router.get("/{event_id}")
async def get_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
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

    com = None
    if event.community_id:
        com = (
            await db.execute(select(Community).where(Community.id == event.community_id))
        ).scalar_one_or_none()

    my_rsvp: Optional[str] = None
    my_reminder = False
    if current_user:
        my_rsvp = (
            await db.execute(
                select(EventInterest.status).where(
                    EventInterest.event_id == event_id,
                    EventInterest.user_id == current_user.id,
                )
            )
        ).scalar_one_or_none()
        my_reminder = (
            await db.execute(
                select(EventReminder).where(
                    EventReminder.event_id == event_id,
                    EventReminder.user_id == current_user.id,
                )
            )
        ).scalar_one_or_none() is not None

    return _event_dict(event, host, my_rsvp, current_user, com, my_reminder)


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
        categories=body.categories,
        mode=body.mode,
        city=body.city,
        country=body.country,
        pincode=body.pincode,
        venue=body.venue,
        address=body.address,
        online_url=body.online_url,
        cover_image_url=body.cover_image_url,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        is_free=body.is_free,
        price=0 if body.is_free else max(body.price, 0),
        currency=body.currency,
        ticket_url=body.ticket_url,
        contact=body.contact,
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
    # DV8 — a free event carries no price; flipping the toggle clears the stale one.
    if event.is_free:
        event.price = 0
    await db.flush()

    host = (
        await db.execute(select(User).where(User.id == event.host_id))
    ).scalar_one_or_none()
    com = None
    if event.community_id:
        com = (
            await db.execute(select(Community).where(Community.id == event.community_id))
        ).scalar_one_or_none()
    return _event_dict(event, host, None, current_user, com)


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
            "status": st,
        }
        for u, st in result.all()
    ]


async def _adjust(db: AsyncSession, event_id: uuid.UUID, rsvp_status: str, delta: int) -> None:
    """B-75 — atomic RSVP counter move (was a read-modify-write on the ORM instance)."""
    col = Event.going_count if rsvp_status == "going" else Event.interested_count
    value = col + delta if delta > 0 else func.greatest(col + delta, 0)
    await db.execute(update(Event).where(Event.id == event_id).values({col.key: value}))


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

    # B-75/B-76 — race-safe tri-state toggle: every branch is guarded by the
    # rowcount of the row operation, so a double-tap can't 500 on the PK or
    # move a counter twice; counter moves are atomic SQL.
    inserted = await db.execute(
        pg_insert(EventInterest)
        .values(event_id=event_id, user_id=current_user.id, status=rsvp)
        .on_conflict_do_nothing()
    )
    if inserted.rowcount:
        await _adjust(db, event_id, rsvp, +1)
    else:
        interest = (
            await db.execute(
                select(EventInterest).where(
                    EventInterest.event_id == event_id,
                    EventInterest.user_id == current_user.id,
                )
            )
        ).scalar_one_or_none()
        if interest is None:
            pass  # raced with a concurrent clear — nothing to do
        elif interest.status == rsvp:
            # tapping the same choice clears the RSVP
            removed = await db.execute(
                delete(EventInterest).where(
                    EventInterest.event_id == event_id,
                    EventInterest.user_id == current_user.id,
                    EventInterest.status == rsvp,
                )
            )
            if removed.rowcount:
                await _adjust(db, event_id, rsvp, -1)
        else:
            # switch going ↔ interested — only count when this request won the switch
            old_status = interest.status
            switched = await db.execute(
                update(EventInterest)
                .where(
                    EventInterest.event_id == event_id,
                    EventInterest.user_id == current_user.id,
                    EventInterest.status == old_status,
                )
                .values(status=rsvp)
            )
            if switched.rowcount:
                await _adjust(db, event_id, old_status, -1)
                await _adjust(db, event_id, rsvp, +1)

    # XP: +10 for going to an event, dedup'd on event id (GM-05). A later
    # un-RSVP/re-RSVP is a no-op — the grant already landed once.
    if rsvp == "going":
        await award_xp(db, current_user, "rsvp", ref_id=str(event_id), ref_type="event")


@router.post("/{event_id}/reminder", status_code=204)
async def set_reminder(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Opt into a pre-start reminder for this event (v3 bell). Idempotent — a
    repeat tap is a no-op. The send_event_reminders worker delivers it."""
    event = (await db.execute(select(Event).where(Event.id == event_id))).scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    existing = (
        await db.execute(
            select(EventReminder).where(
                EventReminder.event_id == event_id,
                EventReminder.user_id == current_user.id,
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        db.add(EventReminder(event_id=event_id, user_id=current_user.id))


@router.delete("/{event_id}/reminder", status_code=204)
async def clear_reminder(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Turn the pre-start reminder off."""
    existing = (
        await db.execute(
            select(EventReminder).where(
                EventReminder.event_id == event_id,
                EventReminder.user_id == current_user.id,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        await db.delete(existing)


def _event_dict(
    e: Event,
    host: Optional[User],
    my_rsvp: Optional[str] = None,   # "going" | "interested" | None
    viewer: Optional[User] = None,
    community: Optional[Community] = None,
    my_reminder: bool = False,
) -> dict:
    # Audit §8#17 — is_host means THE HOST: a site admin on someone else's event
    # must not see "Hosted by You" or lose the RSVP footer. Admin edit rights
    # travel separately as can_manage.
    is_host = bool(viewer) and e.host_id == viewer.id
    can_manage = is_host or bool(viewer and viewer.is_admin)
    # Audit §8#2 — "Attendees see this exact address once they RSVP": the street
    # address is withheld until the viewer RSVPs (host/admin always see it).
    sees_address = can_manage or my_rsvp in ("going", "interested")
    address = e.address if sees_address else None
    return {
        "id": str(e.id),
        "title": e.title,
        "description": e.description,
        "host_id": str(e.host_id),
        "host_handle": host.handle if host else None,
        "host_name": host.name if host else None,
        "host_avatar_url": host.avatar_url if host else None,
        "host_city": host.city if host else None,
        "community_id": e.community_id,
        "community": (
            {"id": community.id, "name": community.name, "tag": community.tag,
             "tone": community.tone, "member_count": community.member_count}
            if community else None
        ),
        "categories": e.categories or [],
        "mode": e.mode,
        "city": e.city,
        "country": e.country,
        "pincode": e.pincode,
        "venue": e.venue,
        "address": address,
        # DV8 — the joined display form ("venue — address") used by cards/detail.
        "where": f"{e.venue} — {address}" if e.venue and address else e.venue,
        "online_url": e.online_url,
        "cover_image_url": e.cover_image_url,
        # v8 removed "What to bring" — the column stays for legacy rows but the
        # field no longer rides the payload.
        "is_free": e.is_free,
        "price": e.price,
        "currency": e.currency,
        "ticket_url": e.ticket_url,
        "contact": e.contact,
        "starts_at": e.starts_at.isoformat(),
        "ends_at": e.ends_at.isoformat() if e.ends_at else None,
        "going_count": e.going_count,
        "interested_count": e.interested_count,
        "my_rsvp": my_rsvp,
        "my_reminder": my_reminder,
        "is_host": is_host,
        # Site admins (and the host) can open /manage without being shown as host.
        "can_manage": can_manage,
        "status": e.status,
        "created_at": e.created_at.isoformat(),
    }
