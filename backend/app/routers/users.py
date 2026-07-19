import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db
from app.dependencies import get_current_user, get_current_user_unverified
from app.models.user import User, Follow
from app.models.item import Item, ItemPhoto
from app.models.catalogue import Catalogue
from app.models.listing import Listing
from app.models.post import Post, PostLike, PostSave
from app.models.deal import Vouch, VouchRequest
from app.models.community import Community, CommunityMember
from app.routers.communities import _community_dict
from app.services.notifications import notify
from app.services.gamification import (
    award_xp, maybe_award_profile_complete, ensure_referral_code, referrals_list,
)

router = APIRouter(prefix="/users", tags=["users"])


class ProfileOut(BaseModel):
    id: uuid.UUID
    handle: str
    name: str
    bio: Optional[str]
    city: Optional[str]
    avatar_url: Optional[str]
    interests: list[str]
    sub_interests: Optional[dict] = None  # per-category chips from onboarding (DV4-06)
    rating: float
    rating_count: int
    followers_count: int
    following_count: int
    active_listings_count: int
    portfolio_value: int = 0  # paise — sum of owned-item value
    # Vouches (DF-36a) — peer endorsements, independent of deals
    vouches_received_count: int = 0
    vouches_given_count: int = 0
    # the viewer's own social endorsement of this profile, if any: {relation, note}
    my_vouch: Optional[dict] = None
    # the viewer has already asked this profile to vouch for them
    vouch_requested: bool = False
    # Presence (DF-36a) — last_active_at, nulled when the profile hides it
    # (privacy_prefs.show_online) and they aren't the viewer. Client derives the label.
    last_active_at: Optional[datetime] = None
    # follow state relative to the requesting user (false for self / anon)
    is_following: bool = False
    # private fields — only populated for /users/me
    email: Optional[str] = None
    privacy_portfolio: Optional[str] = None
    privacy_value: Optional[str] = None
    gender: Optional[str] = None
    birth_year: Optional[int] = None
    feed_prefs: Optional[dict] = None
    notif_prefs: Optional[dict] = None
    privacy_prefs: Optional[dict] = None
    email_verified: Optional[bool] = None
    # admin flag — the frontend /admin gate keys off this (data access is still
    # enforced server-side via get_current_admin)
    is_admin: Optional[bool] = None
    # Per-view collection visibility (eye toggle) — {grid,chart,calendar: public|private}.
    # Populated for ALL viewers (not nulled for non-owners) so the client can hide
    # views the owner marked private.
    collection_view_privacy: dict = {}

    model_config = {"from_attributes": True}


# Defaults for the settings prefs (DF-23) so the client always gets a full object,
# even for users created before the columns existed (seed rows have NULL).
DEFAULT_NOTIF_PREFS = {
    "followers": True, "messages": True, "listing_activity": True,
    "trade_requests": True, "event_reminders": True, "community_activity": False,
    "price_drops": True, "new_listings": False,
}
DEFAULT_PRIVACY_PREFS = {
    "messaging": "everyone",   # everyone | followers | none
    "wishlist": "followers",   # public | followers | private
    "show_online": True,
}
# Per-view collection visibility (the profile Collection "eye" toggle). The grid/
# chart/calendar views all render from the same /collection items, so this is a
# display choice the owner makes — stored under privacy_prefs.collection_views and
# returned to ALL viewers so the client hides views the owner marked private.
DEFAULT_COLLECTION_VIEWS = {"grid": "public", "chart": "public", "calendar": "public"}


def _collection_views(user: User) -> dict:
    stored = (user.privacy_prefs or {}).get("collection_views") or {}
    return {**DEFAULT_COLLECTION_VIEWS,
            **{k: v for k, v in stored.items() if k in DEFAULT_COLLECTION_VIEWS}}


def _fill_pref_defaults(out: "ProfileOut") -> "ProfileOut":
    out.notif_prefs = {**DEFAULT_NOTIF_PREFS, **(out.notif_prefs or {})}
    out.privacy_prefs = {**DEFAULT_PRIVACY_PREFS, **(out.privacy_prefs or {})}
    return out


