# job-storage

## Purpose

Define SQLite persistence for ingested jobs: schema, DTO validation, migrations, and upsert/dedup behavior.

## Requirements

### Requirement: Database schema stores jobs with source dedup
The system SHALL persist jobs in SQLite with tables `job_sources`, `jobs`, and `job_tags`, enforcing uniqueness on `(source_id, external_id)`.

#### Scenario: New job inserted
- **WHEN** a validated `JobIngestDto` with source `kalibrr` and externalId `12345` does not exist in the database
- **THEN** the system inserts a new row in `jobs` with a UUID primary key, normalized fields, and the full `rawPayload` stored as JSON text

#### Scenario: Existing job upserted
- **WHEN** a validated `JobIngestDto` with the same `(source, externalId)` already exists
- **THEN** the system updates mutable fields (title, company, salary, description, tags, etc.), sets `fetched_at` to now, and sets `is_active` to true

### Requirement: Job tags are stored relationally
The system SHALL store job skills/tags in a `job_tags` table linked to the job UUID.

#### Scenario: Tags inserted on upsert
- **WHEN** a job is upserted with tags `["React", "TypeScript"]`
- **THEN** the system replaces existing tags for that job with the new tag rows

### Requirement: Job sources are seeded
The system SHALL seed `job_sources` with rows for `kalibrr` and `remotive` before the first ingest run.

#### Scenario: Sources available on first run
- **WHEN** the database is migrated and ingest runs for the first time
- **THEN** `job_sources` contains entries for `kalibrr` (base URL `https://www.kalibrr.com`) and `remotive` (base URL `https://remotive.com`)

### Requirement: DTO schema validates required fields
The system SHALL define a `JobIngestDto` Zod schema requiring `source`, `externalId`, `title`, `company`, `applyUrl`, and `rawPayload`, with optional fields for location, salary, tags, description, postedAt, and workArrangement.

#### Scenario: Valid DTO passes
- **WHEN** an object has all required fields with correct types
- **THEN** `JobIngestDto.parse()` returns the validated object

#### Scenario: Missing required field fails
- **WHEN** an object is missing `applyUrl`
- **THEN** `JobIngestDto.parse()` throws a Zod validation error

### Requirement: Local development uses file-based SQLite
The system SHALL use a SQLite database file for local development, defaulting to `backend/data/dragonjobs.db`, with no external database server required.

#### Scenario: Default database file created
- **WHEN** the developer runs migrations without setting `DATABASE_URL`
- **THEN** the system creates or uses `backend/data/dragonjobs.db` and applies the schema

#### Scenario: Custom database path via env
- **WHEN** `DATABASE_URL` is set to `file:./custom/path/jobs.db`
- **THEN** the system uses that file path for all database operations

### Requirement: Schema migrations are managed by Drizzle
The system SHALL use Drizzle ORM for schema definitions and Drizzle Kit for generating and applying SQL migrations.

#### Scenario: Initial migration creates tables
- **WHEN** the developer runs the migration command
- **THEN** the `job_sources`, `jobs`, and `job_tags` tables are created with indexes on `posted_at`, `is_active`, and `tag`
