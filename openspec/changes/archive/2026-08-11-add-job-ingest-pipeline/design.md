## Context

DragonJobs is a static React 19 SPA with hardcoded jobs in `src/App.tsx`. There is no backend, database, or data fetching. The ADR-001 analysis identified Kalibrr (undocumented JSON API, excellent PH coverage) and Remotive (official public API, global remote) as the best free sources for a Philippine-focused developer job board.

This change introduces a standalone `backend/` ingest service that runs as a CLI, keeping the frontend untouched until a future read API is added.

## Goals / Non-Goals

**Goals:**

- Fetch job listings from Kalibrr and Remotive via pluggable source adapters
- Map external responses to a canonical DTO and validate with Zod at runtime
- Persist validated jobs in SQLite with dedup on `(source, external_id)`
- Provide a single `npm run ingest` command for local development
- Store raw API payloads as JSON text for debugging and future remapping

**Non-Goals:**

- Frontend integration (replacing hardcoded `jobs` array)
- Read API / HTTP server for serving jobs to the browser
- JobStreet PH, OnlineJobs.ph, or paid Apify actors
- Search/filter wiring, job detail pages, authentication
- Production deployment, cron scheduling, or monitoring dashboards
- Cross-source fuzzy deduplication (title + company matching)

## Decisions

### 1. Node.js + TypeScript backend (not Python)

**Choice:** Add `backend/` as a sibling package using Node 20+ and TypeScript.

**Rationale:** Matches the existing frontend stack; enables future shared types between ingest DTOs and React `Job` interface.

**Alternatives considered:** Python (Scrapy/httpx) — richer scraping ecosystem but introduces a second language and duplicate type definitions.

### 2. SQLite + Drizzle ORM

**Choice:** SQLite via `better-sqlite3`; Drizzle ORM for schema definitions and migrations. Default database file at `backend/data/dragonjobs.db`.

**Rationale:** Zero external infrastructure for a CLI ingest job; file-based DB is easy to reset, copy, and gitignore; Drizzle supports SQLite upserts and JSON columns natively; sufficient for MVP ingest volume.

**Alternatives considered:** PostgreSQL (JSONB, concurrent writes) — rejected for MVP overhead (Docker, server process); Prisma — heavier ORM for a small ingest service.

### 3. Zod for DTO validation

**Choice:** `JobIngestDto` schema validated with Zod; invalid records logged and skipped (batch continues).

**Rationale:** Runtime validation catches malformed API responses; inferred TS types eliminate duplicate manual typing.

### 4. Source adapter pattern

**Choice:** Each source implements `JobSourceAdapter { name, fetch(query) }` returning `JobIngestDto[]`.

**Rationale:** Isolates API-specific mapping; a broken Kalibrr endpoint only affects one module. Remotive adapter ships first to validate the pipeline with an official API.

**Primary source — Kalibrr:**
- Search: `GET https://www.kalibrr.com/kjs/job_board/search?query={keyword}&limit=50&offset={n}`
- Detail (optional): `GET https://www.kalibrr.com/api/jobs/{id}`
- Default keywords: `developer`, `software engineer`, `devops`

**Secondary source — Remotive:**
- Endpoint: `GET https://remotive.com/api/remote-jobs?category=software-dev&search=philippines`
- No auth required; listings delayed 24h; attribution required when displayed (Phase 3 concern)

### 5. Database schema

**Tables:**

| Table | Purpose |
|---|---|
| `job_sources` | Registry of sources (`kalibrr`, `remotive`) |
| `jobs` | Canonical listing with UUID PK, `(source_id, external_id)` unique constraint |
| `job_tags` | Many-to-many tags/skills per job |

**Key fields on `jobs`:** title, company, location, salary (display string), salary_min/max, currency, work_arrangement, description, apply_url, posted_at, fetched_at, is_active, raw_payload (JSON text).

**Upsert:** `INSERT … ON CONFLICT (source_id, external_id) DO UPDATE` — refresh mutable fields and set `is_active = true`. Stale soft-delete deferred to Phase 2.

### 6. Directory layout

```
backend/
├── package.json
├── drizzle.config.ts
├── src/
│   ├── index.ts              # CLI entry
│   ├── db/                   # schema, client, upsert
│   ├── dto/job.dto.ts        # Zod schemas
│   ├── sources/              # kalibrr.ts, remotive.ts, types.ts
│   └── pipeline/ingest.ts    # orchestrator
└── drizzle/                  # SQL migrations
data/                         # SQLite file (gitignored)
```

### 7. Environment variables

| Variable | Required | Default |
|---|---|---|
| `DATABASE_URL` | No | `file:./data/dragonjobs.db` |
| `INGEST_KEYWORDS` | No | `developer,software engineer,devops` |
| `KALIBRR_MAX_PAGES` | No | `5` |
| `REMOTIVE_CATEGORY` | No | `software-dev` |

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Kalibrr undocumented endpoints may change | Adapter isolation; alert on zero results; JSON raw payload for recovery |
| Kalibrr ToS may prohibit automated access | Dev/MVP only; evaluate official feed before production |
| Remotive listings are 24h delayed and mostly non-PH employers | Kalibrr is primary; Remotive supplements remote-friendly roles |
| Salary formats inconsistent (₱, $, ranges) | Store display string; best-effort numeric parse; don't block ingest on failure |
| Duplicate jobs across sources | Dedup per `(source, external_id)` only; fuzzy dedup deferred |
| SQLite single-writer limits concurrent ingest | CLI runs sequentially; fine for MVP cron; revisit Postgres if multi-worker needed |

## Migration Plan

1. Scaffold `backend/` with dependencies and run initial migration (creates SQLite file)
2. Implement Remotive adapter first (validates pipeline with official API)
3. Implement Kalibrr adapter with pagination
4. Run `npm run ingest` and verify rows in SQLite
5. No frontend migration in this change — zero user-facing impact

**Rollback:** Stop ingest cron/CLI; delete `backend/` and SQLite file; frontend unaffected.

## Open Questions

- Should npm workspaces be used at the repo root, or keep `backend/` fully standalone?
- Kalibrr detail enrichment (`/api/jobs/{id}`) — include in MVP or defer to reduce request volume?
- Seed `job_sources` table via migration or at ingest startup?
