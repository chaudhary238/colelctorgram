"""Engagement & Rewards endpoints (BRD v1.4 §8.12, §9.17–9.19).

Rewards screen, daily check-in, dual-mode leaderboard, profile rank card, and the
public trophy case. Mechanics live in app.services.gamification.
"""
from typing import Optional, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.services import gamification as gm

router = APIRouter(tags=["rewards"])


def _user_public(u: User) -> dict:
    return {"handle": u.handle, "name": u.name, "avatar_url": u.avatar_url}


# ── Rewards screen (§9.17) ───────────────────────────────────────────────────
@router.get("/rewards/me")
async def get_my_rewards(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await gm.rewards_summary(db, current_user)


@router.post("/rewards/checkin")
async def daily_checkin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Claim today's +5 (GM-04). Idempotent — a second claim returns granted:false."""
    return await gm.claim_checkin(db, current_user)


# ── Leaderboard (§9.18) — Weekly + Lifetime only (v3 §9) ─────────────────────
@router.get("/rewards/leaderboard")
async def get_leaderboard(
    period: Literal["week", "all"] = Query("week"),
    db: AsyncSession = Depends(get_db),
    me: Optional[User] = Depends(get_optional_user),
):
    return await gm.leaderboard(db, period=period, me=me)


# ── Profile rank card (GM-15) ────────────────────────────────────────────────
@router.get("/users/{handle}/rank")
async def get_user_rank(
    handle: str,
    db: AsyncSession = Depends(get_db),
    viewer: Optional[User] = Depends(get_optional_user),
):
    res = await db.execute(select(User).where(User.handle == handle.lower()))
    user = res.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    card = await gm.rank_card(db, user)
    card["user"] = _user_public(user)
    card["is_me"] = viewer is not None and viewer.id == user.id
    return card


# ── Trophy case (§9.19 / GM-13) — always public ──────────────────────────────
@router.get("/users/{handle}/badges")
async def get_user_badges(
    handle: str,
    db: AsyncSession = Depends(get_db),
    viewer: Optional[User] = Depends(get_optional_user),
):
    res = await db.execute(select(User).where(User.handle == handle.lower()))
    user = res.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    case = await gm.trophy_case(db, user)
    case["user"] = _user_public(user)
    case["is_me"] = viewer is not None and viewer.id == user.id
    return case
