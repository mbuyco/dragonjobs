# DragonJobs Backend (Job Ingest + API)

CLI ingest pipeline: fetch jobs from Kalibrr + Remotive, validate with Zod, append new rows into SQLite. HTTP read API serves jobs to the frontend.

## Setup

```bash
cd backend
npm install
npm run db:migrate
```

Creates SQLite file at `backend/data/dragonjobs.db` (gitignored).

## Ingest

```bash
npm run ingest
```

Each run:

1. **TTL cleanup** — hard-deletes jobs whose `synced_at` is older than `JOB_TTL_HOURS` (default 24)
2. **Fetch** — Remotive and Kalibrr search APIs
3. **Filter** — Kalibrr skips inactive listings (visibility, expired application window, hidden company) and jobs with no buildable apply URL
4. **Insert** — append-only: new `(source, externalId)` only; existing rows left unchanged

No HTTP apply-URL probing. Kalibrr apply links are built from API fields (`apply_redirect_url` or company-scoped path).

## API Server

```bash
npm run serve
```

Starts HTTP server on port 3001 (override with `PORT`). Endpoints:

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/jobs` | List jobs with tags |

## Local Dev (two terminals)

**Terminal 1 — backend API:**

```bash
cd backend
npm run db:migrate
npm run ingest    # optional, populate data
npm run serve
```

**Terminal 2 — frontend:**

```bash
npm run dev
```

Vite proxies `/api` to `http://localhost:3001`.

## Environment

| Variable | Required | Default |
|---|---|---|
| `DATABASE_URL` | No | `file:./data/dragonjobs.db` |
| `PORT` | No | `3001` |
| `INGEST_KEYWORDS` | No | `developer,software engineer,devops` |
| `KALIBRR_MAX_PAGES` | No | `5` |
| `REMOTIVE_CATEGORY` | No | `software-dev` |
| `JOB_TTL_HOURS` | No | `24` |

Examples:

```bash
DATABASE_URL=file:./data/custom.db npm run ingest
INGEST_KEYWORDS=frontend,react KALIBRR_MAX_PAGES=2 npm run ingest
JOB_TTL_HOURS=12 npm run ingest
PORT=4000 npm run serve
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Apply migrations + seed `job_sources` |
| `npm run ingest` | Run full ingest pipeline |
| `npm run serve` | Start HTTP read API |

## Notes

- Remotive listings require attribution when shown in UI (link + credit).
- Kalibrr uses undocumented search endpoints; treat as MVP/dev data source.
- Board lifetime is driven by `synced_at` (when we ingested), not source posting dates. Cron ~every 3h for fetch; `JOB_TTL_HOURS` controls full wipe age.
