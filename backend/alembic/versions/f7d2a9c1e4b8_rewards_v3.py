"""Rewards & Badge System v3 — First Start badges + drop XP dimension.

v3 simplifies gamification to two badge types (First Start + XP/Season) and removes
the 4-way contribution/archetype mix. Schema changes:
- users.first_start_badge   — permanent, manually-assigned badge (founding /
                              early_believer / pioneer), NULL for standard users.
- xp_events.dimension        — DROPPED (archetype mix removed). Its supporting
                              index idx_xp_events_dim_created is replaced by
                              idx_xp_events_action_created (backs per-day caps).

Season badges of the removed contribution boards (kind in posts/social/collection/
market) are pruned so the trophy case only shows weekly-league badges.

Chains off the current head e4a7c2f9b8d1.

Revision ID: f7d2a9c1e4b8
Revises: e4a7c2f9b8d1
Create Date: 2026-07-03
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f7d2a9c1e4b8"
down_revision: Union[str, None] = "e4a7c2f9b8d1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # First Start badge (v3 §6.1)
    op.add_column("users", sa.Column("first_start_badge", sa.String(16), nullable=True))

    # Drop the contribution-dimension column + its index (archetype mix removed).
    op.drop_index("idx_xp_events_dim_created", table_name="xp_events")
    op.drop_column("xp_events", "dimension")
    # (action, created_at) backs the per-day cap count query (v3 §7).
    op.create_index("idx_xp_events_action_created", "xp_events", ["action", "created_at"])

    # Prune contribution-board season badges + their banked-bonus ledger rows.
    op.execute(
        "DELETE FROM xp_events WHERE action = 'badge' AND ref_id IN "
        "(SELECT id::text FROM season_badges WHERE kind IN "
        "('posts','social','collection','market'))"
    )
    op.execute(
        "DELETE FROM season_badges WHERE kind IN ('posts','social','collection','market')"
    )


def downgrade() -> None:
    op.add_column(
        "xp_events",
        sa.Column("dimension", sa.String(16), nullable=False, server_default="none"),
    )
    op.drop_index("idx_xp_events_action_created", table_name="xp_events")
    op.create_index("idx_xp_events_dim_created", "xp_events", ["dimension", "created_at"])
    op.drop_column("users", "first_start_badge")
