from sqlalchemy import Integer, String, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class City(Base):
    """Canonical city list backing every CityField (onboarding, events, edit profile).

    A fed list, not free text: typo'd and inconsistently-spelled cities
    ("Bangalore" / "Bengaluru" / "banglore") fragment every location filter,
    meetup search and shipping estimate. Server-side (vs the old frontend
    constant) so new cities are a DB insert, not a frontend deploy. Seed rows
    ship in migration f2d5e8b1c6a7.
    """

    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    region: Mapped[str | None] = mapped_column(String(80), nullable=True)
    country: Mapped[str] = mapped_column(String(80), nullable=False)
    # Comma-separated lowercase alternate names ("bombay", "blr") — searchable,
    # never stored as a user's value.
    aliases: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # Empty-query default ordering: highest first, id breaks ties. Only the major
    # metros carry a non-zero value.
    popularity: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    __table_args__ = (
        UniqueConstraint("name", "country", name="uq_city_name_country"),
        Index("idx_cities_popularity", "popularity"),
    )
