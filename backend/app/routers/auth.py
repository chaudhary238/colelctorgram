import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user_unverified
from app.models.user import User
from app.services.auth import (
    create_access_token, create_refresh_token, create_reset_token,
    decode_refresh_token, decode_reset_token, hash_password, verify_password,
    password_fingerprint,
)
from app.services.email import send_otp_email, send_password_reset_email

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
    # DV6-05 referral: the inviter's SCOR-XXXXX code, from a ?ref=<code> link or
    # the signup form. The +150 credit fires on this user's first item, not now.
    referral_code: str | None = None


class LoginBody(BaseModel):
    # Accepts either an email or a handle/username (QA 1.3). Kept as `identifier`
    # rather than `email` since it is no longer necessarily an email address.
    identifier: str
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
    await _record_referral(db, body.referral_code, invitee=user)

    code = _issue_otp(user)
    await send_otp_email(user.email, code)  # never raises; logs when no API key

    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
        debug_otp=code if _debug_otp_allowed() else None,
    )


async def _record_referral(db: AsyncSession, code: str | None, *, invitee: User) -> None:
    """DV6-05: record a *pending* referral at signup — store the inviter on
    ``invitee.referred_by``. No XP is awarded here; the inviter is credited +150
    only when the invitee adds their first collection item (resolve_referral).
    Never blocks signup — an unknown or self-referral code is silently ignored."""
    from app.services.gamification import inviter_for_code

    inviter = await inviter_for_code(db, code)
    if inviter is None or inviter.id == invitee.id:
        return
    invitee.referred_by = inviter.id
    await db.flush()


class VerifyEmailBody(BaseModel):
    code: str


@router.post("/verify-email", status_code=204)
async def verify_email(
    body: VerifyEmailBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_unverified),
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
    current_user: User = Depends(get_current_user_unverified),
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
    # Match on email OR handle so users can sign in with either (QA 1.3).
    ident = body.identifier.lower().strip().lstrip("@")
    result = await db.execute(
        select(User).where((User.email == ident) | (User.handle == ident))
    )
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
    current_user: User = Depends(get_current_user_unverified),
):
    if not current_user.password_hash or not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    current_user.password_hash = hash_password(body.new_password)
    db.add(current_user)


# ── Password reset (B-71 / DF-37a) ────────────────────────────────────────
class ForgotPasswordBody(BaseModel):
    email: EmailStr


class ResetPasswordBody(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordBody, db: AsyncSession = Depends(get_db)):
    """Email a reset link. Always 200 (never reveal whether the email exists)."""
    result = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    user = result.scalar_one_or_none()
    debug_token = None
    if user and user.password_hash:  # OAuth-only accounts have no password to reset
        token = create_reset_token(str(user.id), user.password_hash)
        reset_url = f"{settings.frontend_url}/auth/reset?token={token}"
        await send_password_reset_email(user.email, reset_url)  # never raises; logs when no API key
        if settings.app_debug:
            logger.info("password reset link for %s: %s", user.email, reset_url)
        debug_token = token if _debug_otp_allowed() else None
    # Uniform response regardless of existence.
    return {"ok": True, "debug_token": debug_token}


@router.post("/reset-password", status_code=204)
async def reset_password(body: ResetPasswordBody, db: AsyncSession = Depends(get_db)):
    payload = decode_reset_token(body.token)
    if not payload:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    result = await db.execute(select(User).where(User.id == payload.get("sub")))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")
    # Single-use: the embedded fingerprint must still match the current hash.
    if payload.get("fp") != password_fingerprint(user.password_hash):
        raise HTTPException(status_code=400, detail="This reset link has already been used")
    user.password_hash = hash_password(body.new_password)
    db.add(user)


# ── OAuth social sign-in (C-04 / DF-37a) — config-gated ───────────────────
# Real provider verification. Endpoints 503 (and the UI hides the buttons) until
# the matching client id is configured, so nothing dead ships before credentials.
class OAuthProvidersOut(BaseModel):
    google: bool
    apple: bool


@router.get("/providers", response_model=OAuthProvidersOut)
async def oauth_providers():
    return OAuthProvidersOut(
        google=bool(settings.google_client_id),
        apple=bool(settings.apple_client_id),
    )


class OAuthBody(BaseModel):
    credential: str  # provider-issued ID token (Google credential / Apple id_token)


async def _handle_oauth_user(db: AsyncSession, *, email: str, name: str | None) -> TokenResponse:
    """Find-or-create a user for a verified OAuth email and issue our tokens."""
    email = email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        # Derive a unique handle from the email local part.
        base = "".join(c for c in email.split("@")[0].lower() if c.isalnum()) or "collector"
        handle = base
        while (await db.execute(select(User.id).where(User.handle == handle))).scalar_one_or_none():
            handle = f"{base}{secrets.randbelow(10000)}"
        user = User(
            id=uuid.uuid4(), handle=handle, name=name or base, email=email,
            password_hash=None, email_verified=True,  # provider already verified the email
        )
        db.add(user)
        await db.flush()
    elif not user.email_verified:
        # Existing account matched by email. The provider has just asserted this
        # email is verified (checked by the caller), so clear any pending
        # verification — otherwise the account 403s on every endpoint behind
        # get_current_user despite a successful provider sign-in.
        user.email_verified = True
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/oauth/google", response_model=TokenResponse)
async def oauth_google(body: OAuthBody, db: AsyncSession = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")
    # Verify the ID token with Google's tokeninfo endpoint (no extra dependency).
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": body.credential})
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid Google credential")
    data = resp.json()
    if data.get("aud") != settings.google_client_id:
        raise HTTPException(status_code=401, detail="Google credential was issued for another app")
    if data.get("email_verified") in ("false", False):
        raise HTTPException(status_code=401, detail="Google email is not verified")
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Google credential has no email")
    return await _handle_oauth_user(db, email=email, name=data.get("name"))


@router.post("/oauth/apple", response_model=TokenResponse)
async def oauth_apple(body: OAuthBody, db: AsyncSession = Depends(get_db)):
    if not settings.apple_client_id:
        raise HTTPException(status_code=503, detail="Apple sign-in is not configured")
    from jose import jwt as jose_jwt
    # Apple signs the identity token with rotating RSA keys published as a JWKS.
    async with httpx.AsyncClient(timeout=10) as client:
        jwks_resp = await client.get("https://appleid.apple.com/auth/keys")
    if jwks_resp.status_code != 200:
        raise HTTPException(status_code=503, detail="Could not reach Apple to verify the credential")
    try:
        claims = jose_jwt.decode(
            body.credential, jwks_resp.json(),
            algorithms=["RS256"], audience=settings.apple_client_id,
            issuer="https://appleid.apple.com",
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Apple credential")
    email = claims.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Apple credential has no email")
    return await _handle_oauth_user(db, email=email, name=None)


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
