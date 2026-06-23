"""Design feedback round 2 (DF-20/DF-21) — event create/manage fields.

Adds cover image, end time, and a "what to bring" note to events so the
user-facing EventCreate form and host EventManage edit can round-trip them.
All nullable, so the seed's raw inserts and existing rows are unaffected.

Revision ID: f1c7d4b8a902
Revises: e3b9c5a1f7d2
Create Date: 2026-06-22
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f1c7d4b8a902"
down_revision: Union[str, None] = "e3b9c5a1f7d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("events", sa.Column("cover_image_url", sa.Text(), nullable=True))
    op.add_column("events", sa.Column("bring", sa.Text(), nullable=True))
    op.add_column("events", sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("events", "ends_at")
    op.drop_column("events", "bring")
    op.drop_column("events", "cover_image_url")
