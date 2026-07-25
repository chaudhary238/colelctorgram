from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, WebSocket, WebSocketDisconnect, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, text

from app.config import settings
from app.database import AsyncSessionLocal, engine
from app.services.auth import decode_access_token
from app.ws.manager import manager
from app.workers.tasks import schedule_background_workers

from app.routers import (
    auth, users, feed, catalogue, items, posts,
    listings, communities, events,
    threads, notifications, search, media, admin, rewards,
)
from app.routers.moderation import router as moderation_router
from app.routers.posts import comments_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    schedule_background_workers()
    yield


if settings.sentry_dsn:
    import sentry_sdk

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.app_env,
        traces_sample_rate=0.1,
    )

app = FastAPI(
    title="Scorred API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST routers ──────────────────────────────────────────────────
# All REST endpoints are versioned under /v1 so the contract can evolve without
# breaking existing clients (the Phase-2 mobile app pins to /v1). Infra endpoints
# (/health, /ws) and the dev media mount stay at ROOT — deliberately unversioned:
# Render's health probe hits /health, and browsers open /ws directly.
api_v1 = APIRouter(prefix="/v1")
api_v1.include_router(auth.router)
api_v1.include_router(users.router)
api_v1.include_router(feed.router)
api_v1.include_router(catalogue.router)
api_v1.include_router(items.router)
api_v1.include_router(posts.router)
api_v1.include_router(comments_router)
api_v1.include_router(listings.router)
api_v1.include_router(communities.router)
api_v1.include_router(events.router)
api_v1.include_router(threads.router)
api_v1.include_router(notifications.router)
api_v1.include_router(search.router)
api_v1.include_router(media.router)
api_v1.include_router(admin.router)
api_v1.include_router(moderation_router)
api_v1.include_router(rewards.router)
app.include_router(api_v1)

# Serve locally-stored uploads when R2 is not configured (dev fallback).
if not settings.r2_configured:
    from fastapi.staticfiles import StaticFiles
    from app.services.media import MEDIA_LOCAL_DIR

    MEDIA_LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    # ROOT-level (unversioned) receiver for the browser's presigned local PUT. Must NOT
    # sit under /v1 — generate_upload_url returns `/media/local/...` without the prefix.
    app.include_router(media.local_router)
    app.mount("/media-files", StaticFiles(directory=MEDIA_LOCAL_DIR), name="media-files")


# ── WebSocket ─────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, token: str | None = Query(default=None)):
    # Browsers can't set an Authorization header on a WebSocket, so the access
    # token is passed as ?token=… and validated here (not via the HTTP bearer dep).
    payload = decode_access_token(token) if token else None
    if not payload:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    from app.models.user import User

    user_id = payload.get("sub")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
    if not user or user.is_suspended:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(user_id, ws)
    try:
        while True:
            await ws.receive_text()  # presence pings; nothing else for now
    except WebSocketDisconnect:
        manager.disconnect(user_id)


@app.get("/health")
async def health():
    """Deep check — Railway/uptime probes need DB reachability, not just 'process up'."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(status_code=503, content={"status": "degraded", "db": "down"})
    return {"status": "ok", "db": "ok"}
