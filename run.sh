#!/usr/bin/env bash
# CollectorHub — dev launcher
# Usage: ./run.sh [--no-docker] [--no-migrate] [--backend-only] [--frontend-only]
set -euo pipefail

# ── colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[1;33m'
CYN='\033[0;36m'; MAG='\033[0;35m'; BLD='\033[1m'; RST='\033[0m'
info()  { echo -e "${YLW}${BLD}[run]${RST}  $*"; }
ok()    { echo -e "${GRN}${BLD}[run]${RST}  $*"; }
err()   { echo -e "${RED}${BLD}[run]${RST}  $*" >&2; }

# ── flags ─────────────────────────────────────────────────────────────────────
SKIP_DOCKER=false; SKIP_MIGRATE=false
RUN_BACKEND=true;  RUN_FRONTEND=true
for arg in "$@"; do
  case $arg in
    --no-docker)       SKIP_DOCKER=true ;;
    --no-migrate)      SKIP_MIGRATE=true ;;
    --backend-only)    RUN_FRONTEND=false ;;
    --frontend-only)   RUN_BACKEND=false ;;
    *) err "Unknown flag: $arg"; exit 1 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$REPO_ROOT/backend"
FRONTEND="$REPO_ROOT/frontend"
VENV="$BACKEND/.venv"

# ── prerequisite checks ───────────────────────────────────────────────────────
need() { command -v "$1" &>/dev/null || { err "Required: $1 not found in PATH"; exit 1; }; }
need python3; need node; need npm
$SKIP_DOCKER || need docker

# ── Docker services ───────────────────────────────────────────────────────────
if ! $SKIP_DOCKER; then
  info "Starting Docker services (postgres, redis)…"
  docker compose -f "$BACKEND/docker-compose.yml" up -d --quiet-pull --remove-orphans

  info "Waiting for Postgres to be ready…"
  for i in $(seq 1 30); do
    docker compose -f "$BACKEND/docker-compose.yml" exec -T db \
      pg_isready -U postgres -q 2>/dev/null && break
    [ "$i" -eq 30 ] && { err "Postgres did not become ready in time."; exit 1; }
    sleep 1
  done
  ok "Postgres ready."
fi

# ── backend setup ─────────────────────────────────────────────────────────────
if $RUN_BACKEND; then
  # Create venv if missing
  if [ ! -f "$VENV/bin/python" ]; then
    info "Creating Python virtual environment…"
    python3 -m venv "$VENV"
  fi

  # Install / sync deps (fast if already up-to-date)
  info "Installing backend dependencies…"
  "$VENV/bin/pip" install -q -e "$BACKEND"

  # Create .env from defaults if not present
  if [ ! -f "$BACKEND/.env" ]; then
    info "Creating backend/.env with defaults (edit SECRET_KEY before production)…"
    cat > "$BACKEND/.env" <<'ENV'
app_env=development
app_debug=true
database_url=postgresql+asyncpg://postgres:postgres@localhost:5432/collectohub
sync_database_url=postgresql://postgres:postgres@localhost:5432/collectohub
redis_url=redis://localhost:6379/0
secret_key=dev-secret-change-in-production
access_token_expire_minutes=15
refresh_token_expire_days=30
frontend_url=http://localhost:3000
ENV
    ok "Created backend/.env"
  fi

  # Alembic migrations
  if ! $SKIP_MIGRATE; then
    info "Running Alembic migrations…"
    (cd "$BACKEND" && "$VENV/bin/alembic" upgrade head)
    ok "Migrations applied."
  fi
fi

# ── frontend setup ────────────────────────────────────────────────────────────
if $RUN_FRONTEND; then
  if [ ! -d "$FRONTEND/node_modules" ]; then
    info "Installing frontend dependencies (npm install)…"
    (cd "$FRONTEND" && npm install --silent)
  else
    info "Checking frontend dependencies (npm install --prefer-offline)…"
    (cd "$FRONTEND" && npm install --prefer-offline --silent)
  fi

  # Create .env.local if missing
  if [ ! -f "$FRONTEND/.env.local" ]; then
    info "Creating frontend/.env.local…"
    echo 'NEXT_PUBLIC_API_URL=http://localhost:8000/v1' > "$FRONTEND/.env.local"
    ok "Created frontend/.env.local"
  fi
fi

# ── process management ────────────────────────────────────────────────────────
PIDS=()

cleanup() {
  echo ""
  info "Shutting down…"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  ok "Done."
}
trap cleanup EXIT INT TERM

# prefix-tagger: adds a coloured label to every output line
tag_stream() {
  local label="$1" colour="$2"
  while IFS= read -r line; do
    echo -e "${colour}${BLD}[${label}]${RST} ${line}"
  done
}

# ── launch servers ────────────────────────────────────────────────────────────
if $RUN_BACKEND; then
  ok "Starting backend  →  http://localhost:8000  (docs: http://localhost:8000/docs)"
  (
    cd "$BACKEND"
    "$VENV/bin/uvicorn" app.main:app --reload --host 0.0.0.0 --port 8000
  ) 2>&1 | tag_stream "backend" "$CYN" &
  PIDS+=($!)
fi

if $RUN_FRONTEND; then
  ok "Starting frontend →  http://localhost:3000"
  (
    cd "$FRONTEND"
    npm run dev
  ) 2>&1 | tag_stream "frontend" "$MAG" &
  PIDS+=($!)
fi

echo ""
echo -e "${BLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
echo -e "  ${CYN}${BLD}Backend${RST}   http://localhost:8000"
echo -e "  ${CYN}${BLD}API Docs${RST}  http://localhost:8000/docs"
echo -e "  ${MAG}${BLD}Frontend${RST}  http://localhost:3000"
echo -e "${BLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RST}"
echo -e "  Press ${BLD}Ctrl+C${RST} to stop all services."
echo ""

wait
