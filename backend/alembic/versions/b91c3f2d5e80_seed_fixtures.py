"""seed fixtures

Revision ID: b91c3f2d5e80
Revises: a45e6da406df
Create Date: 2026-06-06 20:00:00.000000

"""
from typing import Sequence, Union
import uuid
from datetime import datetime, timezone

import bcrypt
from alembic import op
import sqlalchemy as sa

revision: str = "b91c3f2d5e80"
down_revision: Union[str, None] = "a45e6da406df"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def _now() -> datetime:
    return datetime.now(timezone.utc)


SEED_USERS = [
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000001"),
        "handle": "collectohub_admin",
        "name": "CollectorHub",
        "email": "admin@collectohub.app",
        "password_hash": _hash("Ch@ngeMeN0w!"),
        "bio": "Official CollectorHub account.",
        "tier": "verified",
        "is_admin": True,
        "is_seed_account": True,
        "interests": ["figures", "designer", "kits", "diecast"],
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000002"),
        "handle": "figurehead",
        "name": "Figurehead",
        "email": "figurehead@collectohub.app",
        "password_hash": _hash("seed_pass_1!"),
        "bio": "Action figure collector since 2008. Hot Toys & MAFEX enthusiast.",
        "city": "Mumbai",
        "tier": "verified",
        "is_seed_account": True,
        "interests": ["figures"],
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000003"),
        "handle": "blindbox_queen",
        "name": "Blindbox Queen",
        "email": "blindbox@collectohub.app",
        "password_hash": _hash("seed_pass_2!"),
        "bio": "Popmart & Kennyswork obsessed. 300+ blind boxes opened.",
        "city": "Bangalore",
        "tier": "verified",
        "is_seed_account": True,
        "interests": ["designer"],
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000004"),
        "handle": "brickmaster",
        "name": "Brickmaster",
        "email": "brickmaster@collectohub.app",
        "password_hash": _hash("seed_pass_3!"),
        "bio": "LEGO Technic & UCS sets. Also into Bandai HG/MG gunpla.",
        "city": "Delhi",
        "tier": "verified",
        "is_seed_account": True,
        "interests": ["kits"],
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000005"),
        "handle": "diecast_dreams",
        "name": "Diecast Dreams",
        "email": "diecast@collectohub.app",
        "password_hash": _hash("seed_pass_4!"),
        "bio": "Hot Wheels RLC & Tomica Limited Vintage collector. 1:64 forever.",
        "city": "Pune",
        "tier": "verified",
        "is_seed_account": True,
        "interests": ["diecast"],
    },
]

# Scale is written with a FORWARD SLASH — `1/6`, `1/64` — never a colon (Change Spec §5).
# A colon-form value would not group with its slash-form siblings in the Database's scale
# filter. (`Mezco One:12` below is a product line name, not a scale.)
SEED_CATALOGUE = [
    # Action Figures
    ("SKU-FIG-001", "Hot Toys MMS - Iron Man Mark LXXXV", "Hot Toys", "figures", "1/6", "2019", 3200000),
    ("SKU-FIG-002", "MAFEX No.147 - Spider-Man (Comic Ver.)", "Medicom Toy", "figures", "1/12", "2021", 850000),
    ("SKU-FIG-003", "S.H.Figuarts - Goku Ultra Instinct", "Bandai", "figures", "1/12", "2022", 650000),
    ("SKU-FIG-004", "Mezco One:12 - Batman (Ascending Knight)", "Mezco", "figures", "1/12", "2020", 950000),
    # Designer Toys & Blind Boxes
    ("SKU-DSN-001", "Popmart - Labubu The Monsters Series 1", "Popmart", "designer", None, "2022", 89900),
    ("SKU-DSN-002", "Kennyswork - Molly Mini Figure", "Kennyswork", "designer", None, "2021", 350000),
    ("SKU-DSN-003", "Popmart - Skullpanda Everyday Wonderland", "Popmart", "designer", None, "2023", 119900),
    ("SKU-DSN-004", "Kaws - Companion (Open Edition) Vinyl", "Kaws", "designer", None, "2020", 1200000),
    # Model Kits & Lego
    ("SKU-KIT-001", "LEGO Icons - Eiffel Tower (10307)", "LEGO", "kits", None, "2023", 4499900),
    ("SKU-KIT-002", "LEGO Technic - Bugatti Chiron (42151)", "LEGO", "kits", None, "2023", 3999900),
    ("SKU-KIT-003", "Bandai MG 1/100 - Wing Gundam EW Ver.", "Bandai", "kits", "1/100", "2020", 450000),
    ("SKU-KIT-004", "Bandai RG 1/144 - Nu Gundam", "Bandai", "kits", "1/144", "2019", 320000),
    # Diecast
    ("SKU-DCS-001", "Hot Wheels RLC - '69 COPO Camaro (Red)", "Hot Wheels", "diecast", "1/64", "2023", 300000),
    ("SKU-DCS-002", "Tomica Limited Vintage - TLV Toyota 2000GT", "Tomytec", "diecast", "1/64", "2022", 450000),
    ("SKU-DCS-003", "Matchbox Collectors - '70 Dodge Charger", "Matchbox", "diecast", "1/64", "2023", 89900),
    ("SKU-DCS-004", "AutoArt - Lamborghini Urus Pearl White", "AutoArt", "diecast", "1/18", "2021", 2200000),
]


