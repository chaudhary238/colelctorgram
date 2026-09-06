"""DV8 design-parity pass — columns the v8 screens need (see .claude/DV8_DESIGN_GAPS.md).

- users.country + users.onboarded_at: v8 CityPicker stores city AND country
  (placeLabel renders "City, Country"); onboarded_at lets social sign-ins route
  through the wizard exactly once.
- events.address (+country): v8 splits "Venue name" from the full address
  ("Attendees see this exact address once they RSVP").
- posts.iso_city: ISO posts carry a city chip (cards already render it; the
  column never existed — founder-requested composer field).
- items.tcg_cert_no: v8's grading-details card collects a cert number
  ("Buyers can verify the slab on the grader's site"). tcg_grader also widens
  to hold a free-text "Other" grading company.

NEW revision (never extend an applied one — the a9d3f6c1e8b2 lesson).

Revision ID: b7e2c9d4f1a8
Revises: a9d3f6c1e8b2
Create Date: 2026-09-06
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7e2c9d4f1a8"
down_revision: Union[str, None] = "a9d3f6c1e8b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("country", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("onboarded_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("events", sa.Column("address", sa.Text(), nullable=True))
    op.add_column("events", sa.Column("country", sa.Text(), nullable=True))
    op.add_column("posts", sa.Column("iso_city", sa.Text(), nullable=True))
    op.add_column("items", sa.Column("tcg_cert_no", sa.String(32), nullable=True))
    op.alter_column("items", "tcg_grader", type_=sa.String(24))


def downgrade() -> None:
    op.alter_column("items", "tcg_grader", type_=sa.String(8))
    op.drop_column("items", "tcg_cert_no")
    op.drop_column("posts", "iso_city")
    op.drop_column("events", "country")
    op.drop_column("events", "address")
    op.drop_column("users", "onboarded_at")
    op.drop_column("users", "country")
