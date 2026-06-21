import uuid
from pathlib import Path

import boto3
from botocore.config import Config

from app.config import settings

# Where the local-disk fallback stores uploads (served via a static mount).
MEDIA_LOCAL_DIR = Path(__file__).resolve().parents[2] / "media_uploads"


def _r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def generate_upload_url(prefix: str, content_type: str = "image/jpeg") -> dict:
    key = f"{prefix}/{uuid.uuid4()}.jpg"

    # Local-disk fallback for dev (no R2 creds): the browser PUTs to our own
    # backend endpoint, and the file is served back over a static mount.
    if not settings.r2_configured:
        base = settings.media_local_base_url.rstrip("/")
        return {
            "upload_url": f"{base}/media/local/{key}",
            "key": key,
            "public_url": f"{base}/media-files/{key}",
        }

    client = _r2_client()
    presigned = client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.r2_bucket,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=600,  # 10 minutes
    )
    public_url = f"{settings.r2_public_url}/{key}"
    return {"upload_url": presigned, "key": key, "public_url": public_url}
