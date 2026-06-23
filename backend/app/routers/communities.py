from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.community import Community, CommunityMember, CommunityJoinRequest
from app.models.user import User

router = APIRouter(prefix="/communities", tags=["communities"])

NOT_FOUND = "Community not found"


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


class UpdateCommunityBody(BaseModel):
    description: Optional[str] = None
    short_desc: Optional[str] = None
    rules: Optional[list[str]] = None
    is_invite_only: Optional[bool] = None
    post_mode: Optional[str] = None


async def _get_member(db: AsyncSession, community_id: str, user_id) -> Optional[CommunityMember]:
    return (
        await db.execute(
            select(CommunityMember).where(
                CommunityMember.community_id == community_id,
                CommunityMember.user_id == user_id,
            )
        )
    ).scalar_one_or_none()


async def _require_mod(db: AsyncSession, community_id: str, user: User):
    """Return (community, membership) if user is founder/mod/admin, else raise."""
    community = (
        await db.execute(select(Community).where(Community.id == community_id))
    ).scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail=NOT_FOUND)
    member = await _get_member(db, community_id, user.id)
    if not (user.is_admin or (member and member.role in ("founder", "mod"))):
        raise HTTPException(status_code=403, detail="Not a community moderator")
    return community, member


@router.get("")
async def list_communities(
    category: Optional[str] = None,
    scope: Optional[str] = None,  # "moderating" → communities the caller founds/mods
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    if scope == "moderating":
        if not current_user:
            raise HTTPException(status_code=401, detail="Login required")
        # Communities the caller can host an event under (founder/mod), excluding
        # rejected/archived. Powers the EventCreate "use a community I run" picker.
        stmt = (
            select(Community)
            .join(CommunityMember, CommunityMember.community_id == Community.id)
            .where(
                CommunityMember.user_id == current_user.id,
                CommunityMember.role.in_(("founder", "mod")),
                Community.status.in_(("approved", "pending")),
            )
            .order_by(Community.name)
            .offset((page - 1) * limit)
            .limit(limit)
        )
        communities = (await db.execute(stmt)).scalars().all()
        return [
            {**_community_dict(c, True),
             "member_role": "founder" if c.founder_id == current_user.id else "mod"}
            for c in communities
        ]

    stmt = select(Community)
    if category:
        stmt = stmt.where(Community.category == category)
    # Only approved communities are public; a founder also sees their own pending ones.
    # Rejected/archived never appear in the directory.
    if current_user:
        stmt = stmt.where(
            (Community.status == "approved")
            | ((Community.founder_id == current_user.id) & (Community.status == "pending"))
        )
    else:
        stmt = stmt.where(Community.status == "approved")
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
        raise HTTPException(status_code=404, detail=NOT_FOUND)

    # A non-approved community (pending/rejected/archived) is only visible to its
    # founder or an admin.
    if community.status != "approved" and (
        not current_user
        or (current_user.id != community.founder_id and not current_user.is_admin)
    ):
        raise HTTPException(status_code=404, detail=NOT_FOUND)

    is_member = False
    member_role = None
    join_state = "none"
    admins: list[dict] = []

    if current_user:
        m = await _get_member(db, community_id, current_user.id)
        is_member = m is not None
        member_role = m.role if m else None
        if is_member:
            join_state = "member"
        elif community.is_invite_only:
            # invite-only → check for a pending join request (DF-26)
            req = (
                await db.execute(
                    select(CommunityJoinRequest).where(
                        CommunityJoinRequest.community_id == community_id,
                        CommunityJoinRequest.user_id == current_user.id,
                        CommunityJoinRequest.status == "pending",
                    )
                )
            ).scalar_one_or_none()
            if req:
                join_state = "requested"

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
    d["join_state"] = join_state
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
        # Admin-created communities go live immediately; user-created ones await review.
        status="approved" if current_user.is_admin else "pending",
    )
    db.add(community)
    db.add(CommunityMember(community_id=body.id, user_id=current_user.id, role="founder"))
    community.member_count = 1
    await db.flush()
    return _community_dict(community, True)


