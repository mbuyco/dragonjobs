# ci-deploy

## Purpose

Define the automated CI/CD workflows that keep the job board fresh by running ingest on a schedule, exporting jobs to static JSON on the runner, and deploying the frontend to GitHub Pages through a shared reusable deploy workflow. The refresh-triggered path deploys only when data has changed; a separate push-to-main path also deploys through the same reusable deploy flow.

## Requirements

### Requirement: CI workflows share a reusable ingest preparation contract
The system SHALL define a reusable ingest preparation contract for CI that performs backend setup and data export: ensure `backend/data/` exists, install backend dependencies, run database migrations, execute `npm run ingest`, and export resulting jobs to `public/jobs.json` on the runner (the file is gitignored and is not committed). The refresh workflow (`refresh-jobs.yml`) and push deploy workflow (`deploy-on-main.yml`) SHALL reuse this same ingest preparation contract, either by calling a reusable workflow/composite action or by keeping behavior equivalent to that shared contract.

#### Scenario: Scheduled refresh ingest run
- **WHEN** the refresh schedule triggers
- **THEN** refresh executes the shared ingest preparation contract in sequence (`npm run db:migrate`, `npm run ingest`, `npm run export:jobs`)

#### Scenario: Manual refresh ingest run
- **WHEN** an operator clicks "Run workflow" for refresh in the GitHub Actions UI
- **THEN** refresh executes the same shared ingest preparation contract as a scheduled run

#### Scenario: Push-to-main ingest preparation run
- **WHEN** a commit is pushed to `main` and the push deploy path starts
- **THEN** the push deploy path executes the same shared ingest preparation contract before publishing `jobs-json`

#### Scenario: Missing dependencies fail fast
- **WHEN** any caller executes ingest preparation and `npm ci` or `npm run db:migrate` fails
- **THEN** that run exits with a non-zero status and does not proceed to ingest or export

### Requirement: Workflow persists SQLite across runs via Actions cache
The system SHALL restore `backend/data/dragonjobs.db` from GitHub Actions cache using prefix `dragonjobs-sqlite-v1` (restore-keys) after checkout and before migrations when a cache entry exists, ensure `backend/data/` exists for the cache path, and save the database file after ingest under a unique key with that prefix (so each run updates the persisted DB; exact-key cache hits do not skip save). A cache miss SHALL leave the workflow to create a fresh database via migrate + ingest (cold start). This caching behavior is required for refresh-triggered ingest runs.

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

### Requirement: Deployment logic is centralized in a reusable workflow
The system SHALL centralize GitHub Pages deployment steps in a reusable workflow invoked via `workflow_call`. Caller workflows SHALL prepare and publish a `jobs-json` artifact contract (using the shared ingest preparation contract) and delegate deployment to the reusable workflow so all deploy paths share one implementation.

#### Scenario: Refresh caller invokes reusable deploy workflow
- **WHEN** the refresh workflow (`refresh-jobs.yml`) completes ingest/export and `dataChanged` is true
- **THEN** it uploads `public/jobs.json` as `jobs-json` and invokes the reusable deploy workflow

#### Scenario: Main push caller invokes reusable deploy workflow
- **WHEN** a push event targets `main` in the push deploy workflow (`deploy-on-main.yml`)
- **THEN** that workflow prepares `jobs-json` and invokes the same reusable deploy workflow

### Requirement: Reusable deploy workflow serializes overlapping deploys
The system SHALL configure deployment concurrency in the reusable deploy workflow so only one Pages publish is active at a time, using a shared concurrency group with `cancel-in-progress: true`.

#### Scenario: New deploy cancels in-progress deploy
- **WHEN** a new deploy run starts while another Pages deploy run is in progress
- **THEN** the newer deploy proceeds and the in-progress deploy run is cancelled

### Requirement: CI ingest uses 90-day lookback and retention by default
The system SHALL use ingest CLI defaults `INGEST_LOOKBACK_HOURS=2160` and `JOB_TTL_HOURS=2160` (90 days each) when the shared ingest preparation contract runs `npm run ingest` without overriding those variables. Repository variables or environment overrides MAY still replace these values when explicitly set.

#### Scenario: Default CI retention and lookback
- **WHEN** any caller runs ingest via the shared ingest preparation contract without overriding those variables
- **THEN** lookback is 2160 hours (90 days) and TTL retention is 2160 hours (90 days)

### Requirement: Refresh-triggered deploy is gated on data changes or TTL expiry
For refresh-triggered runs, the system SHALL build the frontend and deploy `dist/` to GitHub Pages only when the ingest summary reports `dataChanged` true — that is, when at least one job was inserted or TTL cleanup deleted rows. If no jobs were inserted and no rows were deleted, the refresh workflow SHALL exit without deploying.

#### Scenario: Inserts trigger deploy
- **WHEN** the ingest summary shows `inserted > 0` (totals) such that `dataChanged` is true
- **THEN** the refresh workflow invokes the reusable deploy workflow and Pages is deployed

#### Scenario: TTL cleanup triggers deploy
- **WHEN** the ingest summary shows `ttlDeleted > 0`
- **THEN** the refresh workflow invokes the reusable deploy workflow and Pages is deployed

#### Scenario: No inserts and no cleanup skips deploy
- **WHEN** ingest inserts zero jobs and `ttlDeleted = 0`
- **THEN** the refresh workflow exits without invoking deploy

#### Scenario: Fetch with no row changes skips deploy
- **WHEN** every source is fetched but no new jobs are inserted and no rows are deleted
- **THEN** the refresh workflow exits without invoking deploy

### Requirement: Push-to-main deploy path triggers deployment
For push-to-main-triggered runs, the system SHALL run the push deploy workflow (`deploy-on-main.yml`) and invoke the reusable deploy workflow independently from refresh `dataChanged` gating.

#### Scenario: Push to main triggers deploy path
- **WHEN** a commit is pushed to `main`
- **THEN** the push deploy workflow prepares `jobs-json` and invokes the reusable deploy workflow

### Requirement: Workflow deploys dist to GitHub Pages without committing jobs.json
The system SHALL have the reusable deploy workflow download the `jobs-json` artifact, run frontend build, verify `dist/jobs.json`, upload the Vite `dist/` output as a GitHub Pages artifact, and deploy with the official Pages actions. `public/jobs.json` SHALL remain gitignored and SHALL NOT be committed or pushed to the repository.

#### Scenario: Reusable deploy workflow executes Pages publish
- **WHEN** a caller workflow invokes the reusable deploy workflow with `jobs-json` available
- **THEN** it runs `npm ci` and `npm run build` at the repo root, verifies `dist/jobs.json` exists, uploads the Pages artifact from `dist/`, and deploys with `actions/deploy-pages`

#### Scenario: Refresh data unchanged skips Pages upload
- **WHEN** `dataChanged` is false
- **THEN** refresh does not invoke the reusable deploy workflow, so no Pages artifact is uploaded and no deploy occurs
