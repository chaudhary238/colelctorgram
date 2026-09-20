"""Shared plumbing for the founder bulk-upload scripts.

Resolves the target database and R2 credentials the same way migrate_qa.sh
does: explicit DATABASE_URL env var wins, otherwise backend/.prod.env (the
git-ignored QA secrets file). Never hardcode credentials here.
"""
import asyncio
import mimetypes
import re
import uuid
from pathlib import Path

import asyncpg
import boto3
import httpx
from botocore.config import Config

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROD_ENV = BACKEND_DIR / ".prod.env"


def load_prod_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if not PROD_ENV.exists():
        return env
    for line in PROD_ENV.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip().lower()] = v.strip().strip("\"'")
    return env


def resolve_db_url(cli_url: str | None = None) -> str:
    import os

    url = cli_url or os.getenv("DATABASE_URL") or load_prod_env().get("database_url")
    if not url:
        raise SystemExit(
            "No database URL. Pass --db, set DATABASE_URL, or fill backend/.prod.env"
        )
    url = re.sub(r"^postgres(ql)?(\+asyncpg)?://", "postgresql://", url)
    return url.replace("sslmode=", "ssl=")


def _pin_host_via_public_dns(host: str) -> bool:
    """The local resolver intermittently fails on Neon's deep subdomains
    (the recurring 'Neon DNS refusal'). Resolve via 1.1.1.1 and pin the
    answer into socket.getaddrinfo for this process. TLS is unaffected:
    asyncpg still connects by hostname, so cert verification stays strict.
    """
    import socket
    import subprocess

    try:
        out = subprocess.run(
            ["dig", "+short", host, "@1.1.1.1"],
            capture_output=True, text=True, timeout=10,
        ).stdout
    except Exception:
        return False
    ips = [l.strip() for l in out.splitlines()
           if re.fullmatch(r"\d+\.\d+\.\d+\.\d+", l.strip())]
    if not ips:
        return False
    real = socket.getaddrinfo

    def patched(h, *args, **kw):
        if h == host:
            return real(ips[0], *args, **kw)
        return real(h, *args, **kw)

    socket.getaddrinfo = patched
    print(f"  DNS fallback: pinned {host} -> {ips[0]} (via 1.1.1.1)")
    return True


async def connect(url: str, attempts: int = 6) -> asyncpg.Connection:
    # Neon DNS resolution fails transiently from this machine — retry, then
    # fall back to resolving through public DNS.
    host_m = re.search(r"@([^/:?]+)", url)
    last: Exception | None = None
    for i in range(attempts):
        try:
            return await asyncpg.connect(url)
        except OSError as e:
            last = e
            print(f"  connect attempt {i + 1} failed ({e})")
            if i == 0 and host_m and _pin_host_via_public_dns(host_m.group(1)):
                continue
            await asyncio.sleep(5)
    raise SystemExit(f"could not connect after {attempts} attempts: {last}")


# ── R2 ───────────────────────────────────────────────────────────────────────

def r2_configured() -> bool:
    return bool(load_prod_env().get("r2_account_id"))


def r2_client_and_bucket():
    env = load_prod_env()
    account = env.get("r2_account_id")
    if not account:
        raise SystemExit("backend/.prod.env has no r2_account_id — cannot upload media")
    client = boto3.client(
        "s3",
        endpoint_url=f"https://{account}.r2.cloudflarestorage.com",
        aws_access_key_id=env["r2_access_key_id"],
        aws_secret_access_key=env["r2_secret_access_key"],
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )
    return client, env["r2_bucket"], env["r2_public_url"].rstrip("/")


def normalize_image_url(url: str) -> str:
    """Rewrite common share links to direct-download form (Google Drive)."""
    m = re.search(r"drive\.google\.com/file/d/([\w-]+)", url)
    if m:
        return f"https://drive.google.com/uc?export=download&id={m.group(1)}"
    m = re.search(r"drive\.google\.com/open\?id=([\w-]+)", url)
    if m:
        return f"https://drive.google.com/uc?export=download&id={m.group(1)}"
    return url


def download_image(url: str, timeout: float = 30.0) -> tuple[bytes, str]:
    """Fetch an image URL; returns (bytes, content_type). Raises on non-image.

    Polite by design: descriptive UA, ~1.5s spacing between fetches, and
    backoff-retry on 429 — Wikimedia's rate limiter throttles bursty scripted
    clients (bit the first seed ingest run)."""
    import time

    headers = {"User-Agent": "ScorredSeedBot/1.0 (collector platform seeding; contact: rajnishbirdeye@gmail.com)"}
    with httpx.Client(follow_redirects=True, timeout=timeout, headers=headers) as c:
        for attempt in range(4):
            time.sleep(1.5)
            r = c.get(normalize_image_url(url))
            if r.status_code == 429 and attempt < 3:
                wait = 10 * (attempt + 1)
                print(f"    429 rate-limited, waiting {wait}s…")
                time.sleep(wait)
                continue
            r.raise_for_status()
            break
        ctype = r.headers.get("content-type", "").split(";")[0].strip().lower()
        if not ctype.startswith("image/"):
            raise ValueError(f"not an image (content-type={ctype or 'unknown'})")
        if len(r.content) < 5_000:
            raise ValueError(f"suspiciously small image ({len(r.content)} bytes)")
        return r.content, ctype


def upload_to_r2(data: bytes, content_type: str, prefix: str = "posts") -> str:
    """Re-host bytes on R2 under the app's {prefix}/{uuid}.{ext} scheme."""
    client, bucket, public = r2_client_and_bucket()
    ext = mimetypes.guess_extension(content_type) or ".jpg"
    if ext == ".jpe":
        ext = ".jpg"
    key = f"{prefix}/{uuid.uuid4()}{ext}"
    client.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)
    return f"{public}/{key}"
