## MODIFIED Requirements

### Requirement: Ingest CLI runs the full pipeline
The system SHALL provide a CLI entry point (`npm run ingest`) that orchestrates TTL cleanup, fetch, validate, active filtering (Kalibrr), insert of new jobs only, for all configured job sources. It SHALL NOT perform apply-URL HTTP probing or mid-run deletion of existing jobs.

#### Scenario: Successful ingest run
- **WHEN** the operator runs `npm run ingest` with a valid `DATABASE_URL`
- **THEN** the system runs TTL cleanup, fetches jobs from each configured source, validates them, applies active filters, inserts eligible new jobs, and logs a summary including lifecycle counts

#### Scenario: Invalid database path
- **WHEN** the operator runs `npm run ingest` with an unwritable or invalid `DATABASE_URL`
- **THEN** the system exits with a non-zero status and an error message indicating the database cannot be opened or created

## ADDED Requirements

### Requirement: Ingest performs TTL cleanup each run
The system SHALL delete jobs whose `synced_at` is older than `JOB_TTL_HOURS` (default 24) as part of every `npm run ingest` execution before source processing, and SHALL reflect deleted counts in the run summary.

#### Scenario: Cleanup runs even when sources return no jobs
- **WHEN** the operator runs `npm run ingest` and every source returns zero jobs
- **THEN** the system still performs TTL cleanup and logs how many jobs were deleted
