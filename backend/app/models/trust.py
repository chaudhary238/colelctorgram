import uuid
from datetime import datetime, timezone

from sqlalchemy import UUID, DateTime, String, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class UserBlock(Base):
    __tablename__ = "user_blocks"

    blocker_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    blocked_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # NULL for system auto-flags (source="system", e.g. a price anomaly).
    reporter_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    source: Mapped[str] = mapped_column(String(16), default="user", nullable=False, server_default="user")  # user | system
    target_type: Mapped[str] = mapped_column(String(16), nullable=False)  # user | post | listing | comment | catalogue | message
    target_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    # DV6-13 — string-keyed targets (e.g. a catalogue SKU) use target_ref instead of target_id.
    target_ref: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending | reviewed | actioned | dismissed
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution: Mapped[str | None] = mapped_column(String(24), nullable=True)  # dismiss | remove | warn | suspend | ban
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        Index("idx_reports_status", "status", "created_at"),
        Index("idx_reports_target", "target_type", "target_id"),
    )
