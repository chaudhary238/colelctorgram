"""DV6-13 P1 — catalogue images + light moderation foundation.

Shared-library / private-shelf image model:
  • item_photos.is_public — a personal photo defaults PRIVATE; opting in ("share to
    catalogue") flips this true so it can back the shared reference image.
  • catalogue.is_official — admin-blessed entries wear an "Official" badge (a badge, not
    a gate); everything else is community-contributed and live by default.
  • catalogue.status — reactive moderation: 'live' (default) | 'removed'. No pre-approval.
  • reports.target_ref + nullable target_id — the generic Report model keys targets by
    UUID; catalogue entries are keyed by string SKU, so add a string ref and relax target_id.

Revision ID: d6e1a4f7c2b9
Revises: c5d9e2f1a3b7
Create Date: 2026-07-07
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "d6e1a4f7c2b9"
down_revision: Union[str, None] = "c5d9e2f1a3b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("item_photos", sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.false()))
    # Existing photos were effectively public (shown on profiles/detail) — preserve that so
    # the new private-by-default only applies to photos uploaded from here on.
    op.execute("UPDATE item_photos SET is_public = true")
    op.add_column("catalogue", sa.Column("is_official", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("catalogue", sa.Column("status", sa.String(length=16), nullable=False, server_default="live"))
    op.add_column("reports", sa.Column("target_ref", sa.String(length=64), nullable=True))
    op.alter_column("reports", "target_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)
    # Admin-seeded / already-approved entries are the "Official" set going forward.
    op.execute("UPDATE catalogue SET is_official = true WHERE is_approved = true AND submitted_by IS NULL")
    op.create_index("idx_catalogue_status", "catalogue", ["status"])


def downgrade() -> None:
    op.drop_index("idx_catalogue_status", table_name="catalogue")
    op.alter_column("reports", "target_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)
    op.drop_column("reports", "target_ref")
    op.drop_column("catalogue", "status")
    op.drop_column("catalogue", "is_official")
    op.drop_column("item_photos", "is_public")
