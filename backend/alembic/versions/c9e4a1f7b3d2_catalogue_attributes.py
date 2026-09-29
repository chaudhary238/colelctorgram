"""Catalogue attributes — ingest-only metadata (founder 2026-09-27).

Bulk ingestion from HLJ / TCGplayer / POP MART / etc. (ingestion/catalogue/) pulls
more than the catalogue columns hold: barcode, exact release date, grade (MG/HG/RG),
TCG language + set, manufacturer, source link, source price, extra photo URLs.
Founder call: STORE it, but never show it in the UI — so it lives in one nullable
JSONB column that no API serializer reads. One column, no index, NULL for every
existing and user-created row: storage cost is a few hundred bytes per ingested row.

Revision ID: c9e4a1f7b3d2
Revises: b2d8f4a6c1e7
Create Date: 2026-09-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "c9e4a1f7b3d2"
down_revision: Union[str, None] = "b2d8f4a6c1e7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("catalogue", sa.Column("attributes", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("catalogue", "attributes")
