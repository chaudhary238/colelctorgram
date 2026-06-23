"""AddListing category (MarketView v2 filter) — persist the item's category.

User-created items have no catalogue match, so without this the listing's
category is null and the market category filter / card chip can't see them.
Nullable so the seed's raw inserts and existing rows are unaffected.

Revision ID: e7c2f4a9b1d8
Revises: d5a9b3e1c742
Create Date: 2026-06-23
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e7c2f4a9b1d8"
down_revision: Union[str, None] = "d5a9b3e1c742"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("items", sa.Column("category", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("items", "category")
