from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.place import City
from app.models.user import User

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("")
async def search_cities(
    q: str = Query("", max_length=80),
    limit: int = Query(8, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Canonical-city suggestions for CityField (onboarding, events, edit profile).

    Empty q → the major metros (popularity desc). Otherwise the same ranking the
    old frontend constant used: name/alias starts-with first, then any-field
    contains — so "Kerala", "Japan" and "bombay" all surface the right rows.
    """
    s = q.strip().lower()
    if not s:
        rows = (await db.execute(
            select(City).order_by(City.popularity.desc(), City.id).limit(limit)
        )).scalars().all()
    else:
        pattern = f"%{s}%"
        candidates = (await db.execute(
            select(City).where(or_(
                City.name.ilike(pattern),
                City.region.ilike(pattern),
                City.country.ilike(pattern),
                City.aliases.ilike(pattern),
            )).limit(80)
        )).scalars().all()

        def starts(c: City) -> bool:
            if c.name.lower().startswith(s):
                return True
            return any(a.strip().startswith(s) for a in (c.aliases or "").split(","))

        ranked = sorted(candidates, key=lambda c: (not starts(c), -c.popularity, c.id))
        rows = ranked[:limit]

    return {"cities": [{"name": c.name, "region": c.region, "country": c.country} for c in rows]}
