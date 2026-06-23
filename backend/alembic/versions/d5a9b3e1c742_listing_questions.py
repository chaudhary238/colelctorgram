"""Listing Q&A (ListingView v2) — public ask-the-seller questions.

Adds the listing_questions table: anyone can ask a question on a listing,
only the seller answers. Chains off the AddListing item-fields migration.

Revision ID: d5a9b3e1c742
Revises: c4f8a1d2b6e3
Create Date: 2026-06-23
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d5a9b3e1c742"
down_revision: Union[str, None] = "c4f8a1d2b6e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "listing_questions",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("listing_id", sa.UUID(as_uuid=True), sa.ForeignKey("listings.id", ondelete="CASCADE"), nullable=False),
        sa.Column("asker_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=True),
        sa.Column("answered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_listing_questions_listing", "listing_questions", ["listing_id"])


def downgrade() -> None:
    op.drop_index("idx_listing_questions_listing", table_name="listing_questions")
    op.drop_table("listing_questions")
