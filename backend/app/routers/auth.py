import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.auth import (
    create_access_token, create_refresh_token,
    decode_refresh_token, hash_password, verify_password,
)
from app.services.email import send_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger("collectorhub.auth")

OTP_TTL_MINUTES = 10


def _issue_otp(user: User) -> str:
    """Generate a 6-digit email-confirmation code (DF-06 / B-72).

    Only the sha256 of the code is stored; the plain code is returned so the
    caller can email it (services/email.py — falls back to logging when
    RESEND_API_KEY is unset, so local dev needs no setup).
    """
    code = f"{secrets.randbelow(1_000_000):06d}"
    user.email_otp_hash = hashlib.sha256(code.encode()).hexdigest()
    user.email_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
    if settings.app_debug:
        # dev convenience — never log codes in production
        logger.info("email OTP for %s <%s>: %s", user.handle, user.email, code)
    return code


class SignUpBody(BaseModel):
    handle: str
    name: str
    email: EmailStr
    password: str


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class RefreshBody(BaseModel):
    refresh_token: str


def _debug_otp_allowed() -> bool:
    """OTP may be echoed in API responses ONLY in local debug — never production."""
    return settings.app_debug and settings.app_env != "production"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    # dev-only (signup): OTP echoed back so the UI can show it while no email
    # domain is wired (Resend needs a verified domain → blocked on name decision)
    debug_otp: str | None = None


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignUpBody, db: AsyncSession = Depends(get_db)):
    # Normalise BEFORE the duplicate check — checking the raw input while storing
    # lowercased let "Test@X.com" slip past the check and 500 on the unique index.
    email = body.email.lower().strip()
    handle = body.handle.lower().strip().lstrip("@")  # tolerate "@handle" input
    if not handle:
        raise HTTPException(status_code=422, detail="Handle is required")
    if len(body.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    existing = await db.execute(
        select(User).where((User.email == email) | (User.handle == handle))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or handle already taken")

    user = User(
        id=uuid.uuid4(),
        handle=handle,
        name=body.name,
        email=email,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    try:
        await db.flush()
    except IntegrityError:
        # concurrent-signup race on the unique index — surface as the same 400
        raise HTTPException(status_code=400, detail="Email or handle already taken")
    code = _issue_otp(user)
    await send_otp_email(user.email, code)  # never raises; logs when no API key

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        debug_otp=code if _debug_otp_allowed() else None,
    )


class VerifyEmailBody(BaseModel):
    code: str


@router.post("/verify-email", status_code=204)
async def verify_email(
    body: VerifyEmailBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Confirm the 6-digit OTP sent at signup (DF-06 / B-72)."""
    if current_user.email_verified:
        return  # idempotent
    if not current_user.email_otp_hash or not current_user.email_otp_expires_at:
        raise HTTPException(status_code=400, detail="No verification code pending — request a new one")
    if datetime.now(timezone.utc) > current_user.email_otp_expires_at:
        raise HTTPException(status_code=400, detail="Code expired — request a new one")
    if hashlib.sha256(body.code.strip().encode()).hexdigest() != current_user.email_otp_hash:
        raise HTTPException(status_code=400, detail="Incorrect code")

    current_user.email_verified = True
    current_user.email_otp_hash = None
    current_user.email_otp_expires_at = None
    db.add(current_user)


@router.post("/resend-otp")
async def resend_otp(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-issue the email-confirmation code (30s client-side cooldown; server allows on demand)."""
    if current_user.email_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    code = _issue_otp(current_user)
    db.add(current_user)
    await send_otp_email(current_user.email, code)
    return {"debug_otp": code if _debug_otp_allowed() else None}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.is_suspended:
        raise HTTPException(status_code=403, detail="Account suspended")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


class ChangePasswordBody(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password", status_code=204)
async def change_password(
    body: ChangePasswordBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not current_user.password_hash or not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    current_user.password_hash = hash_password(body.new_password)
    db.add(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshBody, db: AsyncSession = Depends(get_db)):
    payload = decode_refresh_token(body.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.is_suspended:
        raise HTTPException(status_code=401, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )
