## Why

DragonJobs currently displays a hardcoded job array in `App.tsx` with no way to refresh listings from real sources. To become a useful Philippine developer job board, the project needs an ingestion pipeline that fetches listings from external APIs, validates them, and persists them in a database — without yet changing the frontend.

## What Changes

- Add a `backend/` Node.js + TypeScript ingest service (CLI/cron), separate from the Vite frontend
- Introduce source adapters for **Kalibrr** (primary, PH-native) and **Remotive** (secondary, official remote API)
- Add a Zod-based DTO layer for mapping and runtime validation of external API responses
- Add SQLite schema (jobs, job_tags, job_sources) with Drizzle ORM and migrations
- Store database as local file (`backend/data/dragonjobs.db`) — no Docker required
- Add `npm run ingest` script to run the pipeline end-to-end
- Frontend remains unchanged in this change — hardcoded jobs stay until a future read API is wired

## Capabilities

### New Capabilities

- `job-ingest`: Pipeline orchestration — fetch from configured sources, validate via DTO, upsert to database, log summary
- `job-source-adapters`: Pluggable adapters for Kalibrr and Remotive with a shared `JobSourceAdapter` interface
- `job-storage`: SQLite schema, Drizzle models, migrations, and upsert logic with dedup on `(source, external_id)`

### Modified Capabilities

<!-- No existing spec requirements change in this phase; frontend still uses hardcoded jobs -->

## Impact

- **New code**: `backend/` package (ingest CLI, sources, DTO, DB layer)
- **New dependencies**: `drizzle-orm`, `drizzle-kit`, `zod`, `better-sqlite3` (backend only)
- **New infrastructure**: SQLite file database; optional `DATABASE_URL` override (defaults to `file:./data/dragonjobs.db`)
- **Unchanged**: `src/App.tsx`, frontend build pipeline, existing OpenSpec specs (`job-listing`, `search-filter`, etc.)
- **Risks**: Kalibrr uses undocumented endpoints (may break); Remotive requires attribution when listings are displayed (relevant in Phase 3)
