"""Drop the dormant image-dedup columns (phash / watermark) — 2026-07-18.

The pHash-dedup + watermark subsystem (B-58/B-59/B-60) never shipped — the only
code was a `phash_and_watermark` stub that was never scheduled or called, and the
backing columns were never read or written. Removed as dead weight:

- item_photos.phash
- item_photos.watermarked
- item_photos.is_duplicate_flag

Chains off b3e5d1a7c9f2 (ownership-verification + tier drop).

Revision ID: c4f6e2b8d0a3
Revises: b3e5d1a7c9f2
Create Date: 2026-07-18
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c4f6e2b8d0a3"
down_revision: Union[str, None] = "b3e5d1a7c9f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("item_photos", "phash")
    op.drop_column("item_photos", "watermarked")
    op.drop_column("item_photos", "is_duplicate_flag")


def downgrade() -> None:
    op.add_column("item_photos", sa.Column("phash", sa.Text(), nullable=True))
    op.add_column(
        "item_photos",
        sa.Column("watermarked", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "item_photos",
        sa.Column("is_duplicate_flag", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
