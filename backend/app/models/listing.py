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


class Listing(Base):
    __tablename__ = "listings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=False)
    seller_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(64), nullable=True)

    price: Mapped[int] = mapped_column(Integer, nullable=False)  # minor units of `currency`
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)  # DV4-05: INR|USD|EUR|GBP|JPY|AED|SGD
    retail_price: Mapped[int] = mapped_column(Integer, default=0)
    condition: Mapped[str] = mapped_column(String(24), nullable=False)  # sealed_misb | mint | like_new | good | fair | for_parts
    condition_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    qty: Mapped[int] = mapped_column(Integer, default=1)
    trade_willing: Mapped[bool] = mapped_column(Boolean, default=False)

    ships_from_city: Mapped[str | None] = mapped_column(Text, nullable=True)
    ships_nationwide: Mapped[bool] = mapped_column(Boolean, default=True)
    shipping_cost: Mapped[int] = mapped_column(Integer, default=0)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    terms: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)

    status: Mapped[str] = mapped_column(String(16), default="available", nullable=False)  # available | reserved | sold | closed | removed (B-70 admin takedown)
    removed_reason: Mapped[str | None] = mapped_column(Text, nullable=True)  # B-70 — set when status="removed"
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    saves_count: Mapped[int] = mapped_column(Integer, default=0)
    # Public appreciation (taxonomy 2026-07-11: Heart = like on posts AND listings;
    # distinct from the private save bookmark).
    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    watching_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    __table_args__ = (
        Index("idx_listings_seller", "seller_id"),
        Index("idx_listings_sku", "sku"),
        Index("idx_listings_status", "status"),
        Index("idx_listings_created", "created_at"),
    )


class ListingSave(Base):
    __tablename__ = "listing_saves"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    listing_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class ListingLike(Base):
    """Public like on a listing (taxonomy 2026-07-11) — one per user per listing."""
    __tablename__ = "listing_likes"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    listing_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class ListingPriceVote(Base):
    """Anonymous 'is this price fair?' vote — one per user per listing (low|fair|high)."""
    __tablename__ = "listing_price_votes"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    listing_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    vote: Mapped[str] = mapped_column(String(8), nullable=False)  # low | fair | high
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class ListingQuestion(Base):
    """Public Q&A on a listing (ListingView v2) — anyone can ask, only the seller answers."""
    __tablename__ = "listing_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    asker_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        Index("idx_listing_questions_listing", "listing_id"),
    )
