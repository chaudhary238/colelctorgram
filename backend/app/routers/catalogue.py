import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.database import get_db
from app.dependencies import get_current_user
from app.models.catalogue import Catalogue
from app.models.item import Item
from app.models.trust import Report
from app.models.user import Follow, User
from app.services.catalogue import norm_title, MATCH_MEDIUM
from app.services.gamification import award_xp

router = APIRouter(prefix="/catalogue", tags=["catalogue"])


class SubmitCatalogueBody(BaseModel):
    sku: str
    title: str
    brand: str
    category: str
    scale: Optional[str] = None
    year: Optional[str] = None
    est_retail_price: int = 0
    thumbnail_url: Optional[str] = None


def _hit(c: Catalogue, score: float | None = None) -> dict:
    return {
        "sku": c.sku,
        "title": c.title,
        "brand": c.brand,
        "category": c.category,
        "scale": c.scale,
        "year": c.year,
        "description": c.description,
        "est_retail_price": c.est_retail_price,
        "thumbnail_url": c.thumbnail_url,
        # DV6-12 — de-dup search surfaces pending (unreviewed) community entries too,
        # flagged so the UI can badge them; `score` is the fuzzy match strength (0..1).
        "pending": not c.is_approved,
        "score": round(score, 3) if score is not None else None,
        # DV6-13 — Official = admin-blessed (a badge, not a gate); everything else is community.
        "is_official": c.is_official,
    }


