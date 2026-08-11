# DragonJobs Backend (Job Ingest)

CLI ingest pipeline: fetch jobs from Kalibrr + Remotive, validate with Zod, upsert into SQLite.

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

Fetches from Remotive and Kalibrr, validates each record, upserts into `jobs` / `job_tags`.

## Environment

| Variable | Required | Default |
|---|---|---|
| `DATABASE_URL` | No | `file:./data/dragonjobs.db` |
| `INGEST_KEYWORDS` | No | `developer,software engineer,devops` |
| `KALIBRR_MAX_PAGES` | No | `5` |
| `REMOTIVE_CATEGORY` | No | `software-dev` |

Examples:

```bash
DATABASE_URL=file:./data/custom.db npm run ingest
INGEST_KEYWORDS=frontend,react KALIBRR_MAX_PAGES=2 npm run ingest
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Apply migrations + seed `job_sources` |
| `npm run ingest` | Run full ingest pipeline |

## Notes

- Remotive listings require attribution when shown in UI (link + credit).
- Kalibrr uses undocumented search endpoints; treat as MVP/dev data source.
- Frontend still uses hardcoded jobs; this package does not serve an HTTP API yet.
