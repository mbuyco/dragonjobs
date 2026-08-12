## 1. Ingest always-fetch

- [x] 1.1 Remove `getLatestSyncAt` gate and `ttlSkipped` from `backend/src/pipeline/ingest.ts` (`SourceStats`, totals, logs)
- [x] 1.2 Set `dataChanged = ttlDeleted > 0 || totals.inserted > 0`
- [x] 1.3 Delete unused `backend/src/db/sync.ts`; drop `ttlSkipped` from summary JSON in `backend/src/index.ts`

## 2. CI cache, env, concurrency

- [x] 2.1 In `.github/workflows/refresh-jobs.yml`, set concurrency `cancel-in-progress: true` on the existing group
- [x] 2.2 After checkout / before migrate: ensure `backend/data/` exists; restore `actions/cache` for `backend/data/dragonjobs.db` with key `dragonjobs-sqlite-v1`
- [x] 2.3 Set ingest env defaults `INGEST_LOOKBACK_HOURS: 24` and `JOB_TTL_HOURS: 72` (keep existing keyword vars); leave cron `0 */3 * * *`

## 3. Docs

- [x] 3.1 Update `backend/README.md`: TTL = retention only; cron paces fetch; CI SQLite cache; recommended 24/72

## 4. Verify

- [x] 4.1 Run `cd backend && npm run ingest` locally — always fetches; summary has no `ttlSkipped`; `dataChanged` only with inserts or TTL deletes
- [x] 4.2 Confirm workflow YAML has cache path/key, env defaults, and concurrency
- [x] 4.3 Run `npm run build` at repo root