@router.get("/popular")
async def popular_catalogue(
    category: Optional[str] = Query(None, description="comma-separated categories to prefer (e.g. user interests)"),
    limit: int = Query(6, le=20),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Default "Popular in your interests" suggestions for the Add-to-collection form (DV4-02c).

    Prefers the caller's interest categories when provided, then fills with other approved items.
    """
    cats = [c.strip() for c in category.split(",") if c.strip()] if category else []
    stmt = select(Catalogue).where(Catalogue.is_approved == True, Catalogue.status != "removed")
    if cats:
        stmt = stmt.order_by(Catalogue.category.in_(cats).desc(), Catalogue.est_retail_price.desc())
    else:
        stmt = stmt.order_by(Catalogue.est_retail_price.desc())
    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    return {"hits": [_hit(c) for c in result.scalars().all()]}


@router.get("/search")
async def search_catalogue(
    q: str = Query(..., min_length=1),
    category: Optional[str] = None,
    brand: Optional[str] = None,
    scale: Optional[str] = None,
    limit: int = Query(10, le=30),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Central-catalogue de-dup search (DV6-12). Ranks by trigram similarity on the
    normalized title, filtered by category/brand/scale, and INCLUDES pending
    community entries so a second contributor links to an existing entry instead of
    creating a duplicate. Falls back to a substring match so short/partial queries
    still surface obvious hits."""
    q_norm = norm_title(q)
    pattern = f"%{q.lower()}%"
    score = func.similarity(Catalogue.norm_title, q_norm)
    stmt = select(Catalogue, score.label("score")).where(
        Catalogue.status != "removed",  # DV6-13 — hide reactively-removed entries
        or_(
            score >= MATCH_MEDIUM,
            func.lower(Catalogue.title).like(pattern),
            func.lower(Catalogue.brand).like(pattern),
            func.lower(Catalogue.sku).like(pattern),
        ),
    )
    if category:
        stmt = stmt.where(Catalogue.category == category)
    if brand:
        stmt = stmt.where(func.lower(Catalogue.brand) == brand.lower())
    if scale:
        stmt = stmt.where(Catalogue.scale == scale)
    # Best matches first (NULL similarity = substring-only hit → last); approved wins ties.
    stmt = stmt.order_by(score.desc().nullslast(), Catalogue.is_approved.desc()).limit(limit)
    rows = (await db.execute(stmt)).all()
    return {"hits": [_hit(c, s) for c, s in rows], "query": q}


@router.get("/brands")
async def catalogue_brands(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Distinct brands present in the catalogue (optionally within a category), for
    the brand dropdown. The frontend unions these with its canonical CAT_BRANDS list
    (DV6-12). Includes pending entries so newly-added brands appear immediately."""
    stmt = select(Catalogue.brand).where(Catalogue.brand.isnot(None)).distinct()
    if category:
        stmt = stmt.where(Catalogue.category == category)
    rows = (await db.execute(stmt)).scalars().all()
    brands = sorted({b.strip() for b in rows if b and b.strip()}, key=str.lower)
    return {"brands": brands}


@router.get("/scales")
async def catalogue_scales(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Distinct scales present in the catalogue (optionally within a category), for the
    Database browse filter sheet (DV7-02). The frontend unions these with its canonical
    CAT_SCALES list — designer/tcg have no scale, so this comes back empty there.

    Must stay registered BEFORE /{sku} so the literal path wins the route match.
    """
    stmt = select(Catalogue.scale).where(
        Catalogue.scale.isnot(None), Catalogue.status != "removed"
    ).distinct()
    if category:
        stmt = stmt.where(Catalogue.category == category)
    rows = (await db.execute(stmt)).scalars().all()
    scales = sorted({s.strip() for s in rows if s and s.strip() and s.strip() != "—"})
    return {"scales": scales}


def _shelf_counts():
    """Sub-selects for "how many collectors own / wishlist each SKU", keyed by sku.

    Owned = on the shelf (owned|preorder). Wishlist = casual demand. `intel` DB
    contributions are unowned seeds and deliberately count as neither — same rule as
    GET /catalogue/{sku}.
    """
    owners = (
        select(Item.sku, func.count(func.distinct(Item.user_id)).label("n"))
        .where(Item.sku.isnot(None), Item.status.in_(["owned", "preorder"]))
        .group_by(Item.sku)
        .subquery()
    )
    wishes = (
        select(Item.sku, func.count(func.distinct(Item.user_id)).label("n"))
        .where(Item.sku.isnot(None), Item.status == "wishlist")
        .group_by(Item.sku)
        .subquery()
    )
    return owners, wishes


async def _viewer_statuses(db: AsyncSession, user_id, skus: list[str]) -> dict[str, str]:
    """{sku: the viewer's own status for it} — owned > preorder > intel > wishlist when
    they hold more than one copy row, matching GET /items/by-sku's priority."""
    if not skus:
        return {}
    priority = {"owned": 0, "preorder": 1, "intel": 2, "wishlist": 3}
    rows = (await db.execute(
        select(Item.sku, Item.status).where(Item.user_id == user_id, Item.sku.in_(skus))
    )).all()
    best: dict[str, str] = {}
    for sku, status in rows:
        cur = best.get(sku)
        if cur is None or priority.get(status, 9) < priority.get(cur, 9):
            best[sku] = status
    return best


@router.get("/browse")
async def browse_catalogue(
    q: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    scale: Optional[str] = None,
    sort: str = Query("owned", pattern="^(owned|wishlisted|newest)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(24, le=48),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Browse the whole Scorred DB — backs the Database tab's grid (DV7-02).

    Different job from /search: that one is the de-dup "did we already have this?"
    lookup (needs `q`, ranks by trigram similarity, caps at 30). This one is a
    browsable, paginated, sortable listing where `q` is optional and the social
    counts (owned / wishlisted) come back with every row so the grid can rank by
    demand. Reactively-removed entries are hidden; pending community entries are
    included and badged, same as search.

    Must stay registered BEFORE /{sku} so the literal path wins the route match.
    """
    owners, wishes = _shelf_counts()
    owners_n = func.coalesce(owners.c.n, 0)
    wishes_n = func.coalesce(wishes.c.n, 0)

    def _filtered(stmt):
        stmt = stmt.where(Catalogue.status != "removed")
        if category:
            stmt = stmt.where(Catalogue.category == category)
        if brand:
            stmt = stmt.where(func.lower(Catalogue.brand) == brand.lower())
        if scale:
            stmt = stmt.where(Catalogue.scale == scale)
        if q and q.strip():
            pattern = f"%{q.strip().lower()}%"
            stmt = stmt.where(or_(
                func.lower(Catalogue.title).like(pattern),
                func.lower(Catalogue.brand).like(pattern),
                func.lower(Catalogue.sku).like(pattern),
            ))
        return stmt

    total = (await db.execute(
        _filtered(select(func.count()).select_from(Catalogue))
    )).scalar_one()

    stmt = _filtered(
        select(Catalogue, owners_n.label("owners"), wishes_n.label("wishes"))
        .outerjoin(owners, owners.c.sku == Catalogue.sku)
        .outerjoin(wishes, wishes.c.sku == Catalogue.sku)
    )
    if sort == "wishlisted":
        order = [wishes_n.desc(), owners_n.desc()]
    elif sort == "newest":
        # `year` is a free-text String(8); 4-digit years sort correctly lexicographically
        # and created_at breaks ties / carries year-less rows.
        order = [Catalogue.year.desc().nullslast()]
    else:  # owned — the default "most owned" ranking
        order = [owners_n.desc(), wishes_n.desc()]
    stmt = stmt.order_by(*order, Catalogue.created_at.desc()).offset((page - 1) * limit).limit(limit)
    rows = (await db.execute(stmt)).all()

    # The caller's own copy per SKU, so the grid can show "in your collection" and
    # flip the wishlist toggle without an extra request per tile.
    viewer = await _viewer_statuses(db, current_user.id, [c.sku for c, _o, _w in rows])

    return {
        "page": page,
        "limit": limit,
        "total": total,
        "items": [
            {
                **_hit(c),
                "owners_count": o,
                "wishlists_count": w,
                "viewer_status": viewer.get(c.sku),
            }
            for c, o, w in rows
        ],
    }


@router.get("/{sku}")
async def get_catalogue_entry(
    sku: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Public detail for one Scorred DB entry (the shared library record, not a
    user's item). Backs the web /db/[sku] page: search results navigate here and
    the page carries the actions (add to collection / view your item / report).

    Note: this catch-all GET must stay registered AFTER /popular, /search and
    /brands so those literal paths keep winning the route match.
    """
    entry = (await db.execute(
        select(Catalogue).where(Catalogue.sku == sku, Catalogue.status != "removed")
    )).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    # How many collectors actually have it on the shelf (owned/preorder; wishlist
    # is intent, and `intel` DB contributions are unowned seeds).
    collectors = (await db.execute(
        select(func.count(func.distinct(Item.user_id))).where(
            Item.sku == sku, Item.status.in_(["owned", "preorder"])
        )
    )).scalar_one()
    # Casual demand signal (wishlist taxonomy 2026-07-11) — shown next to the shelf
    # count; ISO posts are the separate ACTIVE-demand signal.
    wishlists = (await db.execute(
        select(func.count(func.distinct(Item.user_id))).where(
            Item.sku == sku, Item.status == "wishlist"
        )
    )).scalar_one()

    # The caller's own copy, if any — same owned > preorder > wishlist priority as
    # GET /items/by-sku so the page can flip its CTA to "view your item".
    rows = (await db.execute(
        select(Item.id, Item.status).where(Item.user_id == current_user.id, Item.sku == sku)
    )).all()
    viewer_item = None
    if rows:
        priority = {"owned": 0, "preorder": 1, "wishlist": 2}
        best = min(rows, key=lambda r: priority.get(r.status, 3))
        viewer_item = {"id": str(best.id), "status": best.status}

    submitted_by_handle = None
    if entry.submitted_by:
        submitted_by_handle = (await db.execute(
            select(User.handle).where(User.id == entry.submitted_by)
        )).scalar_one_or_none()

    return {
        **_hit(entry),
        "tone": entry.tone,
        "collectors_count": collectors,
        "wishlists_count": wishlists,
        "viewer_item": viewer_item,
        "submitted_by_handle": submitted_by_handle,
        "created_at": entry.created_at.isoformat() if entry.created_at else None,
    }


@router.get("/{sku}/people")
async def catalogue_people(
    sku: str,
    mode: str = Query("owners", pattern="^(owners|wishlist)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(30, le=60),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Who owns / has wishlisted this entry (DV7-02, design_v7 DbPeopleList) — the
    Database detail page's shelf-count row is tappable and opens this list.

    Owners are public (they're on someone's public shelf). Wishlists respect the
    owner's wishlist privacy: `private` hides them, `followers` only shows people the
    caller follows — same rule as GET /users/{handle}/collection.
    """
    from app.routers.users import _wishlist_hidden  # local import — avoids a router cycle

    entry = (await db.execute(
        select(Catalogue).where(Catalogue.sku == sku, Catalogue.status != "removed")
    )).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    statuses = ["owned", "preorder"] if mode == "owners" else ["wishlist"]
    stmt = (
        select(User)
        .join(Item, Item.user_id == User.id)
        .where(
            Item.sku == sku,
            Item.status.in_(statuses),
            Item.privacy == "public",
            User.is_suspended == False,  # noqa: E712
        )
        .distinct()
        .order_by(User.followers_count.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    users = list((await db.execute(stmt)).scalars().all())

    if mode == "wishlist":
        visible = []
        for u in users:
            if u.id == current_user.id or not await _wishlist_hidden(db, current_user, u):
                visible.append(u)
        users = visible

    followed: set = set()
    if users:
        followed = set((await db.execute(
            select(Follow.following_id).where(
                Follow.follower_id == current_user.id,
                Follow.following_type == "user",
                Follow.following_id.in_([u.id for u in users]),
            )
        )).scalars().all())

    return {
        "page": page,
        "limit": limit,
        "mode": mode,
        "items": [
            {
                "handle": u.handle,
                "name": u.name,
                "avatar_url": u.avatar_url,
                "is_following": u.id in followed,
                "is_me": u.id == current_user.id,
            }
            for u in users
        ],
    }


@router.post("/{sku}/wishlist")
async def toggle_catalogue_wishlist(
    sku: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Toggle the caller's wishlist for a catalogue entry (Star action on the Scorred
    DB page — wishlist taxonomy 2026-07-11: casual "might want someday" intent, kept
    in the Saved drawer). Creates/removes a status="wishlist" Item cloned from the
    entry's shared facts; same shape as the per-item toggle in items.py."""
    entry = (await db.execute(
        select(Catalogue).where(Catalogue.sku == sku, Catalogue.status != "removed")
    )).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    owned = (await db.execute(
        select(Item.id).where(
            Item.user_id == current_user.id, Item.sku == sku,
            Item.status.in_(["owned", "preorder"]),
        ).limit(1)
    )).scalar_one_or_none()
    if owned:
        raise HTTPException(status_code=400, detail="Already in your collection")

    existing = (await db.execute(
        select(Item).where(
            Item.user_id == current_user.id, Item.sku == sku, Item.status == "wishlist"
        )
    )).scalars().first()
    if existing:
        await db.delete(existing)
        return {"wishlisted": False}

    year = int(entry.year) if entry.year and entry.year.isdigit() else None
    db.add(Item(
        user_id=current_user.id,
        sku=entry.sku,
        custom_title=entry.title,
        brand=entry.brand,
        scale=entry.scale,
        release_year=year,
        category=entry.category,
        status="wishlist",
        value=entry.est_retail_price or 0,
        privacy="public",
        wishlist_alert_enabled=True,
    ))
    return {"wishlisted": True}


class ReportCatalogueBody(BaseModel):
    reason: str
    notes: Optional[str] = None


@router.post("/{sku}/report", status_code=201)
async def report_catalogue(
    sku: str,
    body: ReportCatalogueBody,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Reactive moderation (DV6-13): flag a catalogue entry (wrong info, duplicate,
    bad/NSFW image, counterfeit…). Goes to the admin reports queue; the entry stays
    live until an admin acts. Deduped per (reporter, sku)."""
    entry = (await db.execute(select(Catalogue).where(Catalogue.sku == sku))).scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Item not found")
    existing = (await db.execute(
        select(Report).where(
            Report.reporter_id == current_user.id,
            Report.target_type == "catalogue",
            Report.target_ref == sku,
            Report.status == "pending",
        )
    )).scalar_one_or_none()
    if existing:
        return {"id": str(existing.id), "already_reported": True}
    report = Report(
        reporter_id=current_user.id,
        target_type="catalogue",
        target_ref=sku,
        reason=body.reason.strip() or "unspecified",
        notes=(body.notes or "").strip() or None,
        status="pending",
    )
    db.add(report)
    await db.flush()
    return {"id": str(report.id), "already_reported": False}


@router.post("", status_code=201)
async def submit_catalogue(
    body: SubmitCatalogueBody,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = await db.execute(select(Catalogue).where(Catalogue.sku == body.sku))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="SKU already exists")

    item = Catalogue(
        sku=body.sku,
        title=body.title,
        norm_title=norm_title(body.title),
        brand=body.brand,
        category=body.category,
        scale=body.scale,
        year=body.year,
        est_retail_price=body.est_retail_price,
        thumbnail_url=body.thumbnail_url,
        submitted_by=current_user.id,
        is_approved=current_user.is_admin,  # auto-approve for admins
    )
    db.add(item)
    await db.flush()
    # DV6-02 — first collector to add this item to the shared DB earns +50 XP.
    # Deduped per item (ref_id) so re-submits never double-award.
    await award_xp(db, current_user, "db_new", ref_id=item.sku, ref_type="catalogue")
    return {"sku": item.sku, "pending_approval": not item.is_approved}
