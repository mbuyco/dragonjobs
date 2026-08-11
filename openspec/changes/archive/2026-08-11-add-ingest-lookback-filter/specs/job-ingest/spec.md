## ADDED Requirements

### Requirement: Ingest respects configurable lookback hours
The system SHALL accept an optional `INGEST_LOOKBACK_HOURS` environment variable to control the insert freshness window. When unset, the system SHALL use `JOB_TTL_HOURS` (default 24).

#### Scenario: Lookback defaults to TTL
- **WHEN** `INGEST_LOOKBACK_HOURS` is not set and `JOB_TTL_HOURS` is `12`
- **THEN** the system uses a 12-hour lookback for insert eligibility

#### Scenario: Custom lookback override
- **WHEN** `INGEST_LOOKBACK_HOURS` is set to `6`
- **THEN** the system uses a 6-hour lookback regardless of `JOB_TTL_HOURS`

### Requirement: Pipeline skips jobs outside the lookback window
The system SHALL apply the lookback gate in the ingest pipeline after DTO validation and after detecting an already-present `(source, externalId)`, and SHALL NOT insert jobs outside the window.

#### Scenario: New job within lookback is inserted
- **WHEN** a validated job is not already stored and `postedAt` is at or after `now - lookback`
- **THEN** the system inserts the job

#### Scenario: New job outside lookback is skipped
- **WHEN** a validated job is not already stored and `postedAt` is before `now - lookback`
- **THEN** the system skips insert and increments `lookbackSkipped`

#### Scenario: Already-present job ignores lookback
- **WHEN** a validated job matches an existing `(source, externalId)`
- **THEN** the system counts it as already-present and does not increment `lookbackSkipped`

## MODIFIED Requirements

### Requirement: Ingest CLI runs the full pipeline
The system SHALL provide a CLI entry point (`npm run ingest`) that orchestrates TTL cleanup, fetch, validate, active filtering (Kalibrr), lookback filtering, insert of new jobs only, for all configured job sources. It SHALL NOT perform apply-URL HTTP probing or mid-run deletion of existing jobs.

#### Scenario: Successful ingest run
- **WHEN** the operator runs `npm run ingest` with a valid `DATABASE_URL`
- **THEN** the system runs TTL cleanup, fetches jobs from each configured source, validates them, applies active and lookback filters, inserts eligible new jobs, and logs a summary including lifecycle counts

#### Scenario: Invalid database path
- **WHEN** the operator runs `npm run ingest` with an unwritable or invalid `DATABASE_URL`
- **THEN** the system exits with a non-zero status and an error message indicating the database cannot be opened or created

### Requirement: Ingest summary is logged on completion
The system SHALL log per-source and total counts at the end of each ingest run, including lookback-skipped counts.

#### Scenario: Summary output
- **WHEN** an ingest run completes (success or partial failure)
- **THEN** the system logs fetched, valid, skipped, inserted, already-present, inactive-skipped, unbuildable-url, and lookback-skipped counts for each source and a combined total
