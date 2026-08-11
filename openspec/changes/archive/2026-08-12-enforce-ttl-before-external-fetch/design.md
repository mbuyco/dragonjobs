## Context

The ingest pipeline in `backend/src/pipeline/ingest.ts` currently calls `adapter.fetch(query)` for every configured source on every run. TTL is only enforced as a post-fetch cleanup step (`deleteJobsSyncedBefore`), meaning external APIs are hit even when local data is fresh.

## Goals / Non-Goals

**Goals:**
- Skip external fetches when a source's most recent `synced_at` is within `JOB_TTL_HOURS`.
- Surface TTL-skip decisions in logs and the ingest summary.
- Keep source adapters unchanged.

**Non-Goals:**
- Frontend awareness of sync state.
- Partial fetch resumption or retry logic.
- Schema changes.

## Decisions

1. **Gate location**: TTL check lives in `runIngest`, immediately before `adapter.fetch(query)`. This keeps adapters stateless and avoids leaking fetch policy into source code.
2. **Sync-time lookup**: Add `getLatestSyncAt(db, sourceName)` in a new `backend/src/db/sync.ts`. It joins `jobs` → `job_sources`, groups by source, and returns the max `synced_at` ISO string. Returning `undefined` means no rows yet, so fetch proceeds.
3. **Stats extension**: Add `ttlSkipped: number` to `SourceStats` and `IngestSummary`. When a fetch is skipped, record `ttlSkipped = 1` and zero out `fetched`/`valid`/`skipped`/`inserted`/`alreadyPresent`/`inactiveSkipped`/`unbuildableUrl`/`lookbackSkipped` for that source.
4. **Cutoff calculation**: Reuse the existing `ttlCutoffIso(jobTtlHours)` helper in `ingest.ts` so both the delete step and the fetch gate share one definition of "fresh".

## Risks / Trade-offs

- [Stale data if TTL is long] → Mitigation: operators control `JOB_TTL_HOURS`; default remains 24h.
- [First run after deploy has no local rows] → Mitigation: `undefined` sync time bypasses the gate and fetches normally.
- [Clock skew between app and DB] → Low risk: both use the same server process for `Date.now()` and SQLite `datetime('now')`.