@router.post("/{community_id}/join")
async def join_community(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community = (await db.execute(select(Community).where(Community.id == community_id))).scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail=NOT_FOUND)

    if await _get_member(db, community_id, current_user.id):
        return {"join_state": "member"}

    # DF-26 — invite-only communities require approval: create a pending join request
    # instead of an instant membership.
    if community.is_invite_only:
        existing_req = (
            await db.execute(
                select(CommunityJoinRequest).where(
                    CommunityJoinRequest.community_id == community_id,
                    CommunityJoinRequest.user_id == current_user.id,
                    CommunityJoinRequest.status == "pending",
                )
            )
        ).scalar_one_or_none()
        if not existing_req:
            db.add(CommunityJoinRequest(community_id=community_id, user_id=current_user.id))
        return {"join_state": "requested"}

    db.add(CommunityMember(community_id=community_id, user_id=current_user.id))
    community.member_count += 1
    return {"join_state": "member"}


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
    current_user: Optional[User] = Depends(get_optional_user),
):
    from app.models.post import Post
    # DF-27 — pending (awaiting-review) posts are hidden, except to their own author.
    stmt = select(Post).where(Post.community_id == community_id)
    if current_user:
        stmt = stmt.where(
            (Post.status == "published") | (Post.user_id == current_user.id)
        )
    else:
        stmt = stmt.where(Post.status == "published")
    result = await db.execute(
        stmt.order_by(Post.created_at.desc()).offset((page - 1) * limit).limit(limit)
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
            "status": p.status,
            "likes_count": p.likes_count,
            "comments_count": p.comments_count,
            "saves_count": p.saves_count,
            "created_at": p.created_at.isoformat(),
        }
        for p in posts
    ]


# ── Management (DF-19 / DF-26 / DF-27) — founder/mod gated ────────────────────

