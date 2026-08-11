## MODIFIED Requirements

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