class EditProfileBody(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None
    interests: Optional[list[str]] = None
    sub_interests: Optional[dict] = None  # per-category sub-interest chips (DV4-06)
    privacy_portfolio: Optional[str] = None
    privacy_value: Optional[str] = None
    gender: Optional[str] = None        # 'f' | 'm' | 'x' (DF-01 / DF-22)
    birth_year: Optional[int] = None    # DF-05
    feed_prefs: Optional[dict] = None   # {"categories": [...], "hide_listings": bool} (DF-08)
    notif_prefs: Optional[dict] = None  # per-type notification toggles (DF-23)
    privacy_prefs: Optional[dict] = None  # messaging / wishlist visibility / show-online (DF-23)


class SuggestedUserOut(BaseModel):
    id: uuid.UUID
    handle: str
    name: str
    followers_count: int

    model_config = {"from_attributes": True}


class FollowUserOut(BaseModel):
    handle: str
    name: str
    avatar_url: Optional[str]

    model_config = {"from_attributes": True}


@router.get("/me", response_model=ProfileOut)
async def get_me(current_user: User = Depends(get_current_user_unverified)):
    out = _fill_pref_defaults(ProfileOut.model_validate(current_user))
    out.collection_view_privacy = _collection_views(current_user)
    return out


@router.get("/me/referrals")
async def get_my_referrals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """DV6-05 referral dashboard: the viewer's share code, headline stats, and the
    per-invitee list with pending/joined status and XP earned."""
    code = await ensure_referral_code(db, current_user)
    rows = await referrals_list(db, current_user)
    joined = [r for r in rows if r["status"] == "joined"]
    return {
        "code": code,
        "invited": len(rows),
        "joined": len(joined),
        "xp_earned": sum(r["xp"] for r in rows),
        "reward_xp": 150,
        "referrals": rows,
    }


@router.get("/me/suggested", response_model=list[SuggestedUserOut])
async def get_suggested(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 8,
):
    """Return users with shared interests that the current user doesn't already follow."""
    following_ids_q = await db.execute(
        select(Follow.following_id).where(
            Follow.follower_id == current_user.id,
            Follow.following_type == "user",
        )
    )
    following_ids = {row[0] for row in following_ids_q.all()}
    following_ids.add(current_user.id)

    stmt = (
        select(User)
        .where(User.id.not_in(following_ids))
        .where(User.is_suspended == False)  # noqa: E712
        .order_by(User.followers_count.desc())
        .limit(limit)
    )
    if current_user.interests:
        stmt = stmt.where(User.interests.overlap(current_user.interests))

    result = await db.execute(stmt)
    rows = result.scalars().all()
    if not rows:
        # Fallback: no interest overlap — return anyone not followed
        result2 = await db.execute(
            select(User)
            .where(User.id.not_in(following_ids), User.is_suspended == False)  # noqa: E712
            .order_by(User.followers_count.desc())
            .limit(limit)
        )
        rows = result2.scalars().all()
    return rows


@router.get("/me/vouch-candidates", response_model=list[FollowUserOut])
async def vouch_candidates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 40,
):
    """Collectors the user can ask for a vouch (Request-a-vouch flow, v4 = "ask anyone
    who knows you"). Prioritises people you follow / who follow you, then other active
    collectors. Excludes self and suspended accounts."""
    follow_ids_q = await db.execute(
        select(Follow.following_id).where(
            Follow.follower_id == current_user.id, Follow.following_type == "user"
        )
    )
    followed = {r for r in follow_ids_q.scalars().all()}
    follower_ids_q = await db.execute(
        select(Follow.follower_id).where(
            Follow.following_id == current_user.id, Follow.following_type == "user"
        )
    )
    followers = {r for r in follower_ids_q.scalars().all()}
    connected = followed | followers

    result = await db.execute(
        select(User)
        .where(User.id != current_user.id, User.is_suspended == False)  # noqa: E712
        .order_by(User.followers_count.desc())
        .limit(limit)
    )
    users = list(result.scalars().all())
    # Connections first (people who actually know you), then the rest — stable.
    users.sort(key=lambda u: 0 if u.id in connected else 1)
    return users


