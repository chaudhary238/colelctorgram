import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    UUID, Boolean, DateTime, Integer, SmallInteger, String, Text,
    ForeignKey, Index, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id"), nullable=True)
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    seller_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    buyer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    agreed_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    deal_type: Mapped[str] = mapped_column(String(8), default="sale", nullable=False)  # sale | trade

    status: Mapped[str] = mapped_column(String(16), default="pending", nullable=False)  # pending | confirmed | cancelled
    initiated_by: Mapped[str] = mapped_column(String(8), nullable=False)  # seller | buyer
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    seller_rating: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    buyer_rating: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    seller_vouch_done: Mapped[bool] = mapped_column(Boolean, default=False)
    buyer_vouch_done: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    __table_args__ = (
        Index("idx_deals_seller", "seller_id"),
        Index("idx_deals_buyer", "buyer_id"),
        Index("idx_deals_listing", "listing_id"),
        Index("idx_deals_status", "status"),
    )


class Vouch(Base):
    __tablename__ = "vouches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    to_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    deal_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("deals.id"), nullable=True)
    kind: Mapped[str] = mapped_column(String(24), nullable=False)  # trade_vouch | social_endorsement
    rating: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        UniqueConstraint("from_user_id", "deal_id", name="uq_vouch_per_deal"),
        Index("idx_vouches_to_user", "to_user_id"),
        Index("idx_vouches_from_user", "from_user_id"),
    )
