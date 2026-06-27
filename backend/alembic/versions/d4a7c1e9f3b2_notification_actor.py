"""Notification actor (DF-32) — who triggered the notification.

Adds notifications.actor_id (nullable FK → users.id, ON DELETE SET NULL) so the
v3 notification row can show the actor's avatar + @handle. NULL for system
notifications (wishlist match, pre-order reminder). Nullable with no backfill,
so existing rows / the seed's raw inserts are unaffected. Chains off the
compose-iso-multicommunity head.

Revision ID: d4a7c1e9f3b2
Revises: c3f9d2a16b40
Create Date: 2026-06-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4a7c1e9f3b2"
down_revision: Union[str, None] = "c3f9d2a16b40"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("notifications", sa.Column("actor_id", sa.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_notifications_actor_id_users", "notifications", "users",
        ["actor_id"], ["id"], ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_notifications_actor_id_users", "notifications", type_="foreignkey")
    op.drop_column("notifications", "actor_id")
