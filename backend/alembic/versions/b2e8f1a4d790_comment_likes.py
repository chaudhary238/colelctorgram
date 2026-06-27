"""Comment likes (DF-29b) — per-user like state for comments.

Adds the comment_likes association table (user_id + comment_id composite PK),
mirroring post_likes. The comments.likes_count column already exists; the
like-toggle endpoint maintains it. No data backfill needed (new table only),
so the seed's raw inserts are unaffected. Chains off the profile-settings head.

Revision ID: b2e8f1a4d790
Revises: a1d4e7b9c206
Create Date: 2026-06-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2e8f1a4d790"
down_revision: Union[str, None] = "a1d4e7b9c206"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "comment_likes",
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("comment_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["comment_id"], ["comments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "comment_id"),
    )


def downgrade() -> None:
    op.drop_table("comment_likes")
