## MODIFIED Requirements

### Requirement: Kalibrr adapter fetches PH job listings
The system SHALL include a Kalibrr adapter that fetches from `https://www.kalibrr.com/kjs/job_board/search` with pagination, filters inactive listings using search API fields, and constructs a working public apply URL without HTTP probing.

#### Scenario: Kalibrr paginated search
- **WHEN** the Kalibrr adapter is invoked with keyword `developer`
- **THEN** the system requests paginated results (limit 50 per page) up to `KALIBRR_MAX_PAGES` (default 5) and maps each active result to `JobIngestDto`

#### Scenario: Kalibrr field mapping
- **WHEN** a Kalibrr job has `name`, `company.name`, `google_location_formatted_address`, and a job id
- **THEN** the adapter maps them to `title`, `company`, `location`, and `externalId` respectively and sets `source` to `kalibrr`

#### Scenario: Kalibrr work arrangement mapping
- **WHEN** a Kalibrr job includes a work arrangement field (remote, hybrid, on-site)
- **THEN** the adapter maps it to the `workArrangement` enum value (`remote`, `hybrid`, `onsite`, or `unknown`)

#### Scenario: Kalibrr apply URL uses company-scoped path
- **WHEN** a Kalibrr job has company `code`, numeric `id`, and `slug`, and no usable `apply_redirect_url`
- **THEN** the adapter sets `applyUrl` to `https://www.kalibrr.com/c/{code}/jobs/{id}/{slug}` and does not use `https://www.kalibrr.com/c/jobs/{id}`

#### Scenario: Kalibrr prefers apply redirect URL
- **WHEN** a Kalibrr job includes a non-empty absolute `apply_redirect_url`
- **THEN** the adapter sets `applyUrl` to that redirect URL

#### Scenario: Kalibrr job with no buildable URL
- **WHEN** a Kalibrr job has no usable `apply_redirect_url` and lacks company `code` or job `id`
- **THEN** the adapter omits that job from the fetch result

## ADDED Requirements

### Requirement: Kalibrr adapter filters inactive listings
The Kalibrr adapter SHALL omit jobs from the returned fetch set when `visibility` is present and not `public`, when `application_end_date` is in the past, or when the company is marked not visible or hidden.

#### Scenario: Expired application window
- **WHEN** a Kalibrr job has `application_end_date` earlier than the current UTC time
- **THEN** the adapter does not return that job

#### Scenario: Non-public visibility
- **WHEN** a Kalibrr job has `visibility` set to a value other than `public`
- **THEN** the adapter does not return that job

#### Scenario: Hidden company
- **WHEN** a Kalibrr job has `company.visible` false or `company_info.hidden` true
- **THEN** the adapter does not return that job

### Requirement: Non-Kalibrr adapters do not probe apply URLs
Remotive and other non-Kalibrr adapters SHALL map the API-provided apply URL as-is and SHALL NOT perform HTTP liveness checks.

#### Scenario: Remotive apply URL
- **WHEN** the Remotive adapter maps a job with a `url` field
- **THEN** the adapter sets `applyUrl` to that value without HTTP probing
