from typing import Optional
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, update, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.database import get_db
from app.dependencies import get_current_user
from app.models.community import Community, CommunityMember, CommunityJoinRequest
from app.models.deal import Vouch
from app.models.user import User

# Founder first, then mods, then members — shared ordering for roster/member lists.
_ROLE_ORDER = case((CommunityMember.role == "founder", 0), (CommunityMember.role == "mod", 1), else_=2)

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
    current_user: User = Depends(get_current_user),
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
    requested_ids: set[str] = set()
    if current_user:
        mem_result = await db.execute(
            select(CommunityMember.community_id).where(CommunityMember.user_id == current_user.id)
        )
        member_ids = set(mem_result.scalars().all())
        # QA2 — pending join requests so a private "Requested" state survives a reload.
        req_result = await db.execute(
            select(CommunityJoinRequest.community_id).where(
                CommunityJoinRequest.user_id == current_user.id,
                CommunityJoinRequest.status == "pending",
            )
        )
        requested_ids = set(req_result.scalars().all())

    # QA2 — "new posts in the last 24h" badge + most-active ordering. One grouped query
    # over the page's communities (cheap; no per-card round-trips, no stored counter).
    recent_counts = await _recent_post_counts(db, [c.id for c in communities])

    def _js(cid: str) -> str:
        return "member" if cid in member_ids else "requested" if cid in requested_ids else "none"

    return [
        _community_dict(c, c.id in member_ids, join_state=_js(c.id),
                        recent_post_count=recent_counts.get(c.id, 0))
        for c in communities
    ]


async def _recent_post_counts(db: AsyncSession, community_ids: list[str], hours: int = 24) -> dict[str, int]:
    """Published posts added to each community in the last `hours` — powers the
    'N new' activity badge and most-active sort (QA2). Empty dict for no ids."""
    if not community_ids:
        return {}
    from app.models.post import Post, PostCommunity
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    rows = await db.execute(
        select(PostCommunity.community_id, func.count())
        .join(Post, Post.id == PostCommunity.post_id)
        .where(
            PostCommunity.community_id.in_(community_ids),
            PostCommunity.status == "published",
            Post.status != "removed",
            Post.created_at >= since,
        )
        .group_by(PostCommunity.community_id)
    )
    return {cid: n for cid, n in rows.all()}


