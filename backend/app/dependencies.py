from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.services.auth import decode_access_token

# Presence (DF-36a): refresh last_active_at at most this often to avoid a write
# on every authenticated request while still keeping the "Online now" dot fresh.
_PRESENCE_THROTTLE = timedelta(seconds=60)

bearer = HTTPBearer()


async def get_current_user_unverified(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
):
    """Authenticated user, email verification NOT required. Only for endpoints an
    unverified account must reach: verify-email, resend-otp, change-password, and
    GET /users/me (the verify page's session fetch)."""
    from app.models.user import User

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.is_suspended:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Presence: touch last_active_at (throttled) so others see an accurate
    # "Online now" / "Active …" dot. Committed with the request via get_db.
    now = datetime.now(timezone.utc)
    last = user.last_active_at
    if last is None or last.tzinfo is None or (now - last) > _PRESENCE_THROTTLE:
        user.last_active_at = now

    return user


async def get_current_user(current_user=Depends(get_current_user_unverified)):
    """Standard auth dependency: valid token AND verified email. The frontend only
    routes users past /auth/verify once verified, so a 403 here means the API was
    hit directly with an unverified account."""
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required",
        )
    return current_user


async def get_current_admin(current_user=Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
