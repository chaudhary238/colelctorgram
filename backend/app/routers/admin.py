from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.user import User
from app.models.post import Post
from app.models.catalogue import Catalogue
from app.models.trust import Report
from app.models.event import Event
from app.models.community import Community

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    users = (await db.execute(select(func.count(User.id)))).scalar()
    posts = (await db.execute(select(func.count(Post.id)))).scalar()
    reports = (await db.execute(select(func.count(Report.id)).where(Report.status == "pending"))).scalar()
    return {"total_users": users, "total_posts": posts, "pending_reports": reports}


@router.get("/reports")
async def list_reports(
    status: str = "pending",
    page: int = Query(1, ge=1),
    limit: int = Query(30, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    stmt = select(Report).where(Report.status == status)\
        .order_by(Report.created_at.desc())\
        .offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    reports = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "reporter_id": str(r.reporter_id),
            "target_type": r.target_type,
            "target_id": str(r.target_id),
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]


@router.get("/catalogue/pending")
async def pending_catalogue(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Catalogue).where(Catalogue.is_approved == False))
    items = result.scalars().all()
    return [{"sku": i.sku, "title": i.title, "brand": i.brand, "category": i.category} for i in items]


@router.patch("/catalogue/{sku}/approve", status_code=204)
async def approve_catalogue(
    sku: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Catalogue).where(Catalogue.sku == sku))
    item = result.scalar_one_or_none()
    if item:
        item.is_approved = True


@router.patch("/events/{event_id}/approve", status_code=204)
async def approve_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if event:
        event.status = "active"


@router.get("/communities/pending")
async def pending_communities(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(
        select(Community, User)
        .join(User, Community.founder_id == User.id)
        .where(Community.status == "pending")
        .order_by(Community.created_at.desc())
    )
    return [
        {
            "id": c.id,
            "name": c.name,
            "category": c.category,
            "short_desc": c.short_desc,
            "description": c.description,
            "rules": c.rules or [],
            "post_mode": c.post_mode,
            "is_invite_only": c.is_invite_only,
            "founder_handle": u.handle,
            "founder_name": u.name,
            "created_at": c.created_at.isoformat(),
        }
        for c, u in result
    ]


@router.patch("/communities/{community_id}/approve", status_code=204)
async def approve_community(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Community).where(Community.id == community_id))
    community = result.scalar_one_or_none()
    if community:
        community.status = "approved"


@router.patch("/communities/{community_id}/reject", status_code=204)
async def reject_community(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Community).where(Community.id == community_id))
    community = result.scalar_one_or_none()
    if community:
        community.status = "rejected"
