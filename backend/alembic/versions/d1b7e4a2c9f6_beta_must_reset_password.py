"""beta: users.must_reset_password

Closed-beta accounts are provisioned with a team-issued password and must set
their own on first login (see scripts/provision_beta_users.py).

Revision ID: d1b7e4a2c9f6
Revises: c9e4a1f7b3d2
Create Date: 2026-10-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d1b7e4a2c9f6"
down_revision: Union[str, None] = "c9e4a1f7b3d2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("must_reset_password", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("users", "must_reset_password")
