# job-listing

## Purpose

Define how DragonJobs displays the developer job board list on the home page, including the job data model and row layout for title, company, badges, and metadata.

## Requirements

### Requirement: Job list displays hardcoded postings
The system SHALL render a ranked list of job postings from a static in-memory array on the home page.

#### Scenario: Home page shows all jobs
- **WHEN** the user loads the home page
- **THEN** the system displays every job in the static jobs array in ascending rank order

#### Scenario: Job row shows rank
- **WHEN** a job is rendered in the list
- **THEN** the system displays the job id as a numeric rank prefix (e.g. "1.")

### Requirement: Job row presents core fields
Each job row SHALL show the job title, company name, optional badge, and formatted metadata.

#### Scenario: Title and company display
- **WHEN** a job row is rendered
- **THEN** the system shows the job title as a link and the company name prefixed with "@"

#### Scenario: Optional badge display
- **WHEN** a job has a badge in its details
- **THEN** the system displays the badge label inline after the company name

#### Scenario: Metadata line formatting
- **WHEN** a job row is rendered
- **THEN** the system displays a metadata line built from stack technologies (joined with " • "), optional salary, and optional posted-at text, omitting empty segments

### Requirement: Job title links to detail URL
Each job title SHALL link to a job detail path using the job id.

#### Scenario: Title href uses job id
- **WHEN** a user views a job title in the list
- **THEN** the title link target is `/job/{id}` for that job's numeric id
