## 1. Database helper for latest sync time

- [x] 1.1 Create `backend/src/db/sync.ts` with `getLatestSyncAt(db, sourceName)` that joins `jobs` → `job_sources` and returns the max `synced_at` ISO string, or `undefined` when no rows exist.

## 2. Update ingest types and stats

- [x] 2.1 Add `ttlSkipped: number` to `SourceStats` and `IngestSummary` in `backend/src/pipeline/ingest.ts`.
- [x] 2.2 Update `emptySourceStats` and the totals reducer to include `ttlSkipped`.

## 3. Gate external fetches by TTL

- [x] 3.1 In `runIngest`, before calling `adapter.fetch(query)`, compute the TTL cutoff using the existing `ttlCutoffIso(query.jobTtlHours)`.
- [x] 3.2 Read `latestSyncAt` for the adapter's source via `getLatestSyncAt`.
- [x] 3.3 If `latestSyncAt` exists and is at or after the cutoff, skip the fetch, log `[<source>] skip fetch: within TTL`, record `ttlSkipped = 1`, and continue to the next adapter without mutating other stats.
- [x] 3.4 If `latestSyncAt` is `undefined` or older than the cutoff, proceed with `adapter.fetch(query)` as before.

## 4. Update summary logging

- [x] 4.1 Update `logIngestSummary` to include `ttl-skipped` in per-source and total log lines.

## 5. Verify build

- [x] 5.1 Run `npm run build` and confirm it passes.
