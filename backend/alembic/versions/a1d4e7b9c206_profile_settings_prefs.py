"""Profile settings (DF-23) — per-type notification + extra privacy prefs.

Adds two nullable JSONB columns on users:
  notif_prefs   — 8 per-type notification toggles
  privacy_prefs — messaging / wishlist visibility / show-online
Both nullable (no server_default) so the seed's raw user inserts keep working;
the app fills sensible defaults on read. Chains off the price-votes head.

Revision ID: a1d4e7b9c206
Revises: f3b6d8c20a91
Create Date: 2026-06-23
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "a1d4e7b9c206"
down_revision: Union[str, None] = "f3b6d8c20a91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("notif_prefs", postgresql.JSONB(), nullable=True))
    op.add_column("users", sa.Column("privacy_prefs", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "privacy_prefs")
    op.drop_column("users", "notif_prefs")
