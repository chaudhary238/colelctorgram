import uuid
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, or_

from app.database import get_db
from app.dependencies import get_current_admin
from app.models.user import User
from app.models.post import Post, Comment
from app.models.listing import Listing
from app.models.catalogue import Catalogue
from app.models.trust import Report
from app.models.event import Event
from app.models.community import Community
from app.models.item import Item
from app.models.deal import Vouch
from app.services.catalogue import norm_title, norm_scale
from app.services.gamification import FIRST_START

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Dashboard KPIs (W-47). Cheap aggregate counts — no analytics pipeline needed."""
    day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    new_users_week = (await db.execute(
        select(func.count(User.id)).where(User.created_at >= week_ago)
    )).scalar() or 0
    posts_today = (await db.execute(
        select(func.count(Post.id)).where(Post.created_at >= day_ago)
    )).scalar() or 0
    active_listings = (await db.execute(
        select(func.count(Listing.id)).where(Listing.status == "available")
    )).scalar() or 0
    pending_reports = (await db.execute(
        select(func.count(Report.id)).where(Report.status == "pending")
    )).scalar() or 0
    pending_communities = (await db.execute(
        select(func.count(Community.id)).where(Community.status == "pending")
    )).scalar() or 0
    pending_events = (await db.execute(
        select(func.count(Event.id)).where(Event.status == "pending_approval")
    )).scalar() or 0

    return {
        # legacy keys kept for any existing caller
        "total_users": total_users,
        "total_posts": (await db.execute(select(func.count(Post.id)))).scalar() or 0,
        "pending_reports": pending_reports,
        # dashboard KPIs
        "new_users_week": new_users_week,
        "posts_today": posts_today,
        "active_listings": active_listings,
        "pending_communities": pending_communities,
        "pending_events": pending_events,
    }


async def _resolve_report_targets(db: AsyncSession, reports: list[Report]) -> dict:
    """Resolve each report's target into a moderator-facing label + the author's
    user id (so the queue can suspend the author + take the content down) + whether
    the content still exists. Batched per target type. W-47.

    Returns {report_id: {label, author_id, exists}}.
    """
    by_type: dict[str, set] = {"post": set(), "listing": set(), "comment": set(), "user": set()}
    for r in reports:
        if r.target_id and r.target_type in by_type:
            by_type[r.target_type].add(r.target_id)

    posts: dict = {}
    if by_type["post"]:
        rows = (await db.execute(select(Post).where(Post.id.in_(by_type["post"])))).scalars().all()
        posts = {p.id: p for p in rows}
    listings: dict = {}
    if by_type["listing"]:
        rows = (await db.execute(select(Listing).where(Listing.id.in_(by_type["listing"])))).scalars().all()
        listings = {lst.id: lst for lst in rows}
    comments: dict = {}
    if by_type["comment"]:
        rows = (await db.execute(select(Comment).where(Comment.id.in_(by_type["comment"])))).scalars().all()
        comments = {c.id: c for c in rows}

    # Collect every user id we need a handle for (reporters, target users, content authors)
    user_ids: set = {r.reporter_id for r in reports}
    user_ids |= by_type["user"]
    user_ids |= {p.user_id for p in posts.values()}
    user_ids |= {lst.seller_id for lst in listings.values()}
    user_ids |= {c.user_id for c in comments.values()}
    users: dict = {}
    if user_ids:
        rows = (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars().all()
        users = {u.id: u for u in rows}

    def _handle(uid) -> str:
        u = users.get(uid)
        return f"@{u.handle}" if u else "unknown"

    out: dict = {}
    for r in reports:
        label, author_id, exists = r.target_ref or "—", None, True
        if r.target_type == "post":
            p = posts.get(r.target_id)
            if p:
                author_id = p.user_id
                exists = p.status != "removed"
                label = f"Post by {_handle(p.user_id)}: {(p.title or p.body or '')[:60] or '(no text)'}"
            else:
                label, exists = "Post (deleted)", False
        elif r.target_type == "listing":
            lst = listings.get(r.target_id)
            if lst:
                author_id = lst.seller_id
                exists = lst.status != "removed"
                label = f"Listing by {_handle(lst.seller_id)} · {lst.sku or 'item'}"
            else:
                label, exists = "Listing (deleted)", False
        elif r.target_type == "comment":
            c = comments.get(r.target_id)
            if c:
                author_id = c.user_id
                exists = not c.is_removed
                label = f"Comment by {_handle(c.user_id)}: {c.body[:60]}"
            else:
                label, exists = "Comment (deleted)", False
        elif r.target_type == "user":
            author_id = r.target_id
            u = users.get(r.target_id)
            exists = bool(u) and not u.is_suspended
            label = f"User {_handle(r.target_id)}"
        out[r.id] = {"label": label, "author_id": str(author_id) if author_id else None, "exists": exists}
    return out


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
    resolved = await _resolve_report_targets(db, list(reports))
    reporters = {
        u.id: u.handle
        for u in (await db.execute(
            select(User).where(User.id.in_([r.reporter_id for r in reports]))
        )).scalars().all()
    } if reports else {}
    return [
        {
            "id": str(r.id),
            "reporter_id": str(r.reporter_id),
            "reporter_handle": reporters.get(r.reporter_id),
            "target_type": r.target_type,
            "target_id": str(r.target_id) if r.target_id else None,
            "target_ref": r.target_ref,  # DV6-13 — string-keyed targets (e.g. catalogue SKU)
            "target_label": resolved.get(r.id, {}).get("label"),
            "target_author_id": resolved.get(r.id, {}).get("author_id"),
            "target_exists": resolved.get(r.id, {}).get("exists", True),
            "reason": r.reason,
            "notes": r.notes,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]


@router.patch("/reports/{report_id}/resolve", status_code=204)
async def resolve_report(
    report_id: str,
    action: str = Query("dismissed", pattern="^(dismissed|actioned)$"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Close a report from the queue (DV6-13). 'dismissed' = no issue; 'actioned' = handled."""
    r = (await db.execute(select(Report).where(Report.id == report_id))).scalar_one_or_none()
    if r:
        r.status = action
        r.reviewed_by = admin.id


