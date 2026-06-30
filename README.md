# CollectorHub

A community-first social platform for collectors — showcase, discover, connect, and trade peer-to-peer. Instagram-meets-marketplace for hobby collectors (action figures, designer toys & blind boxes, model kits & Lego, diecast).

## Structure

```
colelctorgram/
├── frontend/        # Next.js (App Router) web app + admin console
├── backend/         # FastAPI (Python) API — REST + WebSocket
├── design_v3/       # v3 "New frontend" design — full LOCAL mirror (read off disk; no MCP). See design_v3/README.md
└── .claude/         # Project notes, tech-stack decisions, history (gitignored)
```

> The Expo mobile app is **Phase 2** — not in this repo yet.

## Stack

| Layer | Choice |
|---|---|
| Web + Admin | Next.js 16 (App Router, TypeScript, Tailwind) |
| Backend | Python + FastAPI + SQLAlchemy 2.0 (async) + Alembic |
| Database | PostgreSQL |
| Media | Cloudflare R2 (presigned upload) |
| Search | PostgreSQL `ILIKE` (no external search service in Phase 1) |
| Realtime | FastAPI WebSocket, in-process manager (single instance) |
| Background jobs | `asyncio` periodic tasks (no Redis/broker in Phase 1) |

No Redis, ARQ, or Meilisearch in Phase 1 — see [Decisions Log](.claude/DECISIONS.md) for the rationale and when to add them back.

## Local development

Requires `python3`, `node`, `npm`, and `docker`.

```bash
./run.sh                 # docker (postgres) + migrate + backend (:8000) + frontend (:3000)
./run.sh --backend-only  # API only
./run.sh --frontend-only # web only
./run.sh --no-docker     # use an external Postgres
```

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.local` (set `NEXT_PUBLIC_API_URL`). Seed login after migrations: `figurehead@collectohub.app / seed_pass_1!`.

## Deployment

- **Backend** → Railway (Singapore region) via [backend/Dockerfile](backend/Dockerfile); managed Postgres plugin in the same region. `railway.toml` runs `alembic upgrade head` then starts uvicorn.
- **Frontend** → Cloudflare Pages (set `NEXT_PUBLIC_API_URL` to the Railway URL).
- **Media** → Cloudflare R2.

Set `APP_ENV=production` plus a strong `SECRET_KEY`, `DATABASE_URL`, `FRONTEND_URL`, and R2 credentials — the backend **refuses to start** in production with insecure defaults. Target cost ~$10–20/month through early Phase 1. Full plan and migration path (to an in-country Mumbai VPS later) in the [Decisions Log](.claude/DECISIONS.md).

## Docs

- [Project Overview](.claude/PROJECT.md)
- [Tech Stack](.claude/TECH_STACK.md)
- [Architecture](.claude/ARCHITECTURE.md)
- [Database Design](.claude/DATABASE.md)
- [Decisions Log](.claude/DECISIONS.md)
- [Implementation TODO](.claude/TODO.md)

## Status

**Phase 1 — web app + admin console built** (real API, mock removed). Deploy-ready (Dockerfile + Railway config + production guards). Remaining before public launch: backend test suite + CI. See [TODO](.claude/TODO.md). Mobile app is Phase 2; payments/livestream/ML are Phase 3.
