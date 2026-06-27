"""Event reminders (BL-10 / DF-35) — per-user "remind me before it starts".

v3's EventDetail has a bell that opts the viewer into a pre-start reminder,
independent of their RSVP. This adds the persistence for that toggle: one row
per (event, user) who tapped the bell. The send_event_reminders worker
(in-process asyncio, hourly) reads these rows and emits a Notification before
the event starts, deduped via Notification.kind so a missed tick is harmless.

Mirrors event_interests (composite PK, cascade on both FKs).

Revision ID: f1a3c8e2d5b9
Revises: e5b8c2d4a9f1
Create Date: 2026-06-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "f1a3c8e2d5b9"
down_revision: Union[str, None] = "e5b8c2d4a9f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "event_reminders",
        sa.Column("event_id", sa.UUID(as_uuid=True), sa.ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("event_reminders")
