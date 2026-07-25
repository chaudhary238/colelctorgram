"""Rate limiting (B-63/B-68) — in-process sliding window, wired as FastAPI dependencies.

Deliberately NOT a service dependency: single backend instance is a locked Phase-1
decision (LAUNCH_PLAN §3 — Redis only at 2+ instances), so per-process memory gives
the same guarantee slowapi's default in-memory storage would, with zero new deps.
If/when the backend goes multi-instance, swap `_hit` for a Redis token bucket.

Usage:
    @router.post("", dependencies=[Depends(rate_limit_user("post"))])
    @router.post("/login", dependencies=[Depends(rate_limit_ip("auth"))])

IP-keyed limits are for unauthenticated endpoints (login/signup/forgot-password);
user-keyed limits are for authenticated writes (post/listing/message/report).
"""
import time
from collections import defaultdict

from fastapi import Depends, HTTPException, Request

from app.dependencies import get_current_user, get_current_user_unverified

# kind -> (max hits, window seconds)
RATE_LIMITS: dict[str, tuple[int, int]] = {
    "auth": (5, 60),        # login / signup attempts per IP
    "email": (3, 300),      # forgot-password / resend-otp (each send costs Resend quota)
    "post": (10, 300),      # post creation
    "listing": (5, 300),    # listing creation
    "message": (30, 60),    # chat sends — generous, chat must stay responsive
    "report": (5, 300),     # report submissions
}

_store: dict[str, list[float]] = defaultdict(list)


def _hit(key: str, kind: str) -> bool:
    """Record a hit; False when the caller is over the limit for `kind`."""
    limit, window = RATE_LIMITS.get(kind, (30, 60))
    now = time.time()
    hits = [t for t in _store[key] if now - t < window]
    if len(hits) >= limit:
        _store[key] = hits
        return False
    hits.append(now)
    _store[key] = hits
    return True


def _too_many() -> HTTPException:
    return HTTPException(status_code=429, detail="Too many requests — please slow down and try again.")


def _client_ip(request: Request) -> str:
    # Behind Render/Vercel proxies the peer address is the proxy; the original
    # client is the first hop in X-Forwarded-For.
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit_ip(kind: str):
    """Dependency: limit by client IP — for unauthenticated endpoints."""
    async def dep(request: Request) -> None:
        if not _hit(f"ip:{kind}:{_client_ip(request)}", kind):
            raise _too_many()
    return dep


def rate_limit_user(kind: str, *, unverified: bool = False):
    """Dependency: limit by authenticated user id.

    `unverified=True` uses get_current_user_unverified — for endpoints reachable
    before email verification (e.g. resend-otp).
    """
    user_dep = get_current_user_unverified if unverified else get_current_user

    async def dep(current_user=Depends(user_dep)) -> None:
        if not _hit(f"user:{kind}:{current_user.id}", kind):
            raise _too_many()
    return dep
