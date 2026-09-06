import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    UUID, Boolean, DateTime, Integer, String, Text,
    ForeignKey, Index, ARRAY,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class Community(Base):
    __tablename__ = "communities"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # short slug: 'itm', 'lego'
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_desc: Mapped[str | None] = mapped_column(Text, nullable=True)
    tag: Mapped[str | None] = mapped_column(String(4), nullable=True)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    tone: Mapped[str] = mapped_column(String(16), default="plum")
    # DV8 — create/manage flow gains real imagery (banner + square photo).
    banner_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    founder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    member_count: Mapped[int] = mapped_column(Integer, default=0)
    post_count: Mapped[int] = mapped_column(Integer, default=0)
    post_mode: Mapped[str] = mapped_column(String(16), default="open")  # open | approval
    rules: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    is_invite_only: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin_created: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending | approved | rejected
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class CommunityMember(Base):
    __tablename__ = "community_members"

    community_id: Mapped[str] = mapped_column(String(32), ForeignKey("communities.id"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    role: Mapped[str] = mapped_column(String(16), default="member")  # member | mod | founder ("founder" DISPLAYS as "Admin" everywhere — DV8)
    # DV8 approval gate — new members join as 'pending' and cannot post/comment/act
    # until a mod/admin approves them. Pre-DV8 rows were backfilled 'approved'.
    status: Mapped[str] = mapped_column(String(16), default="approved", nullable=False)  # pending | approved
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        # "Your communities" tab + created-vs-joined sections are user-led; the
        # (community_id, user_id) pkey can't serve them (migration a1b4d7e9c2f5).
        Index("idx_community_members_user", "user_id"),
    )


class CommunityJoinRequest(Base):
    __tablename__ = "community_join_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    community_id: Mapped[str] = mapped_column(String(32), ForeignKey("communities.id"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending | approved | rejected
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        # DV8 gated all joins through this table: "your pending request" runs per
        # community page view, the approval queue per manage view (a1b4d7e9c2f5).
        Index("idx_cjr_user", "user_id", "status"),
        Index("idx_cjr_community", "community_id", "status"),
    )


class CommunityMemberRemoval(Base):
    """DV8 — removing a member requires a reason, and the reason is kept.
    Audit-only table: read by admins, never shown to the removed member."""
    __tablename__ = "community_member_removals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    community_id: Mapped[str] = mapped_column(String(32), ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    removed_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        Index("idx_member_removals_community", "community_id"),
    )