@router.patch("/{community_id}")
async def update_community(
    community_id: str,
    body: UpdateCommunityBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community, _ = await _require_mod(db, community_id, current_user)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(community, field, value)
    await db.flush()
    return _community_dict(community, True)


@router.post("/{community_id}/archive", status_code=204)
async def archive_community(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community, member = await _require_mod(db, community_id, current_user)
    if not (current_user.is_admin or (member and member.role == "founder")):
        raise HTTPException(status_code=403, detail="Only the founder can archive")
    community.status = "archived"


@router.get("/{community_id}/members")
async def list_members(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _require_mod(db, community_id, current_user)
    rows = await db.execute(
        select(CommunityMember, User)
        .join(User, CommunityMember.user_id == User.id)
        .where(CommunityMember.community_id == community_id)
        .order_by(CommunityMember.joined_at.asc())
    )
    return [
        {
            "handle": u.handle,
            "name": u.name,
            "avatar_url": u.avatar_url,
            "tier": u.tier,
            "role": m.role,
        }
        for m, u in rows
    ]


@router.patch("/{community_id}/members/{handle}/role", status_code=204)
async def set_member_role(
    community_id: str,
    handle: str,
    role: str = Query(..., pattern="^(mod|member)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _, actor = await _require_mod(db, community_id, current_user)
    if not (current_user.is_admin or (actor and actor.role == "founder")):
        raise HTTPException(status_code=403, detail="Only the founder can change roles")
    target_user = (await db.execute(select(User).where(User.handle == handle))).scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    member = await _get_member(db, community_id, target_user.id)
    if not member:
        raise HTTPException(status_code=404, detail="Not a member")
    if member.role == "founder":
        raise HTTPException(status_code=400, detail="Cannot change the founder's role")
    member.role = role


@router.delete("/{community_id}/members/{handle}", status_code=204)
async def remove_member(
    community_id: str,
    handle: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community, _ = await _require_mod(db, community_id, current_user)
    target_user = (await db.execute(select(User).where(User.handle == handle))).scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    member = await _get_member(db, community_id, target_user.id)
    if not member:
        return
    if member.role == "founder":
        raise HTTPException(status_code=400, detail="Cannot remove the founder")
    await db.delete(member)
    community.member_count = max(0, community.member_count - 1)


# ── Join requests (DF-26) ─────────────────────────────────────────────────────

@router.get("/{community_id}/requests")
async def list_join_requests(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _require_mod(db, community_id, current_user)
    rows = await db.execute(
        select(CommunityJoinRequest, User)
        .join(User, CommunityJoinRequest.user_id == User.id)
        .where(
            CommunityJoinRequest.community_id == community_id,
            CommunityJoinRequest.status == "pending",
        )
        .order_by(CommunityJoinRequest.created_at.asc())
    )
    return [
        {
            "handle": u.handle,
            "name": u.name,
            "avatar_url": u.avatar_url,
            "tier": u.tier,
            "deals": getattr(u, "deals_count", 0),
            "created_at": r.created_at.isoformat(),
        }
        for r, u in rows
    ]


async def _resolve_request(db: AsyncSession, community_id: str, handle: str) -> CommunityJoinRequest:
    target_user = (await db.execute(select(User).where(User.handle == handle))).scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    req = (
        await db.execute(
            select(CommunityJoinRequest).where(
                CommunityJoinRequest.community_id == community_id,
                CommunityJoinRequest.user_id == target_user.id,
                CommunityJoinRequest.status == "pending",
            )
        )
    ).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="No pending request")
    return req


@router.post("/{community_id}/requests/{handle}/approve", status_code=204)
async def approve_request(
    community_id: str,
    handle: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community, _ = await _require_mod(db, community_id, current_user)
    req = await _resolve_request(db, community_id, handle)
    req.status = "approved"
    if not await _get_member(db, community_id, req.user_id):
        db.add(CommunityMember(community_id=community_id, user_id=req.user_id))
        community.member_count += 1


@router.post("/{community_id}/requests/{handle}/reject", status_code=204)
async def reject_request(
    community_id: str,
    handle: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _require_mod(db, community_id, current_user)
    req = await _resolve_request(db, community_id, handle)
    req.status = "rejected"


# ── Post moderation queue (DF-27) ─────────────────────────────────────────────

@router.get("/{community_id}/pending-posts")
async def list_pending_posts(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.post import Post
    await _require_mod(db, community_id, current_user)
    rows = await db.execute(
        select(Post, User)
        .join(User, Post.user_id == User.id)
        .where(Post.community_id == community_id, Post.status == "pending")
        .order_by(Post.created_at.desc())
    )
    return [
        {
            "id": str(p.id),
            "handle": u.handle,
            "name": u.name,
            "avatar_url": u.avatar_url,
            "type": p.type,
            "body": p.body,
            "images": p.images or [],
            "created_at": p.created_at.isoformat(),
        }
        for p, u in rows
    ]


async def _resolve_pending_post(db: AsyncSession, community_id: str, post_id: str):
    from app.models.post import Post
    post = (
        await db.execute(
            select(Post).where(Post.id == post_id, Post.community_id == community_id)
        )
    ).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("/{community_id}/posts/{post_id}/approve", status_code=204)
async def approve_post(
    community_id: str,
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    community, _ = await _require_mod(db, community_id, current_user)
    post = await _resolve_pending_post(db, community_id, post_id)
    if post.status == "pending":
        post.status = "published"
        community.post_count += 1


@router.post("/{community_id}/posts/{post_id}/reject", status_code=204)
async def reject_post(
    community_id: str,
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _require_mod(db, community_id, current_user)
    post = await _resolve_pending_post(db, community_id, post_id)
    await db.delete(post)


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
        "status": c.status,
        "created_at": c.created_at.isoformat(),
    }
