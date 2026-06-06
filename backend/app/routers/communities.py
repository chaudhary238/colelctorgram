from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.community import Community, CommunityMember
from app.models.user import User

router = APIRouter(prefix="/communities", tags=["communities"])


class CreateCommunityBody(BaseModel):
    id: str  # slug
    name: str
    description: Optional[str] = None
    short_desc: Optional[str] = None
    tag: Optional[str] = None
    category: str
    tone: str = "plum"
    post_mode: str = "open"
    rules: list[str] = []
    is_invite_only: bool = False


@router.get("")
async def list_communities(
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Community)
    if category:
        stmt = stmt.where(Community.category == category)
    stmt = stmt.order_by(Community.member_count.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    communities = result.scalars().all()
    return [_community_dict(c) for c in communities]


@router.get("/{community_id}")
async def get_community(community_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Community).where(Community.id == community_id))
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    return _community_dict(community)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_community(
    body: CreateCommunityBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(select(Community).where(Community.id == body.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Community ID already taken")

    community = Community(
        id=body.id,
        name=body.name,
        description=body.description,
        short_desc=body.short_desc,
        tag=body.tag,
        category=body.category,
        tone=body.tone,
        founder_id=current_user.id,
        post_mode=body.post_mode,
        rules=body.rules,
        is_invite_only=body.is_invite_only,
        is_admin_created=current_user.is_admin,
    )
    db.add(community)
    db.add(CommunityMember(community_id=body.id, user_id=current_user.id, role="founder"))
    community.member_count = 1
    await db.flush()
    return _community_dict(community)


@router.post("/{community_id}/join", status_code=204)
async def join_community(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = (await db.execute(select(Community).where(Community.id == community_id))).scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    existing = await db.execute(
        select(CommunityMember).where(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        return

    db.add(CommunityMember(community_id=community_id, user_id=current_user.id))
    community.member_count += 1


@router.delete("/{community_id}/join", status_code=204)
async def leave_community(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(CommunityMember).where(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == current_user.id,
        )
    )
    member = result.scalar_one_or_none()
    if member:
        await db.delete(member)
        community = (await db.execute(select(Community).where(Community.id == community_id))).scalar_one_or_none()
        if community:
            community.member_count = max(0, community.member_count - 1)


def _community_dict(c: Community) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "description": c.description,
        "short_desc": c.short_desc,
        "tag": c.tag,
        "category": c.category,
        "tone": c.tone,
        "member_count": c.member_count,
        "post_count": c.post_count,
        "post_mode": c.post_mode,
        "rules": c.rules,
        "is_invite_only": c.is_invite_only,
        "created_at": c.created_at.isoformat(),
    }
