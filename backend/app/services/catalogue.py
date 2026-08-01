"""Central-catalogue de-dup service (DV6-12).

`norm_title` normalizes a title the same way the backfill migration does (lower,
accent-fold, non-alphanumeric runs → single space, trim) so the app and the DB
agree. `resolve_or_create` is the server-side write guard behind the
"search-first, create-only-as-fallback" add flow: it links a free-text add to a
strong existing match instead of minting a duplicate, and only creates a new
(pending) catalogue entry when nothing close exists.
"""
import re
import unicodedata
import uuid
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalogue import Catalogue
from app.models.user import User
from app.services.gamification import award_xp

# Similarity bands (pg_trgm similarity, 0..1):
#   >= HIGH        → server auto-links to the existing entry (no duplicate, no XP)
#   MEDIUM..HIGH   → shown as candidates in /catalogue/search (user decides)
#   < MEDIUM       → treated as new
MATCH_HIGH = 0.7
MATCH_MEDIUM = 0.35


def norm_scale(s: Optional[str]) -> Optional[str]:
    """Canonical scale notation: a FORWARD SLASH, never a colon (Change Spec §5).

    `1:300` and `1/300` are the same scale, but they are different strings, so a
    colon-form row silently drops out of its own filter group and shows up as a second,
    near-duplicate option in the Database's scale list. Everything that writes a scale —
    the add flow, the admin console, importers, seeds — goes through here so the two forms
    can never coexist.

    Only the `1:N` shape is rewritten. Free-text scales ("Non-scale", "1/6 scale") are
    trimmed and otherwise left alone; empty and the "—" placeholder become NULL.
    """
    s = (s or "").strip()
    if not s or s == "—":
        return None
    # 1 : 300 → 1/300, with any spacing around the separator collapsed.
    m = re.fullmatch(r"(\d+)\s*[:/]\s*(\d+)", s)
    if m:
        return f"{m.group(1)}/{m.group(2)}"
    return s


def norm_title(s: Optional[str]) -> str:
    """Lowercase, strip diacritics, collapse every non-alphanumeric run to a single
    space, and trim. Mirrors the SQL backfill (lower(unaccent(...)) + regexp)."""
    if not s:
        return ""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", " ", s.lower())
    return s.strip()


async def best_match(
    db: AsyncSession, category: str, q_norm: str, min_score: float = MATCH_MEDIUM
) -> Optional[tuple[Catalogue, float]]:
    """Highest-similarity catalogue entry in `category` whose norm_title scores
    >= min_score against `q_norm`. Includes pending (unapproved) entries so a second
    contributor de-dups onto the first's pending entry."""
    if len(q_norm) < 3:
        return None
    score = func.similarity(Catalogue.norm_title, q_norm)
    stmt = (
        select(Catalogue, score.label("score"))
        .where(Catalogue.category == category, Catalogue.status != "removed", score >= min_score)
        .order_by(score.desc())
        .limit(1)
    )
    row = (await db.execute(stmt)).first()
    if not row:
        return None
    return row[0], float(row[1])


async def resolve_or_create(
    db: AsyncSession,
    user: User,
    *,
    title: str,
    brand: Optional[str],
    category: Optional[str],
    scale: Optional[str],
    release_year: Optional[int],
    value: int,
    cover_url: Optional[str] = None,
    description: Optional[str] = None,
) -> tuple[str, int, bool]:
    """Resolve a free-text add to a catalogue SKU.

    Returns (sku, xp_awarded, matched_existing):
      • strong match (>= MATCH_HIGH) → link to it, 0 XP, matched=True
      • else                        → create a NEW live entry, +50 XP (deduped), matched=False

    Creating a new entry REQUIRES `cover_url` — the mandatory shared reference image
    (DV6-13). Community entries go live immediately (trust-by-default); admin-added ones
    are flagged Official.
    """
    cat = category or "figures"
    q_norm = norm_title(title)

    match = await best_match(db, cat, q_norm, min_score=MATCH_HIGH)
    if match:
        entry, _score = match
        return entry.sku, 0, True

    if not (cover_url or "").strip():
        raise HTTPException(
            status_code=400,
            detail="A photo is required to add a new item to the Scorred catalogue.",
        )

    sku = f"UGC-{uuid.uuid4().hex[:10].upper()}"
    entry = Catalogue(
        sku=sku,
        title=(title or "").strip(),
        norm_title=q_norm,
        brand=(brand or "Unknown").strip(),
        category=cat,
        scale=norm_scale(scale),  # slash form only (§5)
        year=str(release_year) if release_year else None,
        description=(description or "").strip() or None,
        est_retail_price=value or 0,
        thumbnail_url=cover_url.strip(),
        submitted_by=user.id,
        is_approved=True,            # trust-by-default: live immediately
        is_official=user.is_admin,   # admin adds are Official
        status="live",
    )
    db.add(entry)
    await db.flush()
    granted = await award_xp(db, user, "db_new", ref_id=entry.sku, ref_type="catalogue")
    return sku, (50 if granted else 0), False
