# job-source-adapters

## Purpose

Define pluggable adapters that fetch Philippine-focused and remote developer job listings from external APIs and map them into the ingest DTO shape.

## Requirements

### Requirement: Source adapters implement a shared interface
Each job source SHALL implement a `JobSourceAdapter` interface with a `name` property and a `fetch(query)` method returning an array of raw-mapped objects ready for DTO validation.

#### Scenario: Adapter returns mapped jobs
- **WHEN** the pipeline calls `fetch()` on a configured adapter
- **THEN** the adapter returns an array of objects with fields matching the `JobIngestDto` shape (pre-validation)

### Requirement: Remotive adapter fetches from official API
The system SHALL include a Remotive adapter that fetches from `https://remotive.com/api/remote-jobs` without authentication.

#### Scenario: Remotive software-dev fetch
- **WHEN** the Remotive adapter is invoked with default configuration
- **THEN** the system requests listings with `category=software-dev` and maps each result to `JobIngestDto` fields (externalId, title, company, location, salary, tags, description, applyUrl, postedAt, rawPayload)

#### Scenario: Remotive category override
- **WHEN** `REMOTIVE_CATEGORY` is set to `devops`
- **THEN** the Remotive adapter uses that category in the API request

#### Scenario: Remotive field mapping
- **WHEN** a Remotive job has `company_name`, `url`, `publication_date`, and `candidate_required_location`
- **THEN** the adapter maps them to `company`, `applyUrl`, `postedAt`, and `location` respectively and sets `source` to `remotive`

### Requirement: Kalibrr adapter fetches PH job listings
The system SHALL include a Kalibrr adapter that fetches from `https://www.kalibrr.com/kjs/job_board/search` with pagination.

#### Scenario: Kalibrr paginated search
- **WHEN** the Kalibrr adapter is invoked with keyword `developer`
- **THEN** the system requests paginated results (limit 50 per page) up to `KALIBRR_MAX_PAGES` (default 5) and maps each result to `JobIngestDto`

#### Scenario: Kalibrr field mapping
- **WHEN** a Kalibrr job has `name`, `company.name`, `google_location_formatted_address`, and a job id
- **THEN** the adapter maps them to `title`, `company`, `location`, and `externalId` respectively, sets `source` to `kalibrr`, and includes the full API response in `rawPayload`

#### Scenario: Kalibrr work arrangement mapping
- **WHEN** a Kalibrr job includes a work arrangement field (remote, hybrid, on-site)
- **THEN** the adapter maps it to the `workArrangement` enum value (`remote`, `hybrid`, `onsite`, or `unknown`)

### Requirement: Adapters handle fetch errors gracefully
Each adapter SHALL catch network and HTTP errors and return an empty array rather than crashing the pipeline.

#### Scenario: Source API unreachable
- **WHEN** a source API returns a network error or non-2xx status
- **THEN** the adapter logs the error and returns an empty array so other sources can still be processed
