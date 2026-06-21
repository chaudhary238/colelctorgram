"""Design feedback round 2 (DF-27) — community post approval status column.

Revision ID: e3b9c5a1f7d2
Revises: d7a2e1f9c3b1
Create Date: 2026-06-21
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e3b9c5a1f7d2"
down_revision: Union[str, None] = "d7a2e1f9c3b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # DF-27 — posts in approval-mode communities await mod review.
    # Existing posts are grandfathered to 'published'.
    op.add_column(
        "posts",
        sa.Column("status", sa.String(16), nullable=False, server_default="published"),
    )
    op.execute("UPDATE posts SET status = 'published'")
    op.alter_column("posts", "status", server_default=None)


def downgrade() -> None:
    op.drop_column("posts", "status")
