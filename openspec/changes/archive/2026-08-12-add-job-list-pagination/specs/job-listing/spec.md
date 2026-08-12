## MODIFIED Requirements

### Requirement: Job list displays fetched postings
The system SHALL render a ranked list of job postings on the home page, paginated by the job-list-pagination capability. In development (`import.meta.env.DEV`), the system SHALL fetch from the backend API at `/api/jobs`. In production builds, the system SHALL fetch from the static file at `${import.meta.env.BASE_URL}jobs.json`. The full fetched array is held in memory; only the current page slice is rendered.

#### Scenario: Home page shows first page of jobs
- **WHEN** the user loads the home page and the jobs endpoint returns jobs
- **THEN** the system displays the first 20 jobs in list order with rank prefixes 1., 2., 3., …

#### Scenario: Job row shows rank
- **WHEN** a job is rendered in the list at global position N (1-based)
- **THEN** the system displays N as the numeric rank prefix (e.g. "21." for the first job on page 2), not the job UUID

#### Scenario: Loading state while fetching
- **WHEN** the home page is loading job data
- **THEN** the system displays a loading indicator instead of the job list

#### Scenario: Error state on fetch failure
- **WHEN** the jobs request fails or returns a non-success status
- **THEN** the system displays an error message and does not show stale hardcoded jobs

#### Scenario: Empty state when no jobs
- **WHEN** the jobs endpoint returns an empty jobs array
- **THEN** the system displays an empty-state message instead of job rows

#### Scenario: Development uses backend API
- **WHEN** the app runs under the Vite dev server
- **THEN** the system requests `/api/jobs` (proxied to the local backend)

#### Scenario: Production uses static jobs.json
- **WHEN** the app runs as a production build
- **THEN** the system requests `${import.meta.env.BASE_URL}jobs.json`
