## Why

Ingest currently upserts every fetched listing without checking whether listings are still active. Kalibrr apply links are broken: the adapter builds `https://www.kalibrr.com/c/jobs/{id}` (404), while the live site needs company code + slug. Stale rows also accumulate indefinitely. We need append-only sync, source-native active filtering, correct Kalibrr URLs, TTL cleanup keyed on our own sync time — not external posting dates — and a hard 24-hour board lifetime.

## What Changes

- Fix Kalibrr `applyUrl` construction: prefer `apply_redirect_url`, else `/c/{code}/jobs/{id}/{slug}`; never bare `/c/jobs/{id}`; skip jobs with no buildable URL
- Filter Kalibrr candidates using search API fields before persist: `visibility`, `application_end_date`, company visibility
- **No HTTP apply-URL probing** — Kalibrr dead links were a URL-construction bug (confirmed: 50/50 search results have redirect or code+slug; company-scoped URLs return 200, bare `/c/jobs/{id}` returns 404). Remotive and other sources skip probe entirely
- Ingest only **new** jobs (insert-only when `(source, externalId)` absent); no upsert refresh, no mid-run deletion
- Hard-delete all jobs whose **`synced_at`** is older than **24 hours** (`JOB_TTL_HOURS`) on every ingest run — lifecycle time axis is when **we** synced, not source `postedAt` / `activation_date`
- Drop `description`, `raw_payload`, and `is_active` from `jobs` table
- Rename `fetched_at` → `synced_at` (set on insert only)
- Extend ingest summary logs with already-present, inactive-skipped, unbuildable-url, and ttl-deleted counts
- Add env knob: `JOB_TTL_HOURS` (default `24`). **No** `INGEST_LOOKBACK_HOURS` — no external-timestamp insert window

## Capabilities

### New Capabilities

- `job-lifecycle`: Append-only sync, Kalibrr active filtering, `synced_at`-based TTL cleanup

### Modified Capabilities

- `job-ingest`: Pipeline orchestration gains TTL cleanup, insert-only persist, active filtering; no URL probe or mid-run removal
- `job-source-adapters`: Kalibrr mapping fixes apply URL shape and filters inactive listings from search API fields
- `job-storage`: Insert-only persist, TTL cleanup helper, schema drops fat columns and `is_active`; `synced_at` replaces `fetched_at`

## Impact

- **Backend pipeline**: `backend/src/pipeline/ingest.ts`
- **Adapters**: `backend/src/sources/kalibrr.ts` (URL + active filter); Remotive unchanged except no probe
- **Storage**: `backend/src/db/upsert.ts` → insert-only; new TTL query; schema migration for column changes
- **Read API**: `backend/src/db/list-jobs.ts` drops `is_active` filter
- **Config**: `backend/README.md` env docs
