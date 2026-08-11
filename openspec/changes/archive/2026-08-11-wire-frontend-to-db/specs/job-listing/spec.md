## MODIFIED Requirements

### Requirement: Job list displays hardcoded postings
The system SHALL render a ranked list of job postings fetched from the backend API on the home page.

#### Scenario: Home page shows all jobs
- **WHEN** the user loads the home page and the API returns jobs
- **THEN** the system displays every returned job in list order with rank prefixes 1., 2., 3., …

#### Scenario: Job row shows rank
- **WHEN** a job is rendered in the list at position N (1-based)
- **THEN** the system displays N as the numeric rank prefix (e.g. "1."), not the job UUID

#### Scenario: Loading state while fetching
- **WHEN** the home page is loading job data from the API
- **THEN** the system displays a loading indicator instead of the job list

#### Scenario: Error state on fetch failure
- **WHEN** the API request fails or returns a non-success status
- **THEN** the system displays an error message and does not show stale hardcoded jobs

#### Scenario: Empty state when no jobs
- **WHEN** the API returns an empty jobs array
- **THEN** the system displays an empty-state message instead of job rows

### Requirement: Job row presents core fields
Each job row SHALL show the job title, company name, optional badge, and formatted metadata.

#### Scenario: Title and company display
- **WHEN** a job row is rendered
- **THEN** the system shows the job title as a link and the company name prefixed with "@"

#### Scenario: Optional badge display
- **WHEN** a job has remote work arrangement
- **THEN** the system displays badge label "Remote" inline after the company name

#### Scenario: Metadata line formatting
- **WHEN** a job row is rendered
- **THEN** the system displays a metadata line built from tag technologies (joined with " • "), optional salary, and optional relative posted-at text, omitting empty segments

### Requirement: Job title links to detail URL
Each job title SHALL link to a job detail path using the job id.

#### Scenario: Title href uses job id
- **WHEN** a user views a job title in the list
- **THEN** the title link target is `/job/{id}` for that job's UUID string id

## ADDED Requirements

### Requirement: Remotive attribution when Remotive jobs shown
When the job list includes one or more jobs with source `remotive`, the system SHALL display Remotive attribution with a link to https://remotive.com in the page footer.

#### Scenario: Remotive jobs present
- **WHEN** the fetched job list contains at least one job with source `remotive`
- **THEN** the footer includes visible attribution text and a link to Remotive

#### Scenario: No Remotive jobs
- **WHEN** the fetched job list contains no Remotive jobs
- **THEN** the footer does not include Remotive-specific attribution
