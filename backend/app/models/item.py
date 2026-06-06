import uuid
from datetime import datetime, date, timezone

from sqlalchemy import (
    UUID, Boolean, Date, DateTime, Integer, String, Text,
    ForeignKey, CheckConstraint, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(64), ForeignKey("catalogue.sku"), nullable=True)
    custom_title: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(16), default="owned", nullable=False)  # owned | wishlist | preorder
    verify_tier: Mapped[str] = mapped_column(String(16), default="claimed", nullable=False)  # claimed | shown | verified
    value: Mapped[int] = mapped_column(Integer, default=0)  # paise
    is_listed: Mapped[bool] = mapped_column(Boolean, default=False)
    photo_count: Mapped[int] = mapped_column(Integer, default=0)

    preorder_ordered_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    preorder_eta: Mapped[str | None] = mapped_column(Text, nullable=True)
    wishlist_alert_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    privacy: Mapped[str] = mapped_column(String(16), default="public")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    photos: Mapped[list["ItemPhoto"]] = relationship("ItemPhoto", back_populates="item", lazy="select")

    __table_args__ = (
        CheckConstraint("sku IS NOT NULL OR custom_title IS NOT NULL", name="items_has_identity"),
        Index("idx_items_user", "user_id"),
        Index("idx_items_sku", "sku"),
        Index("idx_items_status", "status"),
        Index("idx_items_verify", "verify_tier"),
    )


class ItemPhoto(Base):
    __tablename__ = "item_photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    phash: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_verify_photo: Mapped[bool] = mapped_column(Boolean, default=False)
    is_challenge_shot: Mapped[bool] = mapped_column(Boolean, default=False)
    watermarked: Mapped[bool] = mapped_column(Boolean, default=False)
    is_duplicate_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    item: Mapped["Item"] = relationship("Item", back_populates="photos")

    __table_args__ = (
        Index("idx_photos_item", "item_id"),
    )
