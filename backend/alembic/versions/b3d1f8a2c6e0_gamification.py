"""Gamification — Collector XP ledger, lifetime xp cache, season badges (BRD v1.4 §8.12).

Adds:
- users.xp           — denormalized lifetime Collector XP (monotonic).
- xp_events          — append-only XP ledger; partial-unique (user, action, ref_id)
                       enforces dedup / once-per-day check-in.
- season_badges      — permanent leaderboard-cycle badges (seeded in Phase 1).

Chains off the current head a2f5c9d3e8b1.

Revision ID: b3d1f8a2c6e0
Revises: a2f5c9d3e8b1
Create Date: 2026-06-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b3d1f8a2c6e0"
down_revision: Union[str, None] = "a2f5c9d3e8b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("xp", sa.Integer(), nullable=False, server_default="0"))

    op.create_table(
        "xp_events",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action", sa.String(32), nullable=False),
        sa.Column("dimension", sa.String(16), nullable=False, server_default="none"),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("ref_type", sa.String(32), nullable=True),
        sa.Column("ref_id", sa.String(64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index(
        "uq_xp_events_dedup", "xp_events", ["user_id", "action", "ref_id"],
        unique=True, postgresql_where=sa.text("ref_id IS NOT NULL"),
    )
    op.create_index("idx_xp_events_user_created", "xp_events", ["user_id", "created_at"])
    op.create_index("idx_xp_events_dim_created", "xp_events", ["dimension", "created_at"])

    op.create_table(
        "season_badges",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tier", sa.String(12), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("period", sa.String(24), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("bonus_xp", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("awarded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_season_badges_user", "season_badges", ["user_id"])


def downgrade() -> None:
    op.drop_index("idx_season_badges_user", table_name="season_badges")
    op.drop_table("season_badges")
    op.drop_index("idx_xp_events_dim_created", table_name="xp_events")
    op.drop_index("idx_xp_events_user_created", table_name="xp_events")
    op.drop_index("uq_xp_events_dedup", table_name="xp_events")
    op.drop_table("xp_events")
    op.drop_column("users", "xp")
