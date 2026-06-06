from fastapi import APIRouter, Depends, Query
from app.dependencies import get_current_user
from app.services.media import generate_upload_url

router = APIRouter(prefix="/media", tags=["media"])


@router.post("/upload-url")
async def get_upload_url(
    prefix: str = Query("uploads", pattern="^[a-z_/-]+$"),
    content_type: str = Query("image/jpeg"),
    current_user=Depends(get_current_user),
):
    return generate_upload_url(prefix=f"{prefix}/{current_user.id}", content_type=content_type)
