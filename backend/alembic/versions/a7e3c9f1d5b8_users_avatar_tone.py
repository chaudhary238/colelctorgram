"""users.avatar_tone — v8 EditAvatarView colour picker (audit §9#33).

The 7-swatch PROFILE_COLORS picker needs somewhere to live; null keeps the
name-hash default the Avatar component already derives.

Revision ID: a7e3c9f1d5b8
Revises: f4b8d2e6a1c9
Create Date: 2026-09-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a7e3c9f1d5b8"
down_revision: Union[str, None] = "f4b8d2e6a1c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_tone", sa.String(16), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_tone")
