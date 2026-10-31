"""Admin console records (design "Scorred Admin Console").

AdminAction is the append-only audit log — every console decision writes one row,
and the overview's "Recent actions" / "Moderation this week" read from it. Appeals,
DataRequests and Announcements back the compliance + admin sections.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import UUID, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class AdminAction(Base):
    __tablename__ = "admin_actions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # e.g. community.approve | report.dismiss | user.suspend | data.delete — the
    # console renders a label from it; `kind` prefix drives the weekly stats.
    action: Mapped[str] = mapped_column(String(40), nullable=False)
    target_type: Mapped[str] = mapped_column(String(24), nullable=False)  # community | event | catalogue | report | user | appeal | data_request | announcement
    target_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    target_label: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # The affected account, when there is one — powers a user's history in the drawer.
    subject_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False, default="")
    note: Mapped[str | None] = mapped_column(Text, nullable=True)  # team-only
    meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        Index("idx_admin_actions_created", "created_at"),
        Index("idx_admin_actions_subject", "subject_user_id", "created_at"),
    )


class Appeal(Base):
    __tablename__ = "appeals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)  # appeal | grievance
    # What it's about, free text (e.g. "Warning · Spam") — the user may not know the action id.
    about: Mapped[str] = mapped_column(Text, nullable=False, default="")
    text: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="app")  # app | email
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="open")  # open | upheld | reversed | partially_reversed
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (Index("idx_appeals_status", "status", "created_at"),)


class DataRequest(Base):
    __tablename__ = "data_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    kind: Mapped[str] = mapped_column(String(16), nullable=False)  # delete | export
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="settings")  # settings | email
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="open")  # open | done | rejected
    completed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (Index("idx_data_requests_status", "status", "created_at"),)


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    audience: Mapped[str] = mapped_column(String(24), nullable=False)  # testers | quiet | never_logged_in | everyone
    channels: Mapped[list[str]] = mapped_column(ARRAY(String(16)), nullable=False, default=list)  # in_app | email
    recipients: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    emails_sent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sent_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
