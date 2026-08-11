## ADDED Requirements

### Requirement: Ingest skips source fetch when within TTL
The system SHALL query the latest `synced_at` for each configured source before calling `adapter.fetch()`. If the source's most recent successful sync is at or after `now - JOB_TTL_HOURS`, the system SHALL skip that source's external fetch, log the skip, and record a `ttlSkipped` count in the ingest summary.

#### Scenario: Source fetch skipped due to TTL
- **WHEN** the operator runs `npm run ingest` and a source's latest `synced_at` is within `JOB_TTL_HOURS`
- **THEN** the system does not call `adapter.fetch()` for that source, logs `[<source>] skip fetch: within TTL`, and increments `ttlSkipped` for that source

#### Scenario: Source fetch proceeds when stale
- **WHEN** the operator runs `npm run ingest` and a source's latest `synced_at` is older than `JOB_TTL_HOURS`
- **THEN** the system calls `adapter.fetch()` for that source and processes jobs normally

#### Scenario: Source fetch proceeds when no local rows exist
- **WHEN** the operator runs `npm run ingest` and a source has no rows in the database
- **THEN** the system calls `adapter.fetch()` for that source because there is no `synced_at` to evaluate

#### Scenario: TTL skip counts appear in summary
- **WHEN** an ingest run completes with one or more sources skipped due to TTL
- **THEN** the logged summary includes `ttl-skipped` counts per source and in totals alongside existing lifecycle counts
