"""Design feedback round 2 (DF-18) — community review queue status column.

Revision ID: d7a2e1f9c3b1
Revises: c4f8a21d7e90
Create Date: 2026-06-21
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d7a2e1f9c3b1"
down_revision: Union[str, None] = "c4f8a21d7e90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # DF-18 — user-created communities go through admin review.
    # The DB server_default is 'approved' so raw/seed inserts (which omit the
    # column) and any pre-existing rows stay visible; the ORM create path
    # (create_community) sets status explicitly to 'pending' for user-created
    # communities, so the review queue still works.
    op.add_column(
        "communities",
        sa.Column("status", sa.String(16), nullable=False, server_default="approved"),
    )


def downgrade() -> None:
    op.drop_column("communities", "status")
