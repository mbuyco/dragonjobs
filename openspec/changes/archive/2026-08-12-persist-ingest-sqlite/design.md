## Context

Ingest today skips per-source fetch when latest `synced_at` is within `JOB_TTL_HOURS`, and sets `dataChanged` when any source was fetched or TTL deleted rows. On GitHub Actions the SQLite file is ephemeral, so every run is cold: skip never fires, deploy often rebuilds even with no new inserts. Cron is every 3 hours; retention and lookback should do the real work once the DB persists across runs.

## Goals / Non-Goals

**Goals:**

- Persist CI SQLite via `actions/cache` so TTL retention and append-only history survive between workflow runs
- Always fetch all sources each ingest (cron paces load; remove fetch-skip / `ttlSkipped`)
- Deploy only when inserts or TTL deletes change the dataset (`dataChanged = inserted > 0 || ttlDeleted > 0`)
- CI defaults: lookback 24h, retention 72h; serialize refresh workflow so cache writes do not race

**Non-Goals:**

- Rehydrate DB from live `/jobs.json`
- Refresh fields on already-present rows or purge inactive on re-fetch
- Change local code default `JOB_TTL_HOURS` (stays 24; CI overrides to 72)
- API date query params

## Decisions

1. **Cache prefix `dragonjobs-sqlite-v1` for `backend/data/dragonjobs.db`**
   - Rationale: Single-file SQLite; versioned prefix lets us bust cache if schema/format needs a clean slate. Miss = empty DB after migrate = cold ingest (acceptable). Save uses `dragonjobs-sqlite-v1-${{ github.run_id }}` with restore-keys prefix — combined `actions/cache` would skip post-save on exact key hit and freeze the DB.
   - Alternatives: commit DB (rejected — binary churn), artifact upload between runs (heavier), self-hosted runner disk (not available), fixed exact key only (rejected — never updates after first hit).

2. **Always fetch; drop `getLatestSyncAt` / `ttlSkipped`**
   - Rationale: With persisted DB, skip would silence sources for up to TTL and miss new postings between cron ticks. Cron (`0 */3 * * *`) is the rate limit; lookback gates inserts; TTL gates retention.
   - Alternatives: keep skip with shorter TTL (rejected — couples retention to fetch cadence).

3. **`dataChanged = inserted > 0 || ttlDeleted > 0`**
   - Rationale: Fetch alone no longer implies site content change. Pages deploy only when export would differ in meaningful rows.
   - Alternatives: hash export JSON (more accurate but heavier); always deploy (wasteful).

4. **CI env `INGEST_LOOKBACK_HOURS=24`, `JOB_TTL_HOURS=72`**
   - Rationale: Keep insert window tight; keep jobs on the board longer than lookback so the board does not empty between overlapping windows. Local default TTL remains 24 unless overridden.
   - Alternatives: same value for both (rejected — board thrash or stale inserts).

5. **Concurrency: same group, `cancel-in-progress: true`**
   - Rationale: Overlapping refresh runs can corrupt or race cache save/restore. Cancel older run when a new one starts.
   - Alternatives: `cancel-in-progress: false` with exclusive lock (queue delay); separate cache keys per run (defeats persistence).

## Risks / Trade-offs

- **[Risk] Cache miss or eviction** → Mitigation: Treat as cold start; migrate + full fetch still works; first successful save restores persistence.
- **[Risk] Corrupt SQLite restored from cache** → Mitigation: Migrate step fails fast; bust cache key (`v2`) if needed; manual workflow_dispatch after delete cache.
- **[Risk] More frequent source API calls** → Mitigation: Acceptable at 3h cron; lookback still limits inserts; no mid-run HTTP probing.
- **[Risk] Cancel-in-progress drops an in-flight deploy** → Mitigation: Next run re-ingests and deploys if data still changed; prefer consistency over finishing a raced cache write.

## Migration Plan

1. Ship code + workflow in one change: always-fetch ingest, then cache + env + concurrency in the same workflow PR.
2. First post-merge scheduled run: likely cache miss → cold ingest → save cache.
3. Rollback: revert workflow cache/env and restore fetch-skip if needed; delete Actions cache entry for clean cold start.

## Open Questions

None — decisions locked in plan grilling.
