# job-lifecycle

## Purpose

Define append-only job sync, TTL-based cleanup, and lifecycle metrics for the ingest pipeline.

## Requirements

### Requirement: Append-only sync inserts new jobs only
The system SHALL insert a job only when no row exists for `(source, externalId)`. It SHALL NOT refresh mutable fields for an existing pair during sync.

#### Scenario: New job inserted
- **WHEN** a validated job has no matching `(source, externalId)` row in the database
- **THEN** the system inserts the job with `synced_at` set to the current UTC time

#### Scenario: Job already stored
- **WHEN** a validated job matches an existing `(source, externalId)`
- **THEN** the system skips insert and leaves the existing row unchanged

### Requirement: Lifecycle time is based on synced_at not source posting dates
The system SHALL gate insert eligibility for new `(source, externalId)` pairs on source `postedAt` relative to `INGEST_LOOKBACK_HOURS`. The `synced_at` column SHALL record when the system ingested the job and SHALL be the sole time axis for TTL cleanup (`JOB_TTL_HOURS`).

#### Scenario: Fresh source posting date on new externalId
- **WHEN** a fetched job has `postedAt` within the lookback window and `(source, externalId)` is not yet in the database
- **THEN** the system may insert the job (subject to active and URL-buildability filters)

#### Scenario: Old source posting date on new externalId
- **WHEN** a fetched job has `postedAt` older than the lookback window and `(source, externalId)` is not yet in the database
- **THEN** the system skips insert and increments a lookback-skipped count in the ingest summary

#### Scenario: Missing postedAt on new externalId
- **WHEN** a fetched job has no usable `postedAt` and `(source, externalId)` is not yet in the database
- **THEN** the system skips insert and increments a lookback-skipped count in the ingest summary

#### Scenario: synced_at set on insert
- **WHEN** a new job is inserted
- **THEN** the system sets `synced_at` to the current UTC time and does not update `synced_at` on subsequent sync runs

#### Scenario: TTL still uses synced_at only
- **WHEN** TTL cleanup runs
- **THEN** the system deletes jobs based on `synced_at` vs `JOB_TTL_HOURS` and does not use `postedAt` for deletion

### Requirement: Kalibrr inactive listings are skipped at insert time
The system SHALL NOT insert Kalibrr jobs that fail the source active filter (non-public visibility, past application end date, or hidden company).

#### Scenario: Inactive Kalibrr job in fetch
- **WHEN** a Kalibrr job fails the active filter
- **THEN** the system skips insert and increments an inactive-skipped count in the ingest summary

#### Scenario: Existing row for inactive Kalibrr job
- **WHEN** a Kalibrr job fails the active filter and a row for that `(source, externalId)` already exists
- **THEN** the system does not delete the existing row during this sync run (TTL handles removal)

### Requirement: Jobs are cleaned up after the TTL window
The system SHALL hard-delete all jobs whose `synced_at` is older than `JOB_TTL_HOURS` (default 24) during each ingest run.

#### Scenario: Default 24-hour cleanup
- **WHEN** an ingest run executes and a job has `synced_at` older than 24 hours
- **THEN** the system deletes that job and its tags

#### Scenario: Custom TTL
- **WHEN** `JOB_TTL_HOURS` is set to `12`
- **THEN** the system deletes jobs with `synced_at` older than 12 hours

### Requirement: No apply-URL HTTP probing
The system SHALL NOT perform HTTP liveness probes on apply URLs for any source during ingest.

#### Scenario: Kalibrr job with buildable URL
- **WHEN** a Kalibrr job passes the active filter and has a buildable apply URL from API fields
- **THEN** the system inserts without probing the URL

#### Scenario: Remotive job
- **WHEN** a Remotive job is a new-ingest candidate
- **THEN** the system inserts using the API-provided apply URL without HTTP probing

### Requirement: Lifecycle metrics appear in the ingest summary
The system SHALL include counts for jobs skipped as already-present, skipped as inactive, skipped for unbuildable apply URL, skipped by lookback, inserted, and deleted by TTL in the ingest summary output.

#### Scenario: Summary includes lifecycle counts
- **WHEN** an ingest run completes
- **THEN** the logged summary includes already-present, inactive-skipped, unbuildable-url, lookback-skipped, inserted, and ttl-deleted counts (per source and/or totals as implemented)
