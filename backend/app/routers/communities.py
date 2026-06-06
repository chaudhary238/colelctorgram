from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
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
    current_user: Optional[User] = Depends(get_optional_user),
):
    stmt = select(Community)
    if category:
        stmt = stmt.where(Community.category == category)
    stmt = stmt.order_by(Community.member_count.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    communities = result.scalars().all()

    member_ids: set[str] = set()
    if current_user:
        mem_result = await db.execute(
            select(CommunityMember.community_id).where(CommunityMember.user_id == current_user.id)
        )
        member_ids = set(mem_result.scalars().all())

    return [_community_dict(c, c.id in member_ids) for c in communities]


@router.get("/{community_id}")
async def get_community(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    result = await db.execute(select(Community).where(Community.id == community_id))
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    is_member = False
    member_role = None
    admins: list[dict] = []

    if current_user:
        mem = await db.execute(
            select(CommunityMember).where(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == current_user.id,
            )
        )
        m = mem.scalar_one_or_none()
        is_member = m is not None
        member_role = m.role if m else None

    # Load admins/mods list
    mods_result = await db.execute(
        select(CommunityMember, User)
        .join(User, CommunityMember.user_id == User.id)
        .where(
            CommunityMember.community_id == community_id,
            CommunityMember.role.in_(["founder", "mod"]),
        )
    )
    for mem_row, user_row in mods_result:
        admins.append({
            "handle": user_row.handle,
            "name": user_row.name,
            "avatar_url": user_row.avatar_url,
            "role": mem_row.role,
        })

    d = _community_dict(community, is_member)
    d["member_role"] = member_role
    d["admins"] = admins
    return d


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
    return _community_dict(community, True)


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


@router.get("/{community_id}/posts")
async def get_community_posts(
    community_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
):
    from app.models.post import Post
    result = await db.execute(
        select(Post)
        .where(Post.community_id == community_id)
        .order_by(Post.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    posts = result.scalars().all()

    author_ids = list({p.user_id for p in posts})
    users_result = await db.execute(select(User).where(User.id.in_(author_ids))) if author_ids else None
    users_by_id = {u.id: u for u in (users_result.scalars().all() if users_result else [])}

    return [
        {
            "id": str(p.id),
            "user_id": str(p.user_id),
            "handle": users_by_id.get(p.user_id, User()).handle if p.user_id in users_by_id else None,
            "name": users_by_id.get(p.user_id, User()).name if p.user_id in users_by_id else None,
            "avatar_url": users_by_id.get(p.user_id, User()).avatar_url if p.user_id in users_by_id else None,
            "tier": users_by_id.get(p.user_id, User()).tier if p.user_id in users_by_id else "verified",
            "type": p.type,
            "body": p.body,
            "images": p.images or [],
            "category": p.category,
            "community_id": p.community_id,
            "likes_count": p.likes_count,
            "comments_count": p.comments_count,
            "saves_count": p.saves_count,
            "created_at": p.created_at.isoformat(),
        }
        for p in posts
    ]


def _community_dict(c: Community, is_member: bool = False) -> dict:
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
        "rules": c.rules or [],
        "is_invite_only": c.is_invite_only,
        "is_member": is_member,
        "created_at": c.created_at.isoformat(),
    }