@router.get("/me/saved")
async def get_saved_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Posts the current user has bookmarked, newest-saved first (paginated)."""
    from app.routers.feed import _post_dict

    saves_q = await db.execute(
        select(PostSave.post_id)
        .where(PostSave.user_id == current_user.id)
        .order_by(PostSave.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    saved_post_ids = list(saves_q.scalars().all())
    if not saved_post_ids:
        return {"page": page, "limit": limit, "items": []}

    posts_result = await db.execute(select(Post).where(Post.id.in_(saved_post_ids)))
    posts_by_id = {p.id: p for p in posts_result.scalars().all()}
    # Preserve save-order (newest saved first)
    ordered = [posts_by_id[pid] for pid in saved_post_ids if pid in posts_by_id]

    author_ids = list({p.user_id for p in ordered})
    users_result = await db.execute(select(User).where(User.id.in_(author_ids)))
    users_by_id = {u.id: u for u in users_result.scalars().all()}

    liked_q = await db.execute(
        select(PostLike.post_id).where(
            PostLike.user_id == current_user.id,
            PostLike.post_id.in_(saved_post_ids),
        )
    )
    liked_ids = set(liked_q.scalars().all())

    follows_q = await db.execute(
        select(Follow.following_id).where(
            Follow.follower_id == current_user.id,
            Follow.following_type == "user",
        )
    )
    followed_ids = {str(r) for r in follows_q.scalars().all()}

    return {
        "page": page,
        "limit": limit,
        "items": [
            _post_dict(
                p,
                users_by_id.get(p.user_id),
                p.id in liked_ids,
                True,  # every post here is saved by definition
                str(p.user_id) in followed_ids,
            )
            for p in ordered
        ],
    }


@router.patch("/me", response_model=ProfileOut)
async def edit_me(
    body: EditProfileBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    db.add(current_user)
    await db.flush()
    # XP: +50 one-time once all 5 profile steps are filled (GM-05, dedup'd).
    await maybe_award_profile_complete(db, current_user)
    out = _fill_pref_defaults(ProfileOut.model_validate(current_user))
    out.collection_view_privacy = _collection_views(current_user)
    return out


class CollectionViewPrivacyBody(BaseModel):
    view: str         # grid | chart | calendar
    visibility: str   # public | private


@router.patch("/me/collection-privacy", response_model=ProfileOut)
async def set_collection_view_privacy(
    body: CollectionViewPrivacyBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle one Collection view (grid/chart/calendar) public/private (the eye icon)."""
    if body.view not in DEFAULT_COLLECTION_VIEWS:
        raise HTTPException(status_code=400, detail="invalid view")
    if body.visibility not in ("public", "private"):
        raise HTTPException(status_code=400, detail="invalid visibility")
    # JSONB must be reassigned (not mutated in place) for SQLAlchemy to flag it dirty.
    prefs = dict(current_user.privacy_prefs or {})
    views = dict(prefs.get("collection_views") or {})
    views[body.view] = body.visibility
    prefs["collection_views"] = views
    current_user.privacy_prefs = prefs
    db.add(current_user)
    await db.flush()
    out = _fill_pref_defaults(ProfileOut.model_validate(current_user))
    out.collection_view_privacy = _collection_views(current_user)
    return out


@router.get("/{handle}", response_model=ProfileOut)
async def get_profile(
    handle: str,
    db: AsyncSession = Depends(get_db),
    viewer: User = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.handle == handle.lower()))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    out = ProfileOut.model_validate(user)
    is_self = bool(viewer and viewer.id == user.id)
    # Per-view collection visibility is returned to everyone (it only tells the
    # client which views to render; the underlying items are already item-level
    # privacy-filtered in /collection).
    out.collection_view_privacy = _collection_views(user)

    # Vouch counts (social endorsements + trade vouches both count toward trust).
    out.vouches_received_count = await db.scalar(
        select(func.count()).select_from(Vouch).where(Vouch.to_user_id == user.id)
    ) or 0
    out.vouches_given_count = await db.scalar(
        select(func.count()).select_from(Vouch).where(Vouch.from_user_id == user.id)
    ) or 0

    if is_self:
        _fill_pref_defaults(out)
    else:
        # private fields are only for the owner (see /users/me)
        out.email = None
        out.privacy_portfolio = None
        out.privacy_value = None
        out.gender = None
        out.birth_year = None
        out.feed_prefs = None
        out.notif_prefs = None
        out.privacy_prefs = None
        out.email_verified = None
        out.is_admin = None
        # Presence is opt-out via privacy_prefs.show_online (default on).
        show_online = (user.privacy_prefs or {}).get("show_online", DEFAULT_PRIVACY_PREFS["show_online"])
        if not show_online:
            out.last_active_at = None
        if viewer:
            follow = await db.execute(
                select(Follow).where(
                    Follow.follower_id == viewer.id,
                    Follow.following_type == "user",
                    Follow.following_id == user.id,
                )
            )
            out.is_following = follow.scalar_one_or_none() is not None
            # the viewer's own endorsement of this profile (powers "Vouched · Edit")
            mine = await db.execute(
                select(Vouch).where(
                    Vouch.from_user_id == viewer.id,
                    Vouch.to_user_id == user.id,
                    Vouch.kind == "social_endorsement",
                )
            )
            mv = mine.scalar_one_or_none()
            if mv:
                out.my_vouch = {"relation": mv.relation, "note": mv.body}
            req = await db.execute(
                select(VouchRequest).where(
                    VouchRequest.requester_id == viewer.id,
                    VouchRequest.target_id == user.id,
                    VouchRequest.status == "pending",
                )
            )
            out.vouch_requested = req.scalar_one_or_none() is not None
    return out


