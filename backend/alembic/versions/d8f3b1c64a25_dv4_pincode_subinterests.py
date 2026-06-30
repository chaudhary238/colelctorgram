"""DV4 alignment — event pincode resolver + onboarding sub-interests (TODO M20 DV4-07b / DV4-06).

Adds (productionising design_v4):
- events.pincode        — 6-digit PIN; the client resolves it to a canonical city
                          (dedup Bengaluru/Bangalore, Gurugram/Gurgaon, …) before submit (DV4-07b).
- users.sub_interests   — per-category sub-interest chips from onboarding step 2
                          ({"figures": ["Hot Toys", ...], "tcg": ["Pokémon"], ...}) (DV4-06).

Chains off the current head c7e2a9f4d310 (DV4 preorder/TCG/currency).

Revision ID: d8f3b1c64a25
Revises: c7e2a9f4d310
Create Date: 2026-06-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d8f3b1c64a25"
down_revision: Union[str, None] = "c7e2a9f4d310"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("events", sa.Column("pincode", sa.String(length=6), nullable=True))
    op.add_column("users", sa.Column("sub_interests", postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "sub_interests")
    op.drop_column("events", "pincode")