@router.get("/check-name")
async def check_name(
    name: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """QA2 — live duplicate-name guard for the create form: is this name free, and if
    not, what's a close free alternative to suggest? Declared before /{community_id}
    so the literal path isn't captured as a community id."""
    taken = await _name_taken(db, name)
    return {
        "available": not taken,
        "suggestion": (await _suggest_name(db, name)) if taken else None,
    }


@router.get("/{community_id}")
async def get_community(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
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
        .order_by(_ROLE_ORDER, CommunityMember.joined_at.asc())
    )
    for mem_row, user_row in mods_result:
        admins.append({
            "handle": user_row.handle,
            "name": user_row.name,
            "avatar_url": user_row.avatar_url,
            "role": mem_row.role,
        })

    # QA2 — "new posts in the last 24h" for the detail meta row (beside members/posts).
    recent = (await _recent_post_counts(db, [community_id])).get(community_id, 0)

    d = _community_dict(community, is_member, recent_post_count=recent)
    d["member_role"] = member_role
    d["join_state"] = join_state
    d["admins"] = admins
    return d


async def _name_taken(db: AsyncSession, name: str) -> bool:
    """Case-insensitive check whether a community name is already in use (QA2 — dup-name)."""
    row = (
        await db.execute(select(Community.id).where(func.lower(Community.name) == name.strip().lower()))
    ).first()
    return row is not None


async def _suggest_name(db: AsyncSession, name: str) -> Optional[str]:
    """Suggest the first free '<name> N' variant when the exact name is taken."""
    base = name.strip()
    for i in range(2, 8):
        cand = f"{base} {i}"
        if not await _name_taken(db, cand):
            return cand
    return None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_community(
    body: CreateCommunityBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = await db.execute(select(Community).where(Community.id == body.id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Community ID already taken")

    # QA2 — reject a duplicate community name (case-insensitive); suggest an alternative.
    if await _name_taken(db, body.name):
        suggestion = await _suggest_name(db, body.name)
        detail = f'A community named "{body.name.strip()}" already exists'
        if suggestion:
            detail += f' — try "{suggestion}"'
        raise HTTPException(status_code=409, detail=detail)

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

    # B-75/B-76 — race-safe join: insert decides, counter moves atomically in SQL
    inserted = await db.execute(
        pg_insert(CommunityMember)
        .values(community_id=community_id, user_id=current_user.id)
        .on_conflict_do_nothing()
    )
    if inserted.rowcount:
        await db.execute(
            update(Community).where(Community.id == community_id)
            .values(member_count=Community.member_count + 1)
        )
    return {"join_state": "member"}


@router.delete("/{community_id}/join", status_code=204)
async def leave_community(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # B-75/B-76 — race-safe leave: delete decides, counter moves atomically in SQL
    removed = await db.execute(
        delete(CommunityMember).where(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == current_user.id,
        )
    )
    if removed.rowcount:
        await db.execute(
            update(Community).where(Community.id == community_id)
            .values(member_count=func.greatest(Community.member_count - 1, 0))
        )
        return

    # Not a member — withdraw a pending join request if one exists (invite-only "Requested" → undo).
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
        await db.delete(req)


@router.get("/{community_id}/posts")
async def get_community_posts(
    community_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.post import Post, PostCommunity
    from app.routers.posts import _iso_fields
    # DF-30h — posts now reach a community via the post_communities join (a post
    # can target several). DF-27 — pending posts hidden except to their own author;
    # the gate is the per-community join status.
    stmt = (
        select(Post, PostCommunity.status)
        .join(PostCommunity, PostCommunity.post_id == Post.id)
        .where(PostCommunity.community_id == community_id)
        .where(Post.status != "removed")  # B-70 admin takedown
    )
    if current_user:
        stmt = stmt.where(
            (PostCommunity.status == "published") | (Post.user_id == current_user.id)
        )
    else:
        stmt = stmt.where(PostCommunity.status == "published")
    result = await db.execute(
        stmt.order_by(Post.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    rows = result.all()
    posts = [r[0] for r in rows]
    status_by_post = {r[0].id: r[1] for r in rows}

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
            "type": p.type,
            "title": p.title,
            "body": p.body,
            "images": p.images or [],
            **_iso_fields(p),
            "category": p.category,
            "community_id": p.community_id,
            "status": status_by_post.get(p.id, p.status),
            "review_rating": p.review_rating,
            "poll_options": p.poll_options,
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
            "role": m.role,
        }
        for m, u in rows
    ]


@router.get("/{community_id}/roster")
async def community_roster(
    community_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Public member roster powering the Community-detail Members tab. Visible to
    anyone on a public community; members/admins only on a private (invite-only) one."""
    community = (
        await db.execute(select(Community).where(Community.id == community_id))
    ).scalar_one_or_none()
    if not community or community.status != "approved":
        # founders/admins can still see their own pending community's roster
        if not (community and current_user and (current_user.id == community.founder_id or current_user.is_admin)):
            raise HTTPException(status_code=404, detail=NOT_FOUND)

    if community.is_invite_only:
        member = await _get_member(db, community_id, current_user.id) if current_user else None
        if not (current_user and (member or current_user.is_admin)):
            raise HTTPException(status_code=403, detail="This community is private")

    rows = await db.execute(
        select(CommunityMember, User)
        .join(User, CommunityMember.user_id == User.id)
        .where(CommunityMember.community_id == community_id)
        .order_by(_ROLE_ORDER, CommunityMember.joined_at.asc())
    )
    return [
        {
            "handle": u.handle,
            "name": u.name,
            "avatar_url": u.avatar_url,
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
    # vouches received per user — so request rows can show "N deals · N vouches" (v3 parity)
    vouch_sq = (
        select(Vouch.to_user_id, func.count().label("vouches"))
        .group_by(Vouch.to_user_id)
        .subquery()
    )
    rows = await db.execute(
        select(CommunityJoinRequest, User, func.coalesce(vouch_sq.c.vouches, 0).label("vouches"))
        .join(User, CommunityJoinRequest.user_id == User.id)
        .outerjoin(vouch_sq, vouch_sq.c.to_user_id == User.id)
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
            "vouches": vouches,
            "created_at": r.created_at.isoformat(),
        }
        for r, u, vouches in rows
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
    await _require_mod(db, community_id, current_user)
    req = await _resolve_request(db, community_id, handle)
    req.status = "approved"
    # B-75/B-76 — race-safe membership grant
    inserted = await db.execute(
        pg_insert(CommunityMember)
        .values(community_id=community_id, user_id=req.user_id)
        .on_conflict_do_nothing()
    )
    if inserted.rowcount:
        await db.execute(
            update(Community).where(Community.id == community_id)
            .values(member_count=Community.member_count + 1)
        )


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
    from app.models.post import Post, PostCommunity
    await _require_mod(db, community_id, current_user)
    rows = await db.execute(
        select(Post, User)
        .join(User, Post.user_id == User.id)
        .join(PostCommunity, PostCommunity.post_id == Post.id)
        .where(PostCommunity.community_id == community_id, PostCommunity.status == "pending")
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
    """Return (post, post_community_row) for a post pending in this community."""
    from app.models.post import Post, PostCommunity
    pc = (
        await db.execute(
            select(PostCommunity).where(
                PostCommunity.post_id == post_id, PostCommunity.community_id == community_id
            )
        )
    ).scalar_one_or_none()
    if not pc:
        raise HTTPException(status_code=404, detail="Post not found")
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post, pc


@router.post("/{community_id}/posts/{post_id}/approve", status_code=204)
async def approve_post(
    community_id: str,
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _require_mod(db, community_id, current_user)
    post, pc = await _resolve_pending_post(db, community_id, post_id)
    if pc.status == "pending":
        pc.status = "published"
        # Release the global hold too (only relevant for community-only posts).
        if post.status == "pending":
            post.status = "published"
        # B-75 — atomic increment
        await db.execute(
            update(Community).where(Community.id == community_id)
            .values(post_count=Community.post_count + 1)
        )


@router.post("/{community_id}/posts/{post_id}/reject", status_code=204)
async def reject_post(
    community_id: str,
    post_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.post import Post, PostCommunity
    await _require_mod(db, community_id, current_user)
    post, pc = await _resolve_pending_post(db, community_id, post_id)
    # DF-30h — rejecting only removes the post from THIS community. If that leaves
    # the post with no communities and off the feed, it's orphaned → delete it.
    await db.delete(pc)
    await db.flush()
    remaining = (
        await db.execute(select(PostCommunity).where(PostCommunity.post_id == post.id))
    ).scalars().all()
    if not remaining and not post.to_feed:
        await db.delete(post)


def _community_dict(
    c: Community,
    is_member: bool = False,
    join_state: str = "none",
    recent_post_count: int = 0,
) -> dict:
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
        "recent_post_count": recent_post_count,
        "post_mode": c.post_mode,
        "rules": c.rules or [],
        "is_invite_only": c.is_invite_only,
        "is_member": is_member,
        "join_state": join_state,
        "status": c.status,
        "created_at": c.created_at.isoformat(),
    }