@router.post("/{handle}/follow", status_code=204)
async def follow_user(
    handle: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")

    existing = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.following_type == "user",
            Follow.following_id == target_user.id,
        )
    )
    if existing.scalar_one_or_none():
        return  # already following

    db.add(Follow(follower_id=current_user.id, following_type="user", following_id=target_user.id))
    target_user.followers_count += 1
    current_user.following_count += 1
    # DV6-04 — +2 XP micro-reward, deduped per followed collector.
    await award_xp(db, current_user, "follow", ref_id=str(target_user.id), ref_type="user")
    await notify(
        db,
        user_id=target_user.id,
        actor_id=current_user.id,
        kind="follow",
        title="New follower",
        body="started following you.",
        ref_type="profile",
        ref_id=current_user.handle,
    )


@router.get("/{handle}/followers", response_model=list[FollowUserOut])
async def list_followers(
    handle: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 40,
    offset: int = 0,
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(User)
        .join(Follow, (Follow.follower_id == User.id) & (Follow.following_type == "user") & (Follow.following_id == target_user.id))
        .order_by(Follow.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/{handle}/following", response_model=list[FollowUserOut])
async def list_following(
    handle: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 40,
    offset: int = 0,
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(User)
        .join(Follow, (Follow.following_id == User.id) & (Follow.following_type == "user") & (Follow.follower_id == target_user.id))
        .order_by(Follow.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


# ── Vouches (DF-36a): peer endorsements, independent of any deal ─────────────
VOUCH_RELATIONS = {"app", "offapp", "person", "community", "friend", "request"}


class VouchBody(BaseModel):
    relation: str            # app | offapp | person | community | friend
    note: Optional[str] = None


class VouchOut(BaseModel):
    handle: str
    name: str
    avatar_url: Optional[str]
    relation: Optional[str]
    note: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


async def _resolve_user(db: AsyncSession, handle: str) -> User:
    result = await db.execute(select(User).where(User.handle == handle.lower()))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/{handle}/vouch", status_code=204)
async def give_vouch(
    handle: str,
    body: VouchBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Give (or update) a social endorsement for @handle — no deal required."""
    if body.relation not in VOUCH_RELATIONS:
        raise HTTPException(status_code=400, detail="Invalid relation")
    target = await _resolve_user(db, handle)
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot vouch for yourself")

    existing = await db.execute(
        select(Vouch).where(
            Vouch.from_user_id == current_user.id,
            Vouch.to_user_id == target.id,
            Vouch.kind == "social_endorsement",
        )
    )
    vouch = existing.scalar_one_or_none()
    is_new = vouch is None
    if vouch:
        vouch.relation = body.relation
        vouch.body = body.note
    else:
        db.add(Vouch(
            from_user_id=current_user.id,
            to_user_id=target.id,
            kind="social_endorsement",
            relation=body.relation,
            body=body.note,
        ))
        # Fulfil any pending request the target sent the current user.
        pending = await db.execute(
            select(VouchRequest).where(
                VouchRequest.requester_id == target.id,
                VouchRequest.target_id == current_user.id,
                VouchRequest.status == "pending",
            )
        )
        pr = pending.scalar_one_or_none()
        if pr:
            pr.status = "fulfilled"

    if is_new:
        # XP: +10 for vouching for a collector, dedup'd on the vouched user (GM-05).
        await award_xp(db, current_user, "vouch", ref_id=str(target.id), ref_type="user")
        await notify(
            db,
            user_id=target.id,
            actor_id=current_user.id,
            kind="vouch",
            title="New vouch",
            body="vouched for you.",
            ref_type="profile",
            ref_id=current_user.handle,
        )


@router.delete("/{handle}/vouch", status_code=204)
async def remove_vouch(
    handle: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = await _resolve_user(db, handle)
    existing = await db.execute(
        select(Vouch).where(
            Vouch.from_user_id == current_user.id,
            Vouch.to_user_id == target.id,
            Vouch.kind == "social_endorsement",
        )
    )
    vouch = existing.scalar_one_or_none()
    if vouch:
        await db.delete(vouch)


@router.get("/{handle}/vouches", response_model=list[VouchOut])
async def list_vouches(
    handle: str,
    current_user: User = Depends(get_current_user),
    mode: str = Query("received", pattern="^(received|given)$"),
    db: AsyncSession = Depends(get_db),
    limit: int = 40,
    offset: int = 0,
):
    """Vouches received by / given by @handle (the other party + relation + note)."""
    subject = await _resolve_user(db, handle)
    if mode == "received":
        join_cond = Vouch.from_user_id == User.id
        scope = Vouch.to_user_id == subject.id
    else:
        join_cond = Vouch.to_user_id == User.id
        scope = Vouch.from_user_id == subject.id

    result = await db.execute(
        select(User, Vouch)
        .join(Vouch, join_cond)
        .where(scope)
        .order_by(Vouch.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()
    return [
        VouchOut(
            handle=u.handle, name=u.name, avatar_url=u.avatar_url,
            relation=v.relation, note=v.body, created_at=v.created_at,
        )
        for u, v in rows
    ]


@router.post("/{handle}/vouch-request", status_code=204)
async def request_vouch(
    handle: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ask @handle to vouch for the current user (idempotent)."""
    target = await _resolve_user(db, handle)
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot request a vouch from yourself")

    existing = await db.execute(
        select(VouchRequest).where(
            VouchRequest.requester_id == current_user.id,
            VouchRequest.target_id == target.id,
        )
    )
    vr = existing.scalar_one_or_none()
    if vr:
        if vr.status != "pending":
            vr.status = "pending"  # re-ask
        return
    db.add(VouchRequest(requester_id=current_user.id, target_id=target.id, status="pending"))
    await notify(
        db,
        user_id=target.id,
        actor_id=current_user.id,
        kind="vouch",
        title="Vouch request",
        body="asked you to vouch for them.",
        ref_type="profile",
        ref_id=current_user.handle,
    )


@router.get("/{handle}/posts")
async def get_user_posts(
    handle: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = (
        select(Post)
        .where(Post.user_id == target_user.id)
        .order_by(Post.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(stmt)
    posts = result.scalars().all()
    return {
        "page": page,
        "items": [
            {
                "id": str(p.id),
                "type": p.type,
                "body": p.body,
                "images": p.images,
                "category": p.category,
                "likes_count": p.likes_count,
                "comments_count": p.comments_count,
                "saves_count": p.saves_count,
                "created_at": p.created_at.isoformat(),
            }
            for p in posts
        ],
    }


async def _wishlist_hidden(db: AsyncSession, viewer: Optional[User], target_user: User) -> bool:
    """Whether `viewer` is barred from seeing target's wishlist (DF-23 privacy)."""
    if viewer and viewer.id == target_user.id:
        return False  # owner always sees their own
    wmode = (target_user.privacy_prefs or {}).get("wishlist", "followers")
    if wmode == "public":
        return False
    if wmode == "private":
        return True
    # "followers": visible only to people who follow the target
    if not viewer:
        return True
    follows = await db.scalar(
        select(Follow.follower_id).where(
            Follow.following_type == "user",
            Follow.follower_id == viewer.id,
            Follow.following_id == target_user.id,
        ).limit(1)
    )
    return not follows


@router.get("/{handle}/collection")
async def get_collection(
    handle: str,
    db: AsyncSession = Depends(get_db),
    viewer: User = Depends(get_current_user),
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(24, le=60),
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Wishlist visibility (DF-23): public | followers | private. Owned/pre-order
    # items are unaffected — only the wishlist is gated for non-owners.
    hide_wishlist = await _wishlist_hidden(db, viewer, target_user)

    stmt = select(Item).where(Item.user_id == target_user.id, Item.privacy == "public")
    if status:
        stmt = stmt.where(Item.status == status)
    if hide_wishlist:
        stmt = stmt.where(Item.status != "wishlist")
    stmt = stmt.order_by(Item.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    items = result.scalars().all()

    # When a logged-in viewer looks at someone else's collection, flag which items
    # they've already wishlisted (powers the ProfileCollection bookmark button, DF-24).
    wl_skus: set[str] = set()
    wl_titles: set[str] = set()
    if viewer and viewer.id != target_user.id:
        wl = await db.execute(
            select(Item.sku, Item.custom_title).where(
                Item.user_id == viewer.id, Item.status == "wishlist"
            )
        )
        for sku, title in wl.all():
            if sku:
                wl_skus.add(sku)
            if title:
                wl_titles.add(title.strip().lower())

    def _wishlisted(i: Item) -> bool:
        if i.sku and i.sku in wl_skus:
            return True
        if i.custom_title and i.custom_title.strip().lower() in wl_titles:
            return True
        return False

    # Cover photo per item (first non-verify upload), fetched in one query for the page.
    # DV6-13 — a non-owner only sees PUBLIC photos; items with no visible photo fall back
    # to the shared catalogue reference image so grids never show a blank tile.
    is_owner_view = bool(viewer and viewer.id == target_user.id)
    covers: dict = {}
    item_ids = [i.id for i in items]
    if item_ids:
        cover_q = select(ItemPhoto.item_id, ItemPhoto.url).where(ItemPhoto.item_id.in_(item_ids))
        if not is_owner_view:
            cover_q = cover_q.where(ItemPhoto.is_public == True)
        cover_q = cover_q.order_by(ItemPhoto.item_id, ItemPhoto.uploaded_at.asc())
        for iid, url in (await db.execute(cover_q)).all():
            covers.setdefault(iid, url)  # first row per item = cover
        # Catalogue-reference fallback for items with no (visible) cover.
        missing_skus = {i.sku for i in items if i.sku and i.id not in covers}
        if missing_skus:
            cat_rows = await db.execute(
                select(Catalogue.sku, Catalogue.thumbnail_url).where(Catalogue.sku.in_(missing_skus))
            )
            cat_thumb = {sku: url for sku, url in cat_rows.all() if url}
            for i in items:
                if i.id not in covers and i.sku and cat_thumb.get(i.sku):
                    covers[i.id] = cat_thumb[i.sku]

    return {
        "page": page,
        "items": [
            {
                "id": str(i.id),
                "sku": i.sku,
                "custom_title": i.custom_title,
                "status": i.status,
                "value": i.value,
                "is_listed": i.is_listed,
                "photo_count": i.photo_count,
                "image_url": covers.get(i.id),
                "preorder_eta": i.preorder_eta,
                "is_wishlisted": _wishlisted(i),
                "created_at": i.created_at.isoformat(),
            }
            for i in items
        ],
    }


@router.get("/{handle}/listings")
async def get_user_listings(
    handle: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(24, le=60),
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = (
        select(Listing)
        .where(Listing.seller_id == target_user.id, Listing.status == "available")
        .order_by(Listing.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(stmt)
    listings = result.scalars().all()
    return {
        "page": page,
        "items": [
            {
                "id": str(l.id),
                "sku": l.sku,
                "price": l.price,
                "condition": l.condition,
                "trade_willing": l.trade_willing,
                "ships_from_city": l.ships_from_city,
                "saves_count": l.saves_count,
                "created_at": l.created_at.isoformat(),
            }
            for l in listings
        ],
    }


@router.get("/{handle}/communities")
async def get_user_communities(
    handle: str,
    db: AsyncSession = Depends(get_db),
    viewer: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(24, le=60),
):
    """Communities the user has joined — feeds the profile Communities tab."""
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    stmt = (
        select(Community)
        .join(CommunityMember, CommunityMember.community_id == Community.id)
        .where(CommunityMember.user_id == target_user.id)
        .order_by(CommunityMember.joined_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    result = await db.execute(stmt)
    communities = result.scalars().all()

    # which of these does the viewer also belong to (drives the Join/Joined chip)
    viewer_member_ids: set[str] = set()
    if viewer:
        vm = await db.execute(
            select(CommunityMember.community_id).where(CommunityMember.user_id == viewer.id)
        )
        viewer_member_ids = set(vm.scalars().all())

    return {
        "page": page,
        "items": [_community_dict(c, c.id in viewer_member_ids) for c in communities],
    }




@router.delete("/{handle}/follow", status_code=204)
async def unfollow_user(
    handle: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target = await db.execute(select(User).where(User.handle == handle.lower()))
    target_user = target.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.following_type == "user",
            Follow.following_id == target_user.id,
        )
    )
    follow = result.scalar_one_or_none()
    if follow:
        await db.delete(follow)
        target_user.followers_count = max(0, target_user.followers_count - 1)
        current_user.following_count = max(0, current_user.following_count - 1)
