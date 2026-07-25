from fastapi import APIRouter, Depends, Query, Request, HTTPException
from app.config import settings
from app.dependencies import get_current_user
from app.services.media import generate_upload_url, MEDIA_LOCAL_DIR

router = APIRouter(prefix="/media", tags=["media"])

# Dev-only local upload receiver. Registered at ROOT (unversioned) in main.py — the
# presigned local `upload_url` from generate_upload_url points at `/media/local/...`
# WITHOUT the /v1 prefix, so this route must live outside the versioned api_v1 router
# (moving it under /v1 silently 404s every local upload).
local_router = APIRouter(tags=["media"])


@router.post("/upload-url")
async def get_upload_url(
    prefix: str = Query("uploads", pattern="^[a-z_/-]+$"),
    content_type: str = Query("image/jpeg"),
    current_user=Depends(get_current_user),
):
    return generate_upload_url(prefix=f"{prefix}/{current_user.id}", content_type=content_type)


@local_router.put("/media/local/{file_path:path}", status_code=200)
async def put_local_media(file_path: str, request: Request):
    """Dev-only receiver for the local-disk media fallback (no R2).

    Mirrors an S3/R2 presigned PUT: the browser sends raw image bytes here. Disabled
    when real R2 is configured (production should never hit this path).
    """
    if settings.r2_configured:
        raise HTTPException(status_code=404, detail="Not found")

    # Resolve against the media dir and refuse anything that escapes it.
    dest = (MEDIA_LOCAL_DIR / file_path).resolve()
    if not str(dest).startswith(str(MEDIA_LOCAL_DIR.resolve())):
        raise HTTPException(status_code=400, detail="Invalid path")

    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(await request.body())
    return {"ok": True}
