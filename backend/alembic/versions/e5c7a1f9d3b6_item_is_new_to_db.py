"""items.is_new_to_db — DV8 "NEW DB" collection-tile chip (audit §9#25).

True when the add CREATED its catalogue entry (first contributor, the +50 XP
path). Backfill: the earliest item row per SKU whose owner is the catalogue
entry's submitter — the row that represented the contribution.

Revision ID: e5c7a1f9d3b6
Revises: b3f8e1d4c7a2
Create Date: 2026-09-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5c7a1f9d3b6"
down_revision: Union[str, None] = "b3f8e1d4c7a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "items",
        sa.Column("is_new_to_db", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute(
        """
        UPDATE items SET is_new_to_db = TRUE
        WHERE id IN (
            SELECT DISTINCT ON (i.sku) i.id
            FROM items i
            JOIN catalogue c ON c.sku = i.sku AND c.submitted_by = i.user_id
            ORDER BY i.sku, i.created_at ASC
        )
        """
    )


def downgrade() -> None:
    op.drop_column("items", "is_new_to_db")
