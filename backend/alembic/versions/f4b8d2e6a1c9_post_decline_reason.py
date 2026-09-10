"""post_communities decline columns — v8 decline-with-reason loop (audit §7#21/#36).

Rejecting a community post used to DELETE the routing row (and orphan-clean the
post). v8 keeps declined posts visible to the AUTHOR with the mod's reason until
dismissed, so the row now carries status='declined' + reason instead of vanishing.

Revision ID: f4b8d2e6a1c9
Revises: e5c7a1f9d3b6
Create Date: 2026-09-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f4b8d2e6a1c9"
down_revision: Union[str, None] = "e5c7a1f9d3b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("post_communities", sa.Column("decline_reason", sa.Text(), nullable=True))
    op.add_column("post_communities", sa.Column("declined_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("post_communities", "declined_at")
    op.drop_column("post_communities", "decline_reason")
