import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.trust import UserBlock, Report

router = APIRouter(tags=["moderation"])

# ── In-memory rate limiting (B-63) ───────────────────────────────
import time
from collections import defaultdict
from fastapi import Request

_rate_store: dict[str, list[float]] = defaultdict(list)

RATE_LIMITS = {
    "auth": (5, 60),       # 5 per 60s
    "post": (10, 300),     # 10 per 5 min
    "listing": (5, 300),   # 5 per 5 min
}


def check_rate_limit(key: str, kind: str) -> bool:
    limit, window = RATE_LIMITS.get(kind, (30, 60))
    now = time.time()
    hits = _rate_store[key]
    _rate_store[key] = [t for t in hits if now - t < window]
    if len(_rate_store[key]) >= limit:
        return False
    _rate_store[key].append(now)
    return True


# ── Block endpoint (B-64) ─────────────────────────────────────────
_blocks_router = APIRouter(prefix="/blocks")


@_blocks_router.post("", status_code=status.HTTP_204_NO_CONTENT)
async def block_user(
    target_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if target_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    result = await db.execute(select(User).where(User.id == target_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="User not found")

    existing = await db.execute(
        select(UserBlock).where(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id == target_id,
        )
    )
    if existing.scalar_one_or_none():
        return  # already blocked
    db.add(UserBlock(blocker_id=current_user.id, blocked_id=target_id))


@_blocks_router.delete("/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unblock_user(
    target_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(UserBlock).where(
            UserBlock.blocker_id == current_user.id,
            UserBlock.blocked_id == target_id,
        )
    )
    block = result.scalar_one_or_none()
    if block:
        await db.delete(block)


# ── Report endpoint (B-64) ────────────────────────────────────────
class CreateReportBody(BaseModel):
    target_type: str  # user | post | listing | comment
    target_id: uuid.UUID
    reason: str  # spam | harassment | counterfeit | other
    detail: Optional[str] = None


_reports_router = APIRouter(prefix="/reports")


@_reports_router.post("", status_code=status.HTTP_204_NO_CONTENT)
async def submit_report(
    body: CreateReportBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate reason
    VALID_REASONS = {"spam", "harassment", "counterfeit", "other"}
    if body.reason not in VALID_REASONS:
        raise HTTPException(status_code=422, detail=f"reason must be one of {VALID_REASONS}")
    # Persist to the reports table so the admin moderation queue (GET /admin/reports) sees it.
    db.add(Report(
        reporter_id=current_user.id,
        target_type=body.target_type,
        target_id=body.target_id,
        reason=body.reason,
        notes=body.detail,
    ))


router = APIRouter()
router.include_router(_blocks_router)
router.include_router(_reports_router)
