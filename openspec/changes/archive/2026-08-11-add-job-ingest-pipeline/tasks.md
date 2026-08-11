## 1. Infrastructure Setup

- [x] 1.1 Scaffold `backend/` package with its own `package.json`, `tsconfig.json`, and ESM config
- [x] 1.2 Install backend dependencies: `drizzle-orm`, `drizzle-kit`, `zod`, `better-sqlite3`
- [x] 1.3 Add backend scripts: `ingest`, `db:generate`, `db:migrate`
- [x] 1.4 Add `backend/data/` to `.gitignore` for SQLite file

## 2. Database Layer

- [x] 2.1 Define Drizzle schema for `job_sources`, `jobs`, and `job_tags` tables per design (SQLite dialect)
- [x] 2.2 Create `backend/src/db/client.ts` with SQLite connection from `DATABASE_URL` (default `file:./data/dragonjobs.db`)
- [x] 2.3 Generate and apply initial SQL migration (`0001_init.sql`)
- [x] 2.4 Seed `job_sources` with `kalibrr` and `remotive` rows (migration or startup seed)
- [x] 2.5 Implement `backend/src/db/upsert.ts` — insert/update jobs and replace tags on conflict

## 3. DTO Layer

- [x] 3.1 Create `backend/src/dto/job.dto.ts` with `JobIngestDto`, `WorkArrangement`, and `IngestBatch` Zod schemas
- [x] 3.2 Export inferred TypeScript types from Zod schemas

## 4. Source Adapters

- [x] 4.1 Define `JobSourceAdapter` interface and `IngestQuery` type in `backend/src/sources/types.ts`
- [x] 4.2 Implement Remotive adapter (`backend/src/sources/remotive.ts`) — fetch, map fields, handle errors
- [x] 4.3 Implement Kalibrr adapter (`backend/src/sources/kalibrr.ts`) — paginated search, field mapping, work arrangement mapping
- [x] 4.4 Add env var support: `INGEST_KEYWORDS`, `KALIBRR_MAX_PAGES`, `REMOTIVE_CATEGORY`

## 5. Ingest Pipeline

- [x] 5.1 Implement orchestrator in `backend/src/pipeline/ingest.ts` — iterate adapters, validate, upsert, collect stats
- [x] 5.2 Implement CLI entry in `backend/src/index.ts` — resolve database path, run pipeline, log summary, exit codes
- [x] 5.3 Log per-source and total counts (fetched, valid, skipped, upserted) on completion
- [x] 5.4 Skip invalid records with logged Zod errors without aborting the batch

## 6. Verification & Documentation

- [x] 6.1 Run migrations locally and confirm `backend/data/dragonjobs.db` is created
- [x] 6.2 Run `npm run ingest` end-to-end and verify rows in `jobs` and `job_tags` tables
- [x] 6.3 Document setup in README: SQLite file path, optional `DATABASE_URL`, ingest command, env vars
- [x] 6.4 Confirm frontend `npm run build` still passes (no frontend changes in this change)
