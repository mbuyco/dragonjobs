## ADDED Requirements

### Requirement: API lists active jobs from SQLite
The system SHALL expose `GET /api/jobs` returning a JSON object with a `jobs` array of active job records read from the SQLite database.

#### Scenario: Successful list response
- **WHEN** the client sends `GET /api/jobs` and the database contains active jobs
- **THEN** the system responds with HTTP 200 and a JSON body `{ "jobs": [...] }` where each item includes `id`, `title`, `company`, `source`, `tags`, and `applyUrl`

#### Scenario: Empty database
- **WHEN** the client sends `GET /api/jobs` and no active jobs exist
- **THEN** the system responds with HTTP 200 and `{ "jobs": [] }`

#### Scenario: Jobs ordered by recency
- **WHEN** multiple active jobs exist
- **THEN** the system returns jobs sorted by `posted_at` descending, with null `posted_at` values last, then by `fetched_at` descending

### Requirement: API includes display fields for frontend mapping
Each job in the list response SHALL include optional `salary`, `postedAt` (ISO 8601 string), and `workArrangement` fields when present in the database.

#### Scenario: Job with tags and salary
- **WHEN** a job has tags `["React", "TypeScript"]` and salary `"$80k–120k"` in the database
- **THEN** the API item includes `tags: ["React", "TypeScript"]` and `salary: "$80k–120k"`

#### Scenario: Inactive jobs excluded
- **WHEN** a job row has `is_active = false`
- **THEN** the system does not include that job in the list response

### Requirement: API server runs independently of ingest
The backend SHALL provide an npm script (e.g. `serve`) that starts the HTTP server without running the ingest pipeline.

#### Scenario: Serve command starts listener
- **WHEN** the developer runs the serve script
- **THEN** the system listens on a configurable port (default 3001) and handles `/api/jobs` requests

### Requirement: Health check endpoint
The system SHALL expose `GET /api/health` returning HTTP 200 with a JSON status payload.

#### Scenario: Health check succeeds
- **WHEN** the client sends `GET /api/health`
- **THEN** the system responds with HTTP 200 and a JSON body indicating the service is up
