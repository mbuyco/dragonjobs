## ADDED Requirements

### Requirement: Workflow persists SQLite across runs via Actions cache
The system SHALL restore `backend/data/dragonjobs.db` from GitHub Actions cache using prefix `dragonjobs-sqlite-v1` (restore-keys) after checkout and before migrations when a cache entry exists, ensure `backend/data/` exists for the cache path, and save the database file after ingest under a unique key with that prefix (so each run updates the persisted DB; exact-key cache hits do not skip save). A cache miss SHALL leave the workflow to create a fresh database via migrate + ingest (cold start).

#### Scenario: Cache hit restores database
- **WHEN** a previous successful run saved a cache entry under prefix `dragonjobs-sqlite-v1`
- **THEN** the workflow restores `backend/data/dragonjobs.db` before `npm run db:migrate`

#### Scenario: Cache miss cold starts
- **WHEN** no cache entry exists under prefix `dragonjobs-sqlite-v1`
- **THEN** the workflow continues with migrate and ingest against a new database file and saves the file to cache after ingest

### Requirement: Refresh workflow serializes overlapping runs
The system SHALL configure workflow concurrency so only one refresh run writes the SQLite cache at a time, using a single concurrency group with `cancel-in-progress: true`.

#### Scenario: New run cancels in-progress refresh
- **WHEN** a scheduled or manual refresh starts while another refresh run is in progress
- **THEN** the newer run proceeds and the in-progress run is cancelled

### Requirement: CI ingest uses lookback 24h and retention 72h by default
The system SHALL set workflow environment defaults `INGEST_LOOKBACK_HOURS=24` and `JOB_TTL_HOURS=72` for the ingest step (repository variables may still override when explicitly set).

#### Scenario: Default CI retention and lookback
- **WHEN** the refresh workflow runs ingest without overriding those variables
- **THEN** lookback is 24 hours and TTL retention is 72 hours

## MODIFIED Requirements

### Requirement: Deploy is gated on data changes or TTL expiry
The system SHALL build the frontend and deploy `dist/` to GitHub Pages only when the ingest summary reports `dataChanged` true — that is, when at least one job was inserted or TTL cleanup deleted rows. If no jobs were inserted and no rows were deleted, the workflow SHALL exit without deploying.

#### Scenario: Inserts trigger deploy
- **WHEN** the ingest summary shows `inserted > 0` (totals) such that `dataChanged` is true
- **THEN** the workflow builds the frontend (with exported `public/jobs.json` copied into `dist/`) and deploys to GitHub Pages

#### Scenario: TTL cleanup triggers deploy
- **WHEN** the ingest summary shows `ttlDeleted > 0`
- **THEN** the workflow builds the frontend and deploys to GitHub Pages

#### Scenario: No inserts and no cleanup skips deploy
- **WHEN** ingest inserts zero jobs and `ttlDeleted = 0`
- **THEN** the workflow exits without building or deploying

#### Scenario: Fetch with no row changes skips deploy
- **WHEN** every source is fetched but no new jobs are inserted and no rows are deleted
- **THEN** the workflow exits without building or deploying
