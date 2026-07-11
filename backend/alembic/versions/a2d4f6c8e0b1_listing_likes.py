"""Listing likes (taxonomy 2026-07-11) — Heart = public like on posts AND listings.

The old market heart was SAVE; save moved to the Bookmark and the Heart returns
as a real like: `listing_likes` table + `listings.likes_count` counter.

Revision ID: a2d4f6c8e0b1
Revises: f8a1c3e5d720
Create Date: 2026-07-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a2d4f6c8e0b1"
down_revision: Union[str, None] = "f8a1c3e5d720"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("listings", sa.Column("likes_count", sa.Integer(), nullable=False, server_default="0"))
    op.create_table(
        "listing_likes",
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("listing_id", sa.UUID(as_uuid=True), sa.ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("listing_likes")
    op.drop_column("listings", "likes_count")
