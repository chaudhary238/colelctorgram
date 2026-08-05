"""Preview / verify the catalogue-verification migration (d4f2a7c9e610) on any database.

READ-ONLY. It never writes, so it is safe to point at QA or prod at any time.

    # BEFORE deploying — see exactly which rows will flip, and to what:
    DATABASE_URL='postgresql://…neon.tech/neondb?sslmode=require' \
        backend/.venv/bin/python backend/scripts/check_verification_migration.py

    # AFTER the deploy has run `alembic upgrade head` — confirm the result:
    …same command. It auto-detects which side of the migration the DB is on.

Why there is no "apply" mode here: the migration is already the apply step, and the
Render Dockerfile runs `alembic upgrade head && uvicorn …`, so the schema change lands
with the code that understands it. Running the migration on its own, ahead of the deploy,
would take QA down — the live API selects `catalogue.is_official`, `catalogue.is_approved`
and `posts.is_admin_post`, and this migration drops all three.
"""

import asyncio
import os
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


def _async_url(url: str) -> str:
    """Neon/Render hand out sync URLs; asyncpg needs its own driver prefix + ssl param."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    if "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    # asyncpg rejects libpq's `sslmode`; its own spelling is `ssl`.
    return url.replace("?sslmode=require", "?ssl=require").replace("&sslmode=require", "&ssl=require")


BEFORE_SQL = """
SELECT
  (is_official AND is_approved AND submitted_by IS NULL) AS becomes_verified,
  (submitted_by IS NULL)                                 AS team_loaded,
  count(*)
FROM catalogue GROUP BY 1, 2 ORDER BY 1 DESC, 2 DESC
"""

# The rows the migration deliberately DEMOTES: flagged official only because an admin
# added them to their own collection while resolve_or_create set is_official=user.is_admin.
DEMOTED_SQL = """
SELECT c.sku, left(c.title, 44) AS title, u.handle
FROM catalogue c JOIN users u ON u.id = c.submitted_by
WHERE c.is_official AND c.is_approved
ORDER BY c.sku
"""

AFTER_SQL = """
SELECT is_verified, (submitted_by IS NULL) AS team_loaded, count(*)
FROM catalogue GROUP BY 1, 2 ORDER BY 1 DESC, 2 DESC
"""


async def main() -> int:
    raw = os.getenv("DATABASE_URL")
    if not raw:
        print("Set DATABASE_URL (the target database) and re-run.", file=sys.stderr)
        return 2

    engine = create_async_engine(_async_url(raw))
    async with engine.connect() as conn:
        cols = set(
            (
                await conn.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_name = 'catalogue'"
                    )
                )
            ).scalars()
        )
        migrated = "is_verified" in cols

        if not migrated:
            print("STATE: pre-migration (catalogue still has is_official / is_approved)\n")
            print("After `alembic upgrade head`, rows land like this:")
            for verified, team, n in (await conn.execute(text(BEFORE_SQL))).all():
                label = "Scorred Verified" if verified else "Pending verification"
                src = "team-loaded (seed/import)" if team else "user-submitted"
                print(f"  {n:>5}  {label:<22} {src}")

            demoted = (await conn.execute(text(DEMOTED_SQL))).all()
            print(f"\nDemoted to Pending — admin-self-verified entries ({len(demoted)}):")
            for sku, title, handle in demoted:
                print(f"  {sku:<22} {title:<46} @{handle}")
            if not demoted:
                print("  (none)")
        else:
            print("STATE: migrated (catalogue.is_verified present)\n")
            for verified, team, n in (await conn.execute(text(AFTER_SQL))).all():
                label = "Scorred Verified" if verified else "Pending verification"
                src = "team-loaded (seed/import)" if team else "user-submitted"
                print(f"  {n:>5}  {label:<22} {src}")

            bad = (
                await conn.execute(
                    text(
                        "SELECT count(*) FROM catalogue "
                        "WHERE is_verified AND submitted_by IS NOT NULL"
                    )
                )
            ).scalar()
            print(
                f"\nUser-submitted rows still marked verified: {bad}"
                f"{'  <-- expected 0 right after the migration; anything here was verified by an admin since' if bad else '  (as expected)'}"
            )

    await engine.dispose()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
