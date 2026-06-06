from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.dependencies import get_current_user
from app.ws.manager import manager

from app.routers import (
    auth, users, feed, catalogue, items, posts,
    listings, deals, communities, events,
    threads, notifications, search, media, admin,
)
from app.routers.posts import comments_router


app = FastAPI(
    title="CollectorHub API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST routers ──────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(feed.router)
app.include_router(catalogue.router)
app.include_router(items.router)
app.include_router(posts.router)
app.include_router(comments_router)
app.include_router(listings.router)
app.include_router(deals.router)
app.include_router(communities.router)
app.include_router(events.router)
app.include_router(threads.router)
app.include_router(notifications.router)
app.include_router(search.router)
app.include_router(media.router)
app.include_router(admin.router)


# ── WebSocket ─────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, current_user=Depends(get_current_user)):
    await manager.connect(str(current_user.id), ws)
    try:
        while True:
            data = await ws.receive_text()
            # Clients can send presence pings; nothing else for now
    except WebSocketDisconnect:
        manager.disconnect(str(current_user.id))


@app.get("/health")
async def health():
    return {"status": "ok"}
