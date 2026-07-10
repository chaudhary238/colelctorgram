"""Poll votes — one locked vote per user per poll post.

Backs the feed/detail poll block: once a user votes they can't switch, and their
choice is reflected back on reload (my_poll_vote). Chains off the catalogue-
description head.

Revision ID: f8a1c3e5d720
Revises: e7f2b3d9a1c4
Create Date: 2026-07-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f8a1c3e5d720"
down_revision: Union[str, None] = "e7f2b3d9a1c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "poll_votes",
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("post_id", sa.UUID(as_uuid=True), sa.ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("option_index", sa.SmallInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("poll_votes")
