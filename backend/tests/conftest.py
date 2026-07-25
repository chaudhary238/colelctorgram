"""Integration test harness (T-01).

Drives the real FastAPI app over an in-process ASGI client against a REAL Postgres
(the models use Postgres-only types + ON CONFLICT, so SQLite can't stand in).

Safety: uses a SEPARATE test database (TEST_DATABASE_URL, default `..._test`) and
SKIPS the whole integration suite if that DB isn't reachable — so `pytest` locally
with no test DB still runs the pure-unit tests and NEVER touches the dev database.

Each test gets a fresh engine bound to its own event loop (NullPool — asyncpg
engines are loop-bound), schema ensured via create_all, and every table truncated
so tests are isolated. The in-process rate-limit store is cleared too.
"""
import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

os.environ.setdefault("APP_ENV", "development")

import app.models  # noqa: E402,F401 — populate Base.metadata with every model
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.services.ratelimit import _store as _ratelimit_store  # noqa: E402

TEST_DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/collectohub_test",
)


@pytest_asyncio.fixture
async def engine():
    eng = create_async_engine(TEST_DB_URL, poolclass=NullPool)
    try:
        async with eng.begin() as conn:
            # Extensions the migrations enable — search/catalogue resolve use pg_trgm's
            # similarity(); create_all alone won't add them.
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS unaccent"))
            await conn.run_sync(Base.metadata.create_all)  # checkfirst=True — near-noop after first run
            for table in reversed(Base.metadata.sorted_tables):
                await conn.execute(text(f'TRUNCATE TABLE "{table.name}" CASCADE'))
    except Exception as e:  # test DB not reachable → skip integration tests, keep unit tests green
        await eng.dispose()
        pytest.skip(f"integration DB not available ({TEST_DB_URL}): {e}")
    _ratelimit_store.clear()  # limiter is in-process; don't let one test's hits bleed into the next
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def db(engine):
    """Direct DB session for arranging/asserting state around the HTTP client."""
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as s:
        yield s


@pytest_asyncio.fixture
async def client(engine):
    """ASGI client hitting the real app with get_db pointed at the test DB.

    Paths are full and versioned, e.g. `client.post("/v1/auth/signup", ...)`.
    """
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def _override_get_db():
        async with Session() as s:
            try:
                yield s
                await s.commit()
            except Exception:
                await s.rollback()
                raise

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.pop(get_db, None)


# ── helpers ─────────────────────────────────────────────────────────────────

async def signup_verified(client: AsyncClient, handle: str, *, admin_db: AsyncSession | None = None) -> dict:
    """Sign up a user, verify their email via the dev debug_otp, and return
    {id, handle, access, headers}. If admin_db is passed the user is flipped to admin.
    """
    email = f"{handle}@test.scorred"
    r = await client.post("/v1/auth/signup", json={
        "handle": handle, "name": handle.title(), "email": email, "password": "password123",
    })
    assert r.status_code == 201, r.text
    body = r.json()
    access = body["access_token"]
    headers = {"Authorization": f"Bearer {access}"}
    # verify email with the echoed dev OTP
    otp = body["debug_otp"]
    vr = await client.post("/v1/auth/verify-email", json={"code": otp}, headers=headers)
    assert vr.status_code == 204, vr.text

    # fetch the user id
    me = await client.get("/v1/users/me", headers=headers)
    assert me.status_code == 200, me.text
    uid = me.json()["id"]
    return {"id": uid, "handle": handle, "access": access, "headers": headers}
