"""Admin takedown columns (B-70) — 2026-07-20.

Soft-remove support for the admin moderation loop:

- posts.removed_reason      (posts already soft-remove via status="removed")
- listings.removed_reason   (listings gain status="removed" as a value; no schema change needed for status)
- comments.is_removed + comments.removed_reason (comments had no removal state at all)

Chains off c4f6e2b8d0a3 (drop phash/watermark columns).

Revision ID: a9d4e7f1c3b6
Revises: c4f6e2b8d0a3
Create Date: 2026-07-20
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a9d4e7f1c3b6"
down_revision: Union[str, None] = "c4f6e2b8d0a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("posts", sa.Column("removed_reason", sa.Text(), nullable=True))
    op.add_column("listings", sa.Column("removed_reason", sa.Text(), nullable=True))
    # server_default so existing rows and the seed's raw inserts stay valid
    op.add_column("comments", sa.Column("is_removed", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("comments", sa.Column("removed_reason", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("comments", "removed_reason")
    op.drop_column("comments", "is_removed")
    op.drop_column("listings", "removed_reason")
    op.drop_column("posts", "removed_reason")
