"""DV4 alignment — pre-order financial layer, TCG spec, multi-currency (BRD v1.4 / TODO M20).

Adds (productionising design_v4):
- items.value_currency               — currency of the estimated value / "what you paid" (DV4-05).
- items.tcg_* (language/product_type/graded/grader/grade) — Trading Cards spec (DV4-01).
- items.preorder_window_precision / preorder_seller / preorder_total / preorder_deposit
                                       — pre-order financial + calendar layer (DV4-03).
- listings.currency                  — per-listing currency (DV4-05).
- Seeds the Phase-1 TCG catalogue (DV4-01a): Pokémon, One Piece, Yu-Gi-Oh!, MTG,
  Digimon, Dragon Ball Super, Weiss Schwarz.

Chains off the current head b3d1f8a2c6e0 (gamification).

Revision ID: c7e2a9f4d310
Revises: b3d1f8a2c6e0
Create Date: 2026-06-28
"""
from datetime import datetime, timezone
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c7e2a9f4d310"
down_revision: Union[str, None] = "b3d1f8a2c6e0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Phase-1 TCG launch catalogue (DV4-01a). (sku, title, brand, year, est_retail_price paise)
SEED_TCG_CATALOGUE = [
    ("SKU-TCG-001", "Pokémon SV 151 Booster Box (EN)", "The Pokémon Company", "2023", 1500000),
    ("SKU-TCG-002", "Pokémon Scarlet & Violet Elite Trainer Box (EN)", "The Pokémon Company", "2023", 450000),
    ("SKU-TCG-003", "One Piece TCG OP-01 Romance Dawn Booster Box (EN)", "Bandai (One Piece TCG)", "2023", 1200000),
    ("SKU-TCG-004", "Yu-Gi-Oh! 25th Anniversary Tin (EN)", "Konami (Yu-Gi-Oh!)", "2023", 350000),
    ("SKU-TCG-005", "MTG The Lord of the Rings Collector Booster Box", "Wizards of the Coast (MTG)", "2023", 3500000),
    ("SKU-TCG-006", "Digimon TCG BT-14 Blast Ace Booster Box (EN)", "Bandai (Digimon TCG)", "2023", 900000),
    ("SKU-TCG-007", "Dragon Ball Super TCG Zenkai Series Booster Box", "Bandai (Dragon Ball Super TCG)", "2023", 800000),
    ("SKU-TCG-008", "Weiss Schwarz Hololive Production Booster Box (JP)", "Bushiroad (Weiss Schwarz)", "2023", 600000),
]


def upgrade() -> None:
    # ── items: estimated-value currency ───────────────────────────────
    op.add_column("items", sa.Column("value_currency", sa.String(length=3), nullable=False, server_default="INR"))

    # ── items: TCG spec ───────────────────────────────────────────────
    op.add_column("items", sa.Column("tcg_language", sa.String(length=8), nullable=True))
    op.add_column("items", sa.Column("tcg_product_type", sa.Text(), nullable=True))
    op.add_column("items", sa.Column("tcg_graded", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("items", sa.Column("tcg_grader", sa.String(length=8), nullable=True))
    op.add_column("items", sa.Column("tcg_grade", sa.String(length=8), nullable=True))

    # ── items: pre-order financial + calendar layer ───────────────────
    op.add_column("items", sa.Column("preorder_window_precision", sa.String(length=8), nullable=True))
    op.add_column("items", sa.Column("preorder_seller", sa.Text(), nullable=True))
    op.add_column("items", sa.Column("preorder_total", sa.Integer(), nullable=True))
    op.add_column("items", sa.Column("preorder_deposit", sa.Integer(), nullable=True))

    # ── listings: per-listing currency ────────────────────────────────
    op.add_column("listings", sa.Column("currency", sa.String(length=3), nullable=False, server_default="INR"))

    # ── seed the Phase-1 TCG catalogue ────────────────────────────────
    now = datetime.now(timezone.utc)
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
                "category": "tcg",
                "scale": None,
                "year": year,
                "tone": "ink",
                "est_retail_price": price,
                "is_approved": True,
                "created_at": now,
                "updated_at": now,
            }
            for sku, title, brand, year, price in SEED_TCG_CATALOGUE
        ],
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "DELETE FROM catalogue WHERE sku IN ({})".format(
                ", ".join(f"'{row[0]}'" for row in SEED_TCG_CATALOGUE)
            )
        )
    )
    op.drop_column("listings", "currency")
    op.drop_column("items", "preorder_deposit")
    op.drop_column("items", "preorder_total")
    op.drop_column("items", "preorder_seller")
    op.drop_column("items", "preorder_window_precision")
    op.drop_column("items", "tcg_grade")
    op.drop_column("items", "tcg_grader")
    op.drop_column("items", "tcg_graded")
    op.drop_column("items", "tcg_product_type")
    op.drop_column("items", "tcg_language")
    op.drop_column("items", "value_currency")
