import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.database import get_db
from app.dependencies import get_current_user
from app.models.catalogue import Catalogue

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


def _hit(c: Catalogue) -> dict:
    return {
        "sku": c.sku,
        "title": c.title,
        "brand": c.brand,
        "category": c.category,
        "scale": c.scale,
        "year": c.year,
        "est_retail_price": c.est_retail_price,
        "thumbnail_url": c.thumbnail_url,
    }


@router.get("/popular")
async def popular_catalogue(
    category: Optional[str] = Query(None, description="comma-separated categories to prefer (e.g. user interests)"),
    limit: int = Query(6, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Default "Popular in your interests" suggestions for the Add-to-collection form (DV4-02c).

    Prefers the caller's interest categories when provided, then fills with other approved items.
    """
    cats = [c.strip() for c in category.split(",") if c.strip()] if category else []
    stmt = select(Catalogue).where(Catalogue.is_approved == True)
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
    limit: int = Query(10, le=30),
    db: AsyncSession = Depends(get_db),
):
    pattern = f"%{q.lower()}%"
    stmt = select(Catalogue).where(
        Catalogue.is_approved == True,
        or_(
            func.lower(Catalogue.title).like(pattern),
            func.lower(Catalogue.brand).like(pattern),
            func.lower(Catalogue.sku).like(pattern),
        ),
    )
    if category:
        stmt = stmt.where(Catalogue.category == category)
    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    items = result.scalars().all()
    return {"hits": [_hit(c) for c in items], "query": q}


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
    return {"sku": item.sku, "pending_approval": not item.is_approved}
