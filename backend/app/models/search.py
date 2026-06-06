import uuid
from datetime import datetime, timezone

from sqlalchemy import UUID, Boolean, DateTime, Integer, String, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class SavedSearch(Base):
    __tablename__ = "saved_searches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=True)
    sku: Mapped[str | None] = mapped_column(String(64), nullable=True)
    custom_query: Mapped[str | None] = mapped_column(Text, nullable=True)
    max_price: Mapped[int | None] = mapped_column(Integer, nullable=True)  # paise
    min_condition: Mapped[str | None] = mapped_column(String(24), nullable=True)
    alert_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        Index("idx_searches_user", "user_id"),
        Index("idx_searches_sku", "sku"),
    )
