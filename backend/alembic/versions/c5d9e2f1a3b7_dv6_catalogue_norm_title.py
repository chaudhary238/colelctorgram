"""DV6-12 — catalogue de-dup: norm_title column + trigram index (central-DB matching).

Backs the "search-first, resolve-or-create" add flow: a normalized title column
(lowercased, accent-folded, punctuation→space, collapsed) that both the fuzzy
`/catalogue/search` ranking and the server-side write guard compare against.

pg_trgm is already enabled (see e4a7c2f9b8d1). We add `unaccent` for the one-time
backfill so pre-existing rows fold accents the same way the app's Python
`norm_title()` does (NFKD + strip combining marks). New/updated rows get their
norm_title from the app.

Revision ID: c5d9e2f1a3b7
Revises: b2c3d7e8f9a0
Create Date: 2026-07-06
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c5d9e2f1a3b7"
down_revision: Union[str, None] = "b2c3d7e8f9a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("catalogue", sa.Column("norm_title", sa.Text(), nullable=True))
    # Backfill existing rows to match the app's norm_title(): lower + accent-fold +
    # any run of non-alphanumerics → single space + trim.
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")
    op.execute(
        r"UPDATE catalogue "
        r"SET norm_title = btrim(regexp_replace(lower(unaccent(title)), '[^a-z0-9]+', ' ', 'g'))"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_trgm_catalogue_norm_title "
        "ON catalogue USING gin (norm_title gin_trgm_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_trgm_catalogue_norm_title")
    op.drop_column("catalogue", "norm_title")
    # Leave the pg_trgm / unaccent extensions in place — other features may rely on them.