def upgrade() -> None:
    conn = op.get_bind()

    # Idempotent — skip if seed data already present
    existing = conn.execute(
        sa.text("SELECT COUNT(*) FROM users WHERE is_seed_account = true")
    ).scalar()
    if existing and existing > 0:
        return

    now = _now()

    # Insert seed users
    # op.bulk_insert does NOT apply SQLAlchemy model defaults — every NOT NULL
    # column must be supplied explicitly.
    users_table = sa.table(
        "users",
        sa.column("id", sa.UUID),
        sa.column("handle", sa.Text),
        sa.column("name", sa.Text),
        sa.column("email", sa.Text),
        sa.column("password_hash", sa.Text),
        sa.column("bio", sa.Text),
        sa.column("city", sa.Text),
        sa.column("tier", sa.String),
        sa.column("deals_count", sa.Integer),
        sa.column("rating", sa.Numeric),
        sa.column("rating_count", sa.Integer),
        sa.column("active_listings_count", sa.Integer),
        sa.column("portfolio_value", sa.Integer),
        sa.column("verified_items_count", sa.Integer),
        sa.column("followers_count", sa.Integer),
        sa.column("following_count", sa.Integer),
        sa.column("privacy_portfolio", sa.String),
        sa.column("privacy_value", sa.String),
        sa.column("is_admin", sa.Boolean),
        sa.column("is_seed_account", sa.Boolean),
        sa.column("is_suspended", sa.Boolean),
        sa.column("interests", sa.ARRAY(sa.Text)),
        sa.column("email_verified", sa.Boolean),
        sa.column("joined_at", sa.DateTime(timezone=True)),
        sa.column("last_active_at", sa.DateTime(timezone=True)),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    op.bulk_insert(
        users_table,
        [
            {
                "id": u["id"],
                "handle": u["handle"],
                "name": u["name"],
                "email": u["email"],
                "password_hash": u["password_hash"],
                "bio": u.get("bio"),
                "city": u.get("city"),
                "tier": u["tier"],
                "deals_count": 0,
                "rating": 0,
                "rating_count": 0,
                "active_listings_count": 0,
                "portfolio_value": 0,
                "verified_items_count": 0,
                "followers_count": 0,
                "following_count": 0,
                "privacy_portfolio": "public",
                "privacy_value": "followers",
                "is_admin": u.get("is_admin", False),
                "is_seed_account": True,
                "is_suspended": False,
                "interests": u.get("interests", []),
                "email_verified": True,
                "joined_at": now,
                "last_active_at": now,
                "created_at": now,
                "updated_at": now,
            }
            for u in SEED_USERS
        ],
    )

    # Insert catalogue items
    catalogue_table = sa.table(
        "catalogue",
        sa.column("sku", sa.String),
        sa.column("title", sa.Text),
        sa.column("brand", sa.Text),
        sa.column("category", sa.String),
        sa.column("scale", sa.String),
        sa.column("year", sa.String),
        sa.column("tone", sa.String),
        sa.column("est_retail_price", sa.Integer),
        sa.column("is_approved", sa.Boolean),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    op.bulk_insert(
        catalogue_table,
        [
            {
                "sku": sku,
                "title": title,
                "brand": brand,
                "category": category,
                "scale": scale,
                "year": year,
                "tone": "ink",
                "est_retail_price": price,
                "is_approved": True,
                "created_at": now,
                "updated_at": now,
            }
            for sku, title, brand, category, scale, year, price in SEED_CATALOGUE
        ],
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("DELETE FROM users WHERE is_seed_account = true"))
    conn.execute(
        sa.text(
            "DELETE FROM catalogue WHERE sku IN ({})".format(
                ", ".join(f"'{row[0]}'" for row in SEED_CATALOGUE)
            )
        )
    )
