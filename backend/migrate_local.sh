#!/usr/bin/env bash
#
# migrate_local.sh — apply Alembic migrations (→ head) against the LOCAL dev DB.
#
# The migration REVISIONS are the same for local and QA (one Alembic history);
# only the target DATABASE_URL differs. This script targets local; migrate_qa.sh
# targets the Neon QA DB. Never create a second/duplicate revision file per env —
# that forks Alembic history and breaks `upgrade head`.
#
# Usage:
#   ./migrate_local.sh            # upgrade head only
#   ./migrate_local.sh --seed     # upgrade head, then reseed dev data
#
set -euo pipefail
cd "$(dirname "$0")"

# Activate the venv if present (no-op when already active / not using venv).
# shellcheck disable=SC1091
source .venv/bin/activate 2>/dev/null || true

# Default to the docker-compose local Postgres unless DATABASE_URL is already set.
: "${DATABASE_URL:=postgresql+asyncpg://postgres:postgres@localhost:5432/collectohub}"
export DATABASE_URL

mask() { sed -E 's#://[^:/@]+:[^@]+@#://***:***@#'; }
echo "→ LOCAL migrate target: $(printf '%s' "$DATABASE_URL" | mask)"

alembic upgrade head
echo "✓ alembic upgrade head complete (local)"

if [[ "${1:-}" == "--seed" ]]; then
  echo "→ Reseeding dev data…"
  python seed_dev_data.py
  python seed_social_graph.py
  echo "✓ Reseed complete (local)"
fi
