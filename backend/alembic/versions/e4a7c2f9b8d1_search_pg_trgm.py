"""Search maturity — pg_trgm extension + GIN trigram indexes (search QA 2026-06-29).

Upgrades `/search` from unindexed `ILIKE '%q%'` sequential scans to index-backed
substring + trigram fuzzy matching (typo tolerance via word_similarity), all inside
Postgres — no new service, no RAM cost (stays on the LAUNCH_PLAN "$0 search" line;
Meilisearch trigger untouched). Cost = a few MB of GIN index disk + marginally
slower writes on the indexed columns.

GIN `gin_trgm_ops` indexes back both `col ILIKE '%q%'` and `word_similarity()/%`,
so the existing queries get faster and gain fuzzy matching with the same indexes.

Chains off head d8f3b1c64a25 (DV4 pincode/sub-interests).

Revision ID: e4a7c2f9b8d1
Revises: d8f3b1c64a25
Create Date: 2026-06-29
"""
from typing import Sequence, Union

from alembic import op

revision: str = "e4a7c2f9b8d1"
down_revision: Union[str, None] = "d8f3b1c64a25"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# (table, index suffix, column) — every text column matched by routers/search.py.
_TRGM_INDEXES = [
    ("users", "users_handle", "handle"),
    ("users", "users_name", "name"),
    ("catalogue", "catalogue_title", "title"),
    ("catalogue", "catalogue_brand", "brand"),
    ("catalogue", "catalogue_sku", "sku"),
    ("communities", "communities_name", "name"),
    ("communities", "communities_desc", "description"),
    ("events", "events_title", "title"),
    ("events", "events_city", "city"),
    ("posts", "posts_body", "body"),
    ("posts", "posts_title", "title"),
]


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    for table, suffix, col in _TRGM_INDEXES:
        op.execute(
            f"CREATE INDEX IF NOT EXISTS idx_trgm_{suffix} "
            f"ON {table} USING gin ({col} gin_trgm_ops)"
        )


def downgrade() -> None:
    for _table, suffix, _col in _TRGM_INDEXES:
        op.execute(f"DROP INDEX IF EXISTS idx_trgm_{suffix}")
    # Drop the extension last (indexes depended on it). Leave commented if other
    # features ever start using pg_trgm; safe to drop today since search is the sole user.
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
