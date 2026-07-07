"""DV6-05 — referral SCOR-codes + pending-referral link.

Adds two nullable columns to users:
- users.referral_code — a stable SCOR-XXXXX share code, generated lazily on first
                        access (nullable so existing / seed accounts keep working).
- users.referred_by   — the inviter's user id, recorded at signup. The +150 XP
                        credit fires on the invitee's first collection item
                        (services/gamification.resolve_referral), not at signup.

Both nullable → the seed's raw inserts need no changes. Chains off the current
head f7d2a9c1e4b8.

Revision ID: a1b2c6d7e8f9
Revises: f7d2a9c1e4b8
Create Date: 2026-07-06
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c6d7e8f9"
down_revision: Union[str, None] = "f7d2a9c1e4b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("referral_code", sa.String(16), nullable=True))
    op.add_column("users", sa.Column("referred_by", sa.UUID(as_uuid=True), nullable=True))
    op.create_unique_constraint("uq_users_referral_code", "users", ["referral_code"])


def downgrade() -> None:
    op.drop_constraint("uq_users_referral_code", "users", type_="unique")
    op.drop_column("users", "referred_by")
    op.drop_column("users", "referral_code")
