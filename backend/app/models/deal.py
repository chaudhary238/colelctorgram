import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    UUID, DateTime, SmallInteger, String, Text,
    ForeignKey, Index, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


# The Deal model was retired in v6 (DV6-07): deals move off-platform and trust is
# carried by vouches. Vouch / VouchRequest remain the trust primitives.


class Vouch(Base):
    __tablename__ = "vouches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    to_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    kind: Mapped[str] = mapped_column(String(24), nullable=False)  # trade_vouch | social_endorsement
    # How the voucher knows them (social endorsements only; NULL for trade_vouch).
    # app | offapp | person | community | friend | request  (DF-36a)
    relation: Mapped[str | None] = mapped_column(String(24), nullable=True)
    rating: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    # No DB-level uniqueness: the give-vouch endpoint dedups social endorsements in
    # code (select-then-update). The old uq_vouch_per_deal was dropped with deals.
    __table_args__ = (
        Index("idx_vouches_to_user", "to_user_id"),
        Index("idx_vouches_from_user", "from_user_id"),
    )


class VouchRequest(Base):
    """A request from `requester` asking `target` to vouch for the requester (DF-36a).

    Independent of any deal — anyone can ask collectors who know them. One row per
    (requester, target); the target is notified and can fulfil it by giving a vouch.
    """
    __tablename__ = "vouch_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending | fulfilled | dismissed
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        UniqueConstraint("requester_id", "target_id", name="uq_vouch_request"),
        Index("idx_vouch_requests_target", "target_id"),
    )
