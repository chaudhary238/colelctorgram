"""Design feedback round 2 (DF-17) — AddListing item detail fields.

Adds brand / scale / release_year / description to items so the web AddListing
form can capture an item that has no catalogue match and surface real specs on
its listing. All nullable, so the seed's raw inserts and existing rows are
unaffected.

Revision ID: c4f8a1d2b6e3
Revises: a3e8f1c6b4d5
Create Date: 2026-06-22
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c4f8a1d2b6e3"
down_revision: Union[str, None] = "a3e8f1c6b4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("items", sa.Column("brand", sa.Text(), nullable=True))
    op.add_column("items", sa.Column("scale", sa.Text(), nullable=True))
    op.add_column("items", sa.Column("release_year", sa.Integer(), nullable=True))
    op.add_column("items", sa.Column("description", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("items", "description")
    op.drop_column("items", "release_year")
    op.drop_column("items", "scale")
    op.drop_column("items", "brand")
