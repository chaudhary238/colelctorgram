"""Design feedback round 1 (DF-05/06/08/10) — user gender/birth_year/feed_prefs,
email OTP columns, post tags.

Revision ID: c4f8a21d7e90
Revises: b91c3f2d5e80
Create Date: 2026-06-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB
from alembic import op

revision: str = "c4f8a21d7e90"
down_revision: Union[str, None] = "b91c3f2d5e80"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # DF-01/DF-05 — onboarding profile fields
    op.add_column("users", sa.Column("gender", sa.String(8), nullable=True))
    op.add_column("users", sa.Column("birth_year", sa.Integer(), nullable=True))
    # DF-08 — customize-feed prefs {"categories": [...], "hide_listings": bool}
    op.add_column("users", sa.Column("feed_prefs", JSONB(), nullable=True))
    # DF-06 / B-72 — email OTP confirmation
    op.add_column("users", sa.Column("email_otp_hash", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("email_otp_expires_at", sa.DateTime(timezone=True), nullable=True))
    # DF-10 — hashtag filter on posts
    op.add_column("posts", sa.Column("tags", sa.ARRAY(sa.Text()), nullable=False, server_default="{}"))
    op.create_index("idx_posts_tags", "posts", ["tags"], postgresql_using="gin")


def downgrade() -> None:
    op.drop_index("idx_posts_tags", table_name="posts")
    op.drop_column("posts", "tags")
    op.drop_column("users", "email_otp_expires_at")
    op.drop_column("users", "email_otp_hash")
    op.drop_column("users", "feed_prefs")
    op.drop_column("users", "birth_year")
    op.drop_column("users", "gender")
