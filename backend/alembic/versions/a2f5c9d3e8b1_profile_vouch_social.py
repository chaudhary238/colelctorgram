"""Profile vouch system (DF-36a) — deal-independent social endorsements + requests.

v3's ProfileView turns vouches into a full peer-endorsement system:
  - give a vouch to anyone (no deal required) with a *relation* ("traded off-app",
    "met in person", "known from a community", …) + an optional note,
  - list vouches received / given,
  - request a vouch from people who know you.

The vouches table already supports deal-independent endorsements (deal_id is
nullable, kind='social_endorsement'); this adds the `relation` qualifier and a
small vouch_requests table for the "Request a vouch" flow. Presence reuses the
existing users.last_active_at column (no schema change).

Revision ID: a2f5c9d3e8b1
Revises: f1a3c8e2d5b9
Create Date: 2026-06-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "a2f5c9d3e8b1"
down_revision: Union[str, None] = "f1a3c8e2d5b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Relation qualifier for social endorsements (NULL for legacy trade_vouch rows).
    op.add_column("vouches", sa.Column("relation", sa.String(24), nullable=True))

    op.create_table(
        "vouch_requests",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        # requester asks target to vouch FOR the requester
        sa.Column("requester_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="pending"),  # pending | fulfilled | dismissed
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("requester_id", "target_id", name="uq_vouch_request"),
    )
    op.create_index("idx_vouch_requests_target", "vouch_requests", ["target_id"])


def downgrade() -> None:
    op.drop_index("idx_vouch_requests_target", table_name="vouch_requests")
    op.drop_table("vouch_requests")
    op.drop_column("vouches", "relation")