# ── B-70: user suspension + content takedown (report lifecycle actions) ──────

@router.get("/users")
async def list_users(
    q: str | None = Query(None, description="search handle / name / email"),
    suspended: bool | None = Query(None, description="filter by suspension state"),
    page: int = Query(1, ge=1),
    limit: int = Query(30, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Search/list users for the admin user-management console (W-47). Powers
    suspend/unsuspend of ANY account, not just reported ones — closes the gap where
    a wrongly-suspended user could only be restored via a raw API call."""
    vouch_sq = (
        select(Vouch.to_user_id, func.count().label("vouches"))
        .group_by(Vouch.to_user_id).subquery()
    )
    stmt = (
        select(User, func.coalesce(vouch_sq.c.vouches, 0))
        .outerjoin(vouch_sq, vouch_sq.c.to_user_id == User.id)
    )
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(or_(
            User.handle.ilike(pattern), User.name.ilike(pattern), User.email.ilike(pattern),
        ))
    if suspended is not None:
        stmt = stmt.where(User.is_suspended == suspended)
    stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    rows = (await db.execute(stmt)).all()
    return [
        {
            "id": str(u.id),
            "handle": u.handle,
            "name": u.name,
            "email": u.email,
            "avatar_url": u.avatar_url,
            "is_suspended": u.is_suspended,
            "is_admin": u.is_admin,
            "is_seed_account": u.is_seed_account,
            # First Start badge code (founding / early_believer / pioneer) or None.
            "first_start_badge": u.first_start_badge,
            "followers_count": u.followers_count,
            "active_listings_count": u.active_listings_count,
            "vouches": v,
            "created_at": u.created_at.isoformat(),
        }
        for u, v in rows
    ]


class FirstStartBody(BaseModel):
    """`code` = a FIRST_START key, or null to revoke."""
    code: str | None = None


@router.put("/users/{user_id}/first-start-badge", status_code=204)
async def set_first_start_badge(
    user_id: uuid.UUID,
    body: FirstStartBody,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Grant or revoke a First Start badge (Rewards v5 §6.1 — permanent, manually
    team-assigned). Built for UAT: the team hands **Founding Member** to the
    testers who take part, by handle, from the user console.

    Staff can't hold one — admins sit outside the rewards system entirely
    (QA 2026-08-04 §4), so awarding them a badge would contradict the byline they
    already get ("Scorred · Official")."""
    code = (body.code or "").strip() or None
    if code is not None and code not in FIRST_START:
        raise HTTPException(status_code=400, detail=f"Unknown badge '{code}'")

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_admin and code is not None:
        raise HTTPException(status_code=400, detail="Admin accounts are outside the rewards system")

    user.first_start_badge = code


@router.post("/users/{user_id}/suspend", status_code=204)
async def suspend_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Suspend an account — every authenticated request 401s while is_suspended
    (dependencies.get_current_user_unverified). Reversible via /unsuspend."""
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Cannot suspend an admin account")
    user.is_suspended = True


@router.post("/users/{user_id}/unsuspend", status_code=204)
async def unsuspend_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_suspended = False


@router.delete("/posts/{post_id}", status_code=204)
async def admin_remove_post(
    post_id: uuid.UUID,
    reason: str = Query(..., min_length=3, max_length=500),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Soft-remove a post (status="removed") — drops out of feed/detail; content kept for audit."""
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.status = "removed"
    post.removed_reason = reason


@router.delete("/listings/{listing_id}", status_code=204)
async def admin_remove_listing(
    listing_id: uuid.UUID,
    reason: str = Query(..., min_length=3, max_length=500),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Soft-remove a listing (status="removed") — hidden from market; content kept for audit."""
    listing = (await db.execute(select(Listing).where(Listing.id == listing_id))).scalar_one_or_none()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != "removed":
        # keep the seller's active-listings counter honest (only available listings count)
        if listing.status == "available":
            await db.execute(
                update(User).where(User.id == listing.seller_id)
                .values(active_listings_count=func.greatest(User.active_listings_count - 1, 0))
            )
        listing.status = "removed"
    listing.removed_reason = reason


@router.delete("/comments/{comment_id}", status_code=204)
async def admin_remove_comment(
    comment_id: uuid.UUID,
    reason: str = Query(..., min_length=3, max_length=500),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Soft-remove a comment (is_removed) — hidden from the thread; body kept for audit."""
    comment = (await db.execute(select(Comment).where(Comment.id == comment_id))).scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if not comment.is_removed:
        comment.is_removed = True
        # atomic decrement — mirrors the reconcile worker's is_removed=false count
        await db.execute(
            update(Post).where(Post.id == comment.post_id)
            .values(comments_count=func.greatest(Post.comments_count - 1, 0))
        )
    comment.removed_reason = reason


@router.get("/catalogue")
async def list_catalogue(
    q: str | None = Query(None, description="search title / brand / sku"),
    category: str | None = Query(None, description="filter by category"),
    status: str = Query("all", pattern="^(all|live|removed)$"),
    approval: str = Query("all", pattern="^(all|approved|pending)$"),
    verified: bool | None = Query(None, description="filter by Scorred Verified"),
    page: int = Query(1, ge=1),
    limit: int = Query(30, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Full catalogue console (all entries, not just pending) with search + category
    filter — powers the admin "manage catalogue" view for verify/edit/remove. Unlike
    the public /catalogue/search this returns removed + pending entries too, and the
    admin-only fields (status, approval, submitter)."""
    stmt = select(Catalogue)
    if q and q.strip():
        pattern = f"%{q.strip().lower()}%"
        stmt = stmt.where(or_(
            func.lower(Catalogue.title).like(pattern),
            func.lower(Catalogue.brand).like(pattern),
            func.lower(Catalogue.sku).like(pattern),
        ))
    if category:
        stmt = stmt.where(Catalogue.category == category)
    if status != "all":
        stmt = stmt.where(Catalogue.status == status)
    if approval == "approved":
        stmt = stmt.where(Catalogue.is_verified == True)  # noqa: E712
    elif approval == "pending":
        stmt = stmt.where(Catalogue.is_verified == False)  # noqa: E712
    if verified is not None:
        stmt = stmt.where(Catalogue.is_verified == verified)

    total = (await db.execute(
        select(func.count()).select_from(stmt.subquery())
    )).scalar() or 0

    stmt = stmt.order_by(Catalogue.created_at.desc()).offset((page - 1) * limit).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()

    # Resolve submitter handles in one batch.
    submitter_ids = {c.submitted_by for c in rows if c.submitted_by}
    handles: dict = {}
    if submitter_ids:
        handles = {
            u.id: u.handle
            for u in (await db.execute(
                select(User).where(User.id.in_(submitter_ids))
            )).scalars().all()
        }

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": [
            {
                "sku": c.sku,
                "title": c.title,
                "brand": c.brand,
                "category": c.category,
                "scale": c.scale,
                "year": c.year,
                "description": c.description,
                "est_retail_price": c.est_retail_price,
                "thumbnail_url": c.thumbnail_url,
                "is_verified": c.is_verified,
                "status": c.status,
                "submitted_by_handle": handles.get(c.submitted_by),
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in rows
        ],
    }


class EditCatalogueBody(BaseModel):
    title: str | None = None
    brand: str | None = None
    category: str | None = None
    scale: str | None = None
    year: str | None = None
    description: str | None = None
    est_retail_price: int | None = None
    thumbnail_url: str | None = None


@router.patch("/catalogue/{sku}", status_code=204)
async def edit_catalogue(
    sku: str,
    body: EditCatalogueBody,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Edit a catalogue entry's shared facts (admin correction). Only provided fields
    are updated; norm_title is kept in sync with title so de-dup search stays accurate."""
    item = (await db.execute(select(Catalogue).where(Catalogue.sku == sku))).scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Entry not found")
    data = body.model_dump(exclude_unset=True)
    if "title" in data:
        title = (data["title"] or "").strip()
        if not title:
            raise HTTPException(status_code=422, detail="Title cannot be empty")
        item.title = title
        item.norm_title = norm_title(title)
    if "brand" in data:
        brand = (data["brand"] or "").strip()
        if not brand:
            raise HTTPException(status_code=422, detail="Brand cannot be empty")
        item.brand = brand
    if "category" in data and data["category"]:
        item.category = data["category"]
    if "scale" in data:
        # Slash form only — a hand-typed "1:300" would not group with its "1/300"
        # siblings in the Database's scale filter (Change Spec §5).
        item.scale = norm_scale(data["scale"])
    if "year" in data:
        item.year = (data["year"] or None) or None
    if "description" in data:
        item.description = (data["description"] or "").strip() or None
    if "est_retail_price" in data and data["est_retail_price"] is not None:
        item.est_retail_price = max(0, int(data["est_retail_price"]))
    if "thumbnail_url" in data:
        item.thumbnail_url = (data["thumbnail_url"] or "").strip() or None


@router.patch("/catalogue/{sku}/restore", status_code=204)
async def restore_catalogue(
    sku: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Reverse a takedown (DV6-13) — bring a removed catalogue entry back to 'live'."""
    item = (await db.execute(select(Catalogue).where(Catalogue.sku == sku))).scalar_one_or_none()
    if item:
        item.status = "live"


@router.patch("/catalogue/{sku}/remove", status_code=204)
async def remove_catalogue(
    sku: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Reactively take a catalogue entry down (DV6-13) — hidden from search/resolve; its
    linked items fall back to their own photos. Reversible via /restore."""
    item = (await db.execute(select(Catalogue).where(Catalogue.sku == sku))).scalar_one_or_none()
    if item:
        item.status = "removed"


@router.patch("/catalogue/{sku}/verify", status_code=204)
async def verify_catalogue_entry(
    sku: str,
    verified: bool = Query(True),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Mark a catalogue entry **Scorred Verified**, or send it back to pending.

    This is the ONLY way `is_verified` is ever set — creating an entry never
    self-verifies it, even for an admin (migration d4f2a7c9e610)."""
    item = (await db.execute(select(Catalogue).where(Catalogue.sku == sku))).scalar_one_or_none()
    if item:
        item.is_verified = verified
        if verified and item.status == "removed":
            item.status = "live"


# NOTE: the old `/catalogue/{sku}/approve` was deleted — with is_approved folded into
# is_verified it did exactly what `/catalogue/{sku}/verify` does (QA 2026-08-05).
@router.get("/catalogue/pending")
async def pending_catalogue(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Catalogue).where(Catalogue.is_verified == False))
    items = result.scalars().all()
    return [{"sku": i.sku, "title": i.title, "brand": i.brand, "category": i.category} for i in items]


@router.get("/catalogue/{sku}")
async def get_catalogue_admin(
    sku: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Full admin detail for one catalogue entry — includes removed/pending entries
    (unlike the public GET /catalogue/{sku}) plus admin-only fields and how many
    collectors actually own it. Backs the admin catalogue detail/edit page.

    Registered AFTER /catalogue/pending so that literal path keeps winning the match.
    """
    entry = (await db.execute(select(Catalogue).where(Catalogue.sku == sku))).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    collectors = (await db.execute(
        select(func.count(func.distinct(Item.user_id))).where(
            Item.sku == sku, Item.status.in_(["owned", "preorder"])
        )
    )).scalar_one()
    wishlists = (await db.execute(
        select(func.count(func.distinct(Item.user_id))).where(
            Item.sku == sku, Item.status == "wishlist"
        )
    )).scalar_one()

    submitted_by_handle = None
    if entry.submitted_by:
        submitted_by_handle = (await db.execute(
            select(User.handle).where(User.id == entry.submitted_by)
        )).scalar_one_or_none()

    return {
        "sku": entry.sku,
        "title": entry.title,
        "brand": entry.brand,
        "category": entry.category,
        "scale": entry.scale,
        "year": entry.year,
        "description": entry.description,
        "tone": entry.tone,
        "est_retail_price": entry.est_retail_price,
        "thumbnail_url": entry.thumbnail_url,
        "is_verified": entry.is_verified,
        "status": entry.status,
        "submitted_by_handle": submitted_by_handle,
        "collectors_count": collectors,
        "wishlists_count": wishlists,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
        "updated_at": entry.updated_at.isoformat() if entry.updated_at else None,
    }


@router.get("/events/pending")
async def pending_events(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    # User-submitted events awaiting review (admin-created ones go live immediately).
    result = await db.execute(
        select(Event, User)
        .join(User, Event.host_id == User.id)
        .where(Event.status == "pending_approval")
        .order_by(Event.created_at.desc())
    )
    return [
        {
            "id": str(e.id),
            "title": e.title,
            "description": e.description,
            "categories": list(e.categories or []),
            "mode": e.mode,
            "city": e.city,
            "venue": e.venue,
            "cover_image_url": e.cover_image_url,
            "starts_at": e.starts_at.isoformat(),
            "host_handle": u.handle,
            "host_name": u.name,
            "interested_count": e.interested_count,
            "created_at": e.created_at.isoformat(),
        }
        for e, u in result
    ]


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


@router.patch("/events/{event_id}/reject", status_code=204)
async def reject_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if event:
        event.status = "rejected"


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


# ── W-47: seed content (prime the feed before organic UGC) ──────────────────

@router.get("/seed-accounts")
async def list_seed_accounts(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Accounts an admin may post as: admins + flagged seed accounts."""
    rows = (await db.execute(
        select(User)
        .where((User.is_admin == True) | (User.is_seed_account == True))  # noqa: E712
        .order_by(User.is_admin.desc(), User.handle)
    )).scalars().all()
    return [
        {"id": str(u.id), "handle": u.handle, "name": u.name,
         "role": "Admin" if u.is_admin else "Seed"}
        for u in rows
    ]


class SeedPostBody(BaseModel):
    account_handle: str
    type: str = "showcase"  # showcase | discussion | review
    category: str | None = None
    title: str | None = None
    body: str
    images: list[str] = []


@router.post("/seed-post", status_code=201)
async def create_seed_post(
    body: SeedPostBody,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Author a feed post as a chosen seed/admin account (W-47). Only seed/admin
    accounts are valid authors — you can't ghost-post as a real user."""
    if body.type not in ("showcase", "discussion", "review"):
        raise HTTPException(status_code=422, detail="type must be showcase | discussion | review")
    if not body.body.strip():
        raise HTTPException(status_code=422, detail="Post body is required")
    account = (await db.execute(
        select(User).where(User.handle == body.account_handle.lower())
    )).scalar_one_or_none()
    if not account or not (account.is_admin or account.is_seed_account):
        raise HTTPException(status_code=404, detail="Not a valid seed account")

    post = Post(
        user_id=account.id,
        type=body.type,
        title=body.title,
        body=body.body.strip(),
        images=body.images,
        category=body.category,
        to_feed=True,
        status="published",
    )
    db.add(post)
    await db.flush()
    return {"id": str(post.id)}


# ── W-47: analytics (real cheap aggregates; engagement/retention needs PostHog) ──

@router.get("/analytics")
async def get_analytics(
    days: int = Query(30, ge=7, le=180),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_admin),
):
    """Investor-facing growth dashboard — every number is a live aggregate over our
    own tables (no fabricated data). DAU/retention is deliberately absent: it needs
    an event stream (PostHog, D-11), not a row count, and we won't fake it.

    Returns: headline totals, period-over-period user growth %, a cumulative user
    curve (the growth story), filled daily signup/post series, marketplace snapshot,
    and the interest-category mix.
    """
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)
    prev_since = now - timedelta(days=days * 2)

    async def _count(model, *where) -> int:
        stmt = select(func.count(model.id))
        for w in where:
            stmt = stmt.where(w)
        return (await db.execute(stmt)).scalar() or 0

    # ── headline totals ──
    total_users = await _count(User)
    total_posts = await _count(Post)
    total_comments = await _count(Comment, Comment.is_removed == False)  # noqa: E712
    active_listings = await _count(Listing, Listing.status == "available")
    sold_listings = await _count(Listing, Listing.status == "sold")
    total_items = await _count(Item)
    total_communities = await _count(Community, Community.status == "approved")
    total_events = await _count(Event)
    total_vouches = await _count(Vouch)
    listed_value = (await db.execute(
        select(func.coalesce(func.sum(Listing.price), 0)).where(Listing.status == "available")
    )).scalar() or 0  # paise

    # ── period-over-period user growth ──
    new_users = await _count(User, User.created_at >= since)
    prev_users = await _count(User, User.created_at >= prev_since, User.created_at < since)
    growth_pct = round((new_users - prev_users) * 100 / prev_users) if prev_users else None
    baseline_users = total_users - new_users  # users that existed before the window opened

    # ── daily series (filled so the chart has no gaps) ──
    def _daily(rows):
        by_day = {d.date().isoformat(): c for d, c in rows}
        out = []
        for i in range(days + 1):
            key = (since + timedelta(days=i)).date().isoformat()
            out.append({"date": key, "count": by_day.get(key, 0)})
        return out

    uday = func.date_trunc("day", User.created_at)
    signup_rows = (await db.execute(
        select(uday.label("d"), func.count(User.id))
        .where(User.created_at >= since).group_by(uday).order_by(uday)
    )).all()
    pday = func.date_trunc("day", Post.created_at)
    post_rows = (await db.execute(
        select(pday.label("d"), func.count(Post.id))
        .where(Post.created_at >= since).group_by(pday).order_by(pday)
    )).all()
    signups_per_day = _daily(signup_rows)
    posts_per_day = _daily(post_rows)

    # cumulative user curve = running total starting from the pre-window baseline
    cumulative_users, running = [], baseline_users
    for pt in signups_per_day:
        running += pt["count"]
        cumulative_users.append({"date": pt["date"], "total": running})

    # ── interest cohort ──
    interest = func.unnest(User.interests).label("interest")
    cohort = (await db.execute(
        select(interest, func.count().label("n")).group_by(interest).order_by(func.count().desc())
    )).all()
    total_with_interests = sum(n for _, n in cohort) or 1

    return {
        "days": days,
        "totals": {
            "users": total_users,
            "posts": total_posts,
            "comments": total_comments,
            "active_listings": active_listings,
            "sold_listings": sold_listings,
            "listed_value": listed_value,  # paise
            "items": total_items,
            "communities": total_communities,
            "events": total_events,
            "vouches": total_vouches,
        },
        "growth": {
            "new_users": new_users,
            "prev_users": prev_users,
            "growth_pct": growth_pct,  # % change vs the previous equal-length window; null if no prior data
        },
        "cumulative_users": cumulative_users,
        "signups_per_day": signups_per_day,
        "posts_per_day": posts_per_day,
        "interest_cohort": [
            {"label": label, "users": n, "pct": round(n * 100 / total_with_interests)}
            for label, n in cohort
        ],
    }
