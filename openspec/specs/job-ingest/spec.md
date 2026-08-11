# job-ingest

## Purpose

Define the CLI ingest pipeline that fetches jobs from configured sources, validates them, and persists them to the database.

## Requirements

### Requirement: Ingest CLI runs the full pipeline
The system SHALL provide a CLI entry point (`npm run ingest`) that orchestrates fetch, validate, and persist for all configured job sources.

#### Scenario: Successful ingest run
- **WHEN** the operator runs `npm run ingest` with a valid `DATABASE_URL`
- **THEN** the system fetches jobs from each configured source, validates them, upserts to the database, and logs a summary (source name, fetched count, valid count, skipped count, upserted count)

#### Scenario: Invalid database path
- **WHEN** the operator runs `npm run ingest` with an unwritable or invalid `DATABASE_URL`
- **THEN** the system exits with a non-zero status and an error message indicating the database cannot be opened or created

### Requirement: Invalid records are skipped without aborting
The system SHALL validate each fetched job against the `JobIngestDto` schema and skip invalid records while continuing the batch.

#### Scenario: Malformed API record
- **WHEN** a source returns a job record that fails Zod validation
- **THEN** the system logs the validation error with source and external id (if available) and continues processing remaining records

### Requirement: Ingest respects configurable keywords
The system SHALL accept an optional `INGEST_KEYWORDS` environment variable (comma-separated) to control search terms passed to source adapters.

#### Scenario: Default keywords used
- **WHEN** `INGEST_KEYWORDS` is not set
- **THEN** the system uses default keywords `developer`, `software engineer`, and `devops`

#### Scenario: Custom keywords used
- **WHEN** `INGEST_KEYWORDS` is set to `frontend,react`
- **THEN** the system passes those keywords to each source adapter that supports keyword search

### Requirement: Ingest summary is logged on completion
The system SHALL log per-source and total counts at the end of each ingest run.

#### Scenario: Summary output
- **WHEN** an ingest run completes (success or partial failure)
- **THEN** the system logs fetched, valid, skipped, and upserted counts for each source and a combined total
