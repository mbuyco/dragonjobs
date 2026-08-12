## Why

Ephemeral CI runners lose SQLite between runs, so ingest always starts cold and the TTL fetch-skip gate never helps. Persisting the DB via Actions cache and always fetching lets retention, lookback, and deploy gating work as intended on a 3-hour cron.

## What Changes

- Persist `backend/data/dragonjobs.db` across CI runs with `actions/cache` (key `dragonjobs-sqlite-v1`); cache miss = cold ingest
- **BREAKING**: Remove per-source fetch skip / `ttlSkipped` / `getLatestSyncAt` — every ingest run always fetches all configured sources
- Redefine `dataChanged` as `inserted > 0 || ttlDeleted > 0` (no longer tied to “source was fetched”)
- CI workflow: restore/save SQLite cache; set `INGEST_LOOKBACK_HOURS=24`, `JOB_TTL_HOURS=72`; serialize concurrency with `cancel-in-progress: true`
- Drop dead `sync.ts` (and related summary fields) after skip removal
- Update backend README + OpenSpec requirements for ingest, lifecycle, and CI deploy

## Capabilities

### New Capabilities

<!-- none — persistence is CI plumbing; behavior changes land in existing specs -->

### Modified Capabilities

- `job-ingest`: Remove “skip source fetch when within TTL”; always fetch; drop `ttlSkipped` from summary
- `job-lifecycle`: `dataChanged` true only when inserts or TTL deletes occur
- `ci-deploy`: Cache restore/save for SQLite; deploy gate uses new `dataChanged`; concurrency note; CI env defaults 24/72

## Impact

- Code: `backend/src/pipeline/ingest.ts`, `backend/src/db/sync.ts` (delete if unused), `backend/src/index.ts` summary shape
- CI: `.github/workflows/refresh-jobs.yml` (cache, env, concurrency)
- Docs: `backend/README.md`
- Specs: `job-ingest`, `job-lifecycle`, `ci-deploy`
- Out of scope: rehydrate from live `/jobs.json`, field refresh / inactive purge, local default `JOB_TTL_HOURS` (stays 24; CI overrides to 72), API date query params
