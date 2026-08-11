## 1. Kalibrr adapter fixes

- [x] 1.1 Update Kalibrr TypeScript types for `visibility`, `application_end_date`, `slug`, `apply_redirect_url`, `company.code` / `visible`, and `company_info.hidden`
- [x] 1.2 Fix `applyUrl` construction: prefer `apply_redirect_url`, else `/c/{code}/jobs/{id}/{slug}`, else `/c/{code}/jobs/{id}`; never bare `/c/jobs/{id}`; omit jobs with no buildable URL
- [x] 1.3 Skip inactive Kalibrr jobs at map time: non-public visibility, past `application_end_date`, hidden/not-visible company

## 2. Storage and schema

- [x] 2.0 Drop `description` and `raw_payload` from Drizzle schema, `JobIngestDto`, persist path, and adapters; generate and apply migration
- [x] 2.1 Rename `fetched_at` → `synced_at` in schema and migration; set on insert only
- [x] 2.2 Drop `is_active` column, index, and read-API filter
- [x] 2.3 Change persist path to insert-only when `(source, externalId)` absent (no upsert refresh)
- [x] 2.4 Add `deleteJobsSyncedBefore(db, cutoffIso)` TTL helper returning deleted count

## 3. Config

- [x] 3.1 Add `JOB_TTL_HOURS` (default 24) to ingest env loading

## 4. Pipeline orchestration

- [x] 4.1 Run TTL cleanup at start of `runIngest` and record `ttl-deleted` count
- [x] 4.2 After validate: skip already-present; insert new survivors only (no probe, no mid-run delete)
- [x] 4.3 Extend `SourceStats` / summary logging with already-present, inactive-skipped, unbuildable-url, inserted, and ttl-deleted counts

## 5. Docs and verification

- [x] 5.1 Document `JOB_TTL_HOURS`, append-only sync, and TTL behavior in `backend/README.md`
- [x] 5.2 Manually run `npm run ingest` and confirm Kalibrr apply URLs are company-scoped, insert-only works, TTL counts appear in logs
