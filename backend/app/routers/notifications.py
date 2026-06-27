import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.database import get_db
from app.dependencies import get_current_user
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(30, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Notification)\
        .where(Notification.user_id == current_user.id)\
        .order_by(Notification.created_at.desc())\
        .offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    notifs = result.scalars().all()
    return [_notif_dict(n) for n in notifs]


@router.patch("/{notif_id}/read", status_code=204)
async def mark_read(
    notif_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        update(Notification)
        .where(Notification.id == notif_id, Notification.user_id == current_user.id)
        .values(is_read=True)
    )


@router.patch("/read-all", status_code=204)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id, Notification.is_read == False)
        .values(is_read=True)
    )


def _notif_dict(n: Notification) -> dict:
    actor = n.actor
    return {
        "id": str(n.id),
        "kind": n.kind,
        "title": n.title,
        "body": n.body,
        "actor": {
            "handle": actor.handle,
            "name": actor.name,
            "avatar_url": actor.avatar_url,
        } if actor else None,
        "ref_type": n.ref_type,
        "ref_id": n.ref_id,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat(),
    }
