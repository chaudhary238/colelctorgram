"""admin console: audit log, appeals, data requests, announcements, moderation state

Revision ID: e8c3a5d1f7b2
Revises: d1b7e4a2c9f6
Create Date: 2026-10-31 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "e8c3a5d1f7b2"
down_revision: Union[str, None] = "d1b7e4a2c9f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    uuid = postgresql.UUID(as_uuid=True)
    ts = sa.DateTime(timezone=True)

    op.create_table(
        "admin_actions",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("actor_id", uuid, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(40), nullable=False),
        sa.Column("target_type", sa.String(24), nullable=False),
        sa.Column("target_id", sa.String(64), nullable=True),
        sa.Column("target_label", sa.Text(), nullable=False, server_default=""),
        sa.Column("subject_user_id", uuid, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False, server_default=""),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("meta", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", ts, nullable=True),
    )
    op.create_index("idx_admin_actions_created", "admin_actions", ["created_at"])
    op.create_index("idx_admin_actions_subject", "admin_actions", ["subject_user_id", "created_at"])

    op.create_table(
        "appeals",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("user_id", uuid, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("about", sa.Text(), nullable=False, server_default=""),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("source", sa.String(16), nullable=False, server_default="app"),
        sa.Column("status", sa.String(24), nullable=False, server_default="open"),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("resolved_by", uuid, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("resolved_at", ts, nullable=True),
        sa.Column("created_at", ts, nullable=True),
    )
    op.create_index("idx_appeals_status", "appeals", ["status", "created_at"])

    op.create_table(
        "data_requests",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("user_id", uuid, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("source", sa.String(16), nullable=False, server_default="settings"),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="open"),
        sa.Column("completed_by", uuid, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("completed_at", ts, nullable=True),
        sa.Column("created_at", ts, nullable=True),
    )
    op.create_index("idx_data_requests_status", "data_requests", ["status", "created_at"])

    op.create_table(
        "announcements",
        sa.Column("id", uuid, primary_key=True),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("audience", sa.String(24), nullable=False),
        sa.Column("channels", postgresql.ARRAY(sa.String(16)), nullable=False, server_default="{}"),
        sa.Column("recipients", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("emails_sent", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("sent_by", uuid, sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", ts, nullable=True),
    )

    op.add_column("users", sa.Column("strikes", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("warned_at", ts, nullable=True))
    op.add_column("users", sa.Column("suspended_until", ts, nullable=True))
    op.add_column("users", sa.Column("suspension_reason", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("banned_at", ts, nullable=True))
    op.add_column("users", sa.Column("ban_requested_by", uuid, nullable=True))
    op.add_column("users", sa.Column("ban_reason", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("admin_role", sa.String(16), nullable=True))
    # Pre-role staff accounts become owners.
    op.execute("UPDATE users SET admin_role = 'owner' WHERE is_admin")

    op.alter_column("reports", "reporter_id", existing_type=uuid, nullable=True)
    op.add_column("reports", sa.Column("source", sa.String(16), nullable=False, server_default="user"))
    op.add_column("reports", sa.Column("resolved_at", ts, nullable=True))
    op.add_column("reports", sa.Column("resolution", sa.String(24), nullable=True))

    for table in ("communities", "events"):
        op.add_column(table, sa.Column("review_reason", sa.Text(), nullable=True))
        # Beta auto-approval: live without review → stays in the admin queue until reviewed_at.
        op.add_column(table, sa.Column("auto_approved", sa.Boolean(), nullable=False, server_default=sa.false()))
        op.add_column(table, sa.Column("reviewed_at", ts, nullable=True))


def downgrade() -> None:
    for table in ("events", "communities"):
        for col in ("reviewed_at", "auto_approved", "review_reason"):
            op.drop_column(table, col)
    op.drop_column("reports", "resolution")
    op.drop_column("reports", "resolved_at")
    op.drop_column("reports", "source")
    op.execute("DELETE FROM reports WHERE reporter_id IS NULL")
    op.alter_column("reports", "reporter_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)
    for col in ("admin_role", "ban_reason", "ban_requested_by", "banned_at", "suspension_reason",
                "suspended_until", "warned_at", "strikes"):
        op.drop_column("users", col)
    op.drop_table("announcements")
    op.drop_index("idx_data_requests_status", table_name="data_requests")
    op.drop_table("data_requests")
    op.drop_index("idx_appeals_status", table_name="appeals")
    op.drop_table("appeals")
    op.drop_index("idx_admin_actions_subject", table_name="admin_actions")
    op.drop_index("idx_admin_actions_created", table_name="admin_actions")
    op.drop_table("admin_actions")
