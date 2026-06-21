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
    # New rows default to 'pending'; existing communities are grandfathered to
    # 'approved' so the seeded directory stays visible. Drop the server_default
    # afterwards so the value is set explicitly by application code on create.
    op.add_column(
        "communities",
        sa.Column("status", sa.String(16), nullable=False, server_default="pending"),
    )
    op.execute("UPDATE communities SET status = 'approved'")
    op.alter_column("communities", "status", server_default=None)


def downgrade() -> None:
    op.drop_column("communities", "status")
