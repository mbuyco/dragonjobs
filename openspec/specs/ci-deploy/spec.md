# ci-deploy

## Purpose

Define the automated CI/CD workflow that keeps the job board fresh by running the ingest pipeline on a schedule, exporting jobs to static JSON on the runner, and conditionally deploying the frontend build to GitHub Pages only when data has changed.

## Requirements

### Requirement: GitHub Actions workflow runs ingest on a schedule
The system SHALL provide a GitHub Actions workflow that triggers on a schedule and on manual dispatch. The workflow SHALL install backend dependencies, run database migrations, execute `npm run ingest`, and export the resulting jobs to `public/jobs.json` on the runner (the file is gitignored and is not committed).

#### Scenario: Scheduled ingest run
- **WHEN** the schedule triggers the workflow
- **THEN** the workflow runs `npm run db:migrate`, `npm run ingest`, and `npm run export:jobs` in sequence

#### Scenario: Manual ingest run
- **WHEN** an operator clicks "Run workflow" in the GitHub Actions UI
- **THEN** the workflow executes the same ingest and export steps as a scheduled run

#### Scenario: Missing dependencies fail fast
- **WHEN** the workflow runs and `npm ci` or `npm run db:migrate` fails
- **THEN** the workflow exits with a non-zero status and does not proceed to ingest or export

### Requirement: Deploy is gated on data changes or TTL expiry
The system SHALL build the frontend and deploy `dist/` to GitHub Pages only when the ingest run produced a change: at least one source was not TTL-skipped, or TTL cleanup deleted rows. If every source was TTL-skipped and no rows were deleted, the workflow SHALL exit without deploying.

#### Scenario: Source outside TTL triggers deploy
- **WHEN** the ingest summary shows a source with `ttlSkipped = 0` for that source
- **THEN** the workflow builds the frontend (with exported `public/jobs.json` copied into `dist/`) and deploys to GitHub Pages

#### Scenario: TTL cleanup triggers deploy
- **WHEN** the ingest summary shows `ttlDeleted > 0`
- **THEN** the workflow builds the frontend and deploys to GitHub Pages

#### Scenario: All sources within TTL and no cleanup
- **WHEN** every configured source was TTL-skipped and `ttlDeleted = 0`
- **THEN** the workflow exits without building or deploying

#### Scenario: Empty result set still deploys if TTL expired
- **WHEN** a source fetch runs outside TTL but returns zero valid jobs, and no rows were deleted
- **THEN** the workflow builds and deploys the current jobs list via `dist/jobs.json`

### Requirement: Workflow deploys dist to GitHub Pages without committing jobs.json
The system SHALL upload the Vite `dist/` output (including `jobs.json`) as a GitHub Pages artifact and deploy it with the official Pages actions. `public/jobs.json` SHALL remain gitignored and SHALL NOT be committed or pushed to the repository.

#### Scenario: Successful deploy when data changed
- **WHEN** the deploy gate allows a deploy
- **THEN** the workflow runs `npm ci` and `npm run build` at the repo root, verifies `dist/jobs.json` exists, uploads the Pages artifact from `dist/`, and deploys with `actions/deploy-pages`

#### Scenario: Data unchanged skips Pages upload
- **WHEN** `dataChanged` is false
- **THEN** the workflow does not install frontend deps, build, upload an artifact, or deploy
