## REMOVED Requirements

### Requirement: Ingest skips source fetch when within TTL
**Reason**: Fetch skip coupled retention TTL to source polling and never helped on ephemeral CI. Cron paces fetches; lookback gates inserts; `JOB_TTL_HOURS` is retention only.
**Migration**: Always call `adapter.fetch()` for every configured source. Remove `getLatestSyncAt`, `ttlSkipped` from `SourceStats` / totals / logs / summary JSON. Delete unused `backend/src/db/sync.ts` if nothing else imports it.

## MODIFIED Requirements

### Requirement: Ingest CLI runs the full pipeline
The system SHALL provide a CLI entry point (`npm run ingest`) that orchestrates TTL cleanup, fetch, validate, active filtering (Kalibrr), lookback filtering, insert of new jobs only, for all configured job sources. It SHALL fetch every configured source on each run (no per-source fetch skip). It SHALL NOT perform apply-URL HTTP probing or mid-run deletion of existing jobs.

#### Scenario: Successful ingest run
- **WHEN** the operator runs `npm run ingest` with a valid `DATABASE_URL`
- **THEN** the system runs TTL cleanup, fetches jobs from each configured source, validates them, applies active and lookback filters, inserts eligible new jobs, and logs a summary including lifecycle counts

#### Scenario: Invalid database path
- **WHEN** the operator runs `npm run ingest` with an unwritable or invalid `DATABASE_URL`
- **THEN** the system exits with a non-zero status and an error message indicating the database cannot be opened or created

#### Scenario: Every source is fetched each run
- **WHEN** the operator runs `npm run ingest` and jobs for a source already exist with recent `synced_at`
- **THEN** the system still calls `adapter.fetch()` for that source and does not emit a TTL fetch-skip

### Requirement: Ingest summary is logged on completion
The system SHALL log per-source and total counts at the end of each ingest run, including lookback-skipped counts. The summary SHALL NOT include `ttlSkipped` / `ttl-skipped` fetch-skip counts.

#### Scenario: Summary output
- **WHEN** an ingest run completes (success or partial failure)
- **THEN** the system logs fetched, valid, skipped, inserted, already-present, inactive-skipped, unbuildable-url, and lookback-skipped counts for each source and a combined total

#### Scenario: No ttl-skipped in summary
- **WHEN** an ingest run completes
- **THEN** the logged summary and written summary JSON do not include `ttlSkipped` or `ttl-skipped` fields
