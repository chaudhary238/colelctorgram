#!/usr/bin/env bash
#
# migrate_qa.sh — apply Alembic migrations (→ head) against the QA Neon DB.
#
# Same Alembic revisions as local (one history) — only the target DB differs.
# On a normal deploy Render runs `alembic upgrade head` automatically via the
# Dockerfile CMD; use THIS script to migrate/seed Neon by hand from a laptop
# (Render's free tier has no shell). See .claude/QA_DEPLOY.md.
#
# Resolves the QA DATABASE_URL from, in order:
#   1) first CLI arg (a full postgres URL)
#   2) $QA_DATABASE_URL
#   3) `database_url=` in backend/.prod.env   (git-ignored secrets file)
#
# Neon gotchas baked in (from QA_DEPLOY.md):
#   - force the `+asyncpg` driver (env.py only rewrites `postgresql://`, NOT the
#     shorter `postgres://` → without this you get ModuleNotFoundError: psycopg2)
#   - require `?ssl=require` (asyncpg rejects `sslmode=`; that is the #1 gotcha)
#   - warn on a `-pooler` host (PgBouncer breaks asyncpg prepared statements —
#     use Neon's DIRECT connection string)
#
# Usage:
#   ./migrate_qa.sh                                   # URL from .prod.env / env
#   ./migrate_qa.sh 'postgresql+asyncpg://…neon…?ssl=require'
#   ./migrate_qa.sh --seed                            # migrate, then seed Neon
#   QA_DATABASE_URL='…' ./migrate_qa.sh --seed
#
set -euo pipefail
cd "$(dirname "$0")"

# shellcheck disable=SC1091
source .venv/bin/activate 2>/dev/null || true

SEED=0
URL=""
for a in "$@"; do
  case "$a" in
    --seed) SEED=1 ;;
    postgres*://*) URL="$a" ;;
    *) echo "Unknown arg: $a" >&2; exit 2 ;;
  esac
done

# Resolve the URL if not passed as an arg.
if [[ -z "$URL" ]]; then
  URL="${QA_DATABASE_URL:-}"
fi
if [[ -z "$URL" && -f .prod.env ]]; then
  # Take the value of `database_url=` (case-insensitive), strip quotes/CR.
  URL="$(grep -iE '^[[:space:]]*database_url[[:space:]]*=' .prod.env | tail -1 | cut -d= -f2- | tr -d '"'"'"'\r' | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
fi
if [[ -z "$URL" ]]; then
  echo "✗ No QA DATABASE_URL. Pass it as an arg, set QA_DATABASE_URL, or add database_url= to backend/.prod.env" >&2
  exit 1
fi

# ── Normalize for asyncpg + SSL ──────────────────────────────────────────────
# postgres:// or postgresql:// → postgresql+asyncpg://
URL="$(printf '%s' "$URL" | sed -E 's#^postgres(ql)?://#postgresql+asyncpg://#')"
# asyncpg rejects sslmode= — convert to ssl=
URL="$(printf '%s' "$URL" | sed -E 's/([?&])sslmode=/\1ssl=/')"
# Ensure an SSL param is present (Neon needs it).
if [[ "$URL" != *"ssl="* ]]; then
  [[ "$URL" == *"?"* ]] && URL="${URL}&ssl=require" || URL="${URL}?ssl=require"
fi

mask() { sed -E 's#://[^:/@]+:[^@]+@#://***:***@#'; }
echo "→ QA migrate target: $(printf '%s' "$URL" | mask)"

if [[ "$URL" == *"-pooler."* ]]; then
  echo "⚠ Host looks like a Neon POOLER (-pooler) — PgBouncer breaks asyncpg prepared" >&2
  echo "  statements. Use Neon's DIRECT connection string instead. Continuing anyway…" >&2
fi

read -r -p "Apply migrations to QA (Neon)? [y/N] " ok
[[ "$ok" == "y" || "$ok" == "Y" ]] || { echo "Aborted."; exit 1; }

export DATABASE_URL="$URL"
# Do NOT force APP_ENV=production here: alembic imports app.config, whose
# production guard (config.py _guard_production) would then demand R2 creds +
# a strong SECRET_KEY + a non-local DB — none of which a migration needs. The
# migration only uses DATABASE_URL (env.py reads it directly); leave app_env at
# its .env/dev default so Settings() loads without the guard.

alembic upgrade head
echo "✓ alembic upgrade head complete (QA/Neon)"

if [[ "$SEED" == "1" ]]; then
  echo "→ Seeding QA data on Neon…"
  python seed_dev_data.py
  python seed_social_graph.py
  echo "✓ Seed complete (QA/Neon)"
fi
