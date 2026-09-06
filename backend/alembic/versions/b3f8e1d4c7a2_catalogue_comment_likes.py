"""Catalogue-comment likes — v8 Cards.jsx :356 per-comment hearts.

Post comments have had likes since the comment system shipped; the catalogue
entry thread (DV8-18) launched without them. This was the last flagged gap from
the 2026-09-06 db-page audit (.claude/DV8_DB_AUDIT.md).

Revision ID: b3f8e1d4c7a2
Revises: a1b4d7e9c2f5
Create Date: 2026-09-06
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "b3f8e1d4c7a2"
down_revision: Union[str, None] = "a1b4d7e9c2f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "catalogue_comment_likes",
        sa.Column("comment_id", UUID(as_uuid=True), sa.ForeignKey("catalogue_comments.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("catalogue_comment_likes")
