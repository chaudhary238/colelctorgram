"""DV6-13 — shared catalogue description.

A short blurb about the item itself (a shared fact, like title/brand), so picking an
existing entry in the add flow can pre-fill the description. Personal notes still live on
the user's Item; this seeds the field from the catalogue.

Revision ID: e7f2b3d9a1c4
Revises: d6e1a4f7c2b9
Create Date: 2026-07-07
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e7f2b3d9a1c4"
down_revision: Union[str, None] = "d6e1a4f7c2b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("catalogue", sa.Column("description", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("catalogue", "description")
