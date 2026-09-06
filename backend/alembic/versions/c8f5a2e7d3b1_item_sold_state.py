"""Item sold state — v8's sold treatment needs sold items to EXIST.

Until now a sale erased the item (DELETE /items/{id}?reason=sold), so the v8
item-page sold state (grayscale card, "Your copy — sold", undo-sold) had nothing
to render. `sold_at` keeps the copy on the shelf as history; `sold_price` is
optional (future price-history stats). Undo = null both.

Revision ID: c8f5a2e7d3b1
Revises: b7e2c9d4f1a8
Create Date: 2026-09-06
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c8f5a2e7d3b1"
down_revision: Union[str, None] = "b7e2c9d4f1a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("items", sa.Column("sold_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("items", sa.Column("sold_price", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("items", "sold_price")
    op.drop_column("items", "sold_at")
