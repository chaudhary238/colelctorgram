"""Design feedback round 2 (DF EventDetail v2) — Going/Interested RSVP split.

The new EventDetail is Facebook-style: an attendee is either "going" or
"interested" (no tickets/QR). Add event_interests.status + an events.going_count
counter alongside the existing interested_count. Existing RSVP rows (all of which
were the single "interested" toggle = a commitment to attend) become "going", and
each event's old interested_count is reinterpreted as its going_count.

Revision ID: a3e8f1c6b4d5
Revises: f1c7d4b8a902
Create Date: 2026-06-22
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a3e8f1c6b4d5"
down_revision: Union[str, None] = "f1c7d4b8a902"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # server_default keeps raw/seed inserts working; ORM/set_rsvp set it explicitly.
    op.add_column("event_interests", sa.Column("status", sa.String(16), nullable=False, server_default="going"))
    op.add_column("events", sa.Column("going_count", sa.Integer(), nullable=False, server_default="0"))
    # Existing RSVPs were attend commitments → "going"; carry the old count across.
    op.execute("UPDATE events SET going_count = interested_count, interested_count = 0")


def downgrade() -> None:
    op.execute("UPDATE events SET interested_count = going_count")
    op.drop_column("events", "going_count")
    op.drop_column("event_interests", "status")
