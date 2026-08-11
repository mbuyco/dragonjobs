## ADDED Requirements

### Requirement: GitHub Actions workflow runs ingest on a schedule
The system SHALL provide a GitHub Actions workflow that triggers on a schedule and on manual dispatch. The workflow SHALL install backend dependencies, run database migrations, execute `npm run ingest`, and export the resulting jobs to `frontend/public/jobs.json`.

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
The system SHALL commit and push `frontend/public/jobs.json` only when the ingest run produced a change: at least one source was not TTL-skipped, or TTL cleanup deleted rows. If every source was TTL-skipped and no rows were deleted, the workflow SHALL exit without committing.

#### Scenario: Source outside TTL triggers deploy
- **WHEN** the ingest summary shows a source with `ttlSkipped = 0` for that source
- **THEN** the workflow exports jobs and commits `jobs.json`

#### Scenario: TTL cleanup triggers deploy
- **WHEN** the ingest summary shows `ttlDeleted > 0`
- **THEN** the workflow exports jobs and commits `jobs.json`

#### Scenario: All sources within TTL and no cleanup
- **WHEN** every configured source was TTL-skipped and `ttlDeleted = 0`
- **THEN** the workflow exits without committing or pushing `jobs.json`

#### Scenario: Empty result set still deploys if TTL expired
- **WHEN** a source fetch runs outside TTL but returns zero valid jobs, and no rows were deleted
- **THEN** the workflow exports the current jobs list and commits `jobs.json`

### Requirement: Workflow commits jobs.json to the repository
The system SHALL commit `frontend/public/jobs.json` using the GitHub Actions bot identity and push to the same branch. The commit message SHALL indicate whether the run was a scheduled refresh or a manual trigger.

#### Scenario: Successful commit
- **WHEN** the deploy gate allows a commit
- **THEN** the workflow stages `jobs.json`, commits with message "chore: refresh jobs cache", and pushes

#### Scenario: No changes to commit
- **WHEN** `git diff --cached` shows no staged changes
- **THEN** the workflow logs "No changes to commit" and exits successfully without pushing
