"""Drop ownership-verification + seller-tier columns (2026-07-18).

Ownership verification (Claimed/Shown/Verified) was removed as a product concept —
anyone can list, photos are plain uploads, no gate. The seller "tier" (Top Seller /
Trusted) was a static, underivable column (deals are off-platform) — trust is now the
vouch count. This drops all the now-dead columns:

- items.verify_tier          (+ index idx_items_verify)
- item_photos.is_verify_photo
- item_photos.is_challenge_shot   (verify challenge-shot flag, never used)
- users.tier
- users.verified_items_count

Chains off the current head a2d4f6c8e0b1.

Revision ID: b3e5d1a7c9f2
Revises: a2d4f6c8e0b1
Create Date: 2026-07-18
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b3e5d1a7c9f2"
down_revision: Union[str, None] = "a2d4f6c8e0b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("idx_items_verify", table_name="items")
    op.drop_column("items", "verify_tier")

    op.drop_column("item_photos", "is_verify_photo")
    op.drop_column("item_photos", "is_challenge_shot")

    op.drop_column("users", "tier")
    op.drop_column("users", "verified_items_count")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column("verified_items_count", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("tier", sa.String(32), nullable=False, server_default="verified"),
    )

    op.add_column(
        "item_photos",
        sa.Column("is_challenge_shot", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "item_photos",
        sa.Column("is_verify_photo", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.add_column(
        "items",
        sa.Column("verify_tier", sa.String(16), nullable=False, server_default="claimed"),
    )
    op.create_index("idx_items_verify", "items", ["verify_tier"])
