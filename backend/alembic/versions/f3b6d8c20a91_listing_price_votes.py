"""Listing price-fairness votes (ListingView v2) — anonymous low/fair/high.

One vote per user per listing; the seller only ever sees the aggregate split.
Chains off the item-category migration.

Revision ID: f3b6d8c20a91
Revises: e7c2f4a9b1d8
Create Date: 2026-06-23
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f3b6d8c20a91"
down_revision: Union[str, None] = "e7c2f4a9b1d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "listing_price_votes",
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("listing_id", sa.UUID(as_uuid=True), sa.ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("vote", sa.String(8), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("listing_price_votes")
