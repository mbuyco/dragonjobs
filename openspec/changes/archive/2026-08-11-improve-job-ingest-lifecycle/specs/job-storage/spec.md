## MODIFIED Requirements

### Requirement: Database schema stores jobs with source dedup
The system SHALL persist jobs in SQLite with tables `job_sources`, `jobs`, and `job_tags`, enforcing uniqueness on `(source_id, external_id)`. The `jobs` table SHALL NOT include `description`, `raw_payload`, or `is_active` columns. The `jobs` table SHALL include `synced_at` (replacing `fetched_at`) set on insert. Normal sync SHALL insert only when no row exists for that pair; it SHALL NOT refresh mutable fields for an existing pair.

#### Scenario: New job inserted
- **WHEN** a validated `JobIngestDto` with source `kalibrr` and externalId `12345` does not exist in the database
- **THEN** the system inserts a new row in `jobs` with a UUID primary key, normalized listing fields, and `synced_at` set to now

#### Scenario: Existing job not refreshed on sync
- **WHEN** a validated `JobIngestDto` with the same `(source, externalId)` already exists during a normal ingest sync
- **THEN** the system leaves the existing row unchanged including `synced_at`

### Requirement: DTO schema validates required fields
The system SHALL define a `JobIngestDto` Zod schema requiring `source`, `externalId`, `title`, `company`, and `applyUrl`, with optional fields for location, salary, tags, postedAt, and workArrangement. The DTO SHALL NOT include `description` or `rawPayload`.

#### Scenario: Valid DTO passes
- **WHEN** an object has all required fields with correct types
- **THEN** `JobIngestDto.parse()` returns the validated object

#### Scenario: Missing required field fails
- **WHEN** an object is missing `applyUrl`
- **THEN** `JobIngestDto.parse()` throws a Zod validation error

## ADDED Requirements

### Requirement: TTL cleanup deletes expired jobs
The system SHALL provide a persistence helper that hard-deletes all jobs with `synced_at` older than a given cutoff timestamp and returns the number of deleted rows.

#### Scenario: Expired jobs removed
- **WHEN** TTL cleanup runs with cutoff `T` and jobs exist with `synced_at` before `T`
- **THEN** those jobs and their tags are deleted and the helper returns the deleted count

### Requirement: Schema migration drops legacy columns and renames synced_at
The system SHALL ship Drizzle migrations that remove `description`, `raw_payload`, and `is_active` from the `jobs` table and rename `fetched_at` to `synced_at`.

#### Scenario: Migration applied on existing database
- **WHEN** the developer runs the migration command on a database created with the prior schema
- **THEN** the `jobs` table has `synced_at` and no longer has `description`, `raw_payload`, `is_active`, or `fetched_at`
