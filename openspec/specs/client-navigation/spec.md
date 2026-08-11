# client-navigation

## Purpose

Define how DragonJobs handles browser URLs and navigation using plain anchor links and minimal client-side path tracking, without a routing library or path-based view rendering.

## Requirements

### Requirement: Navigation uses plain anchor links
The system SHALL use standard HTML anchor elements for in-app navigation targets instead of a client-side router.

#### Scenario: Job list links use path URLs
- **WHEN** job titles or header links are rendered
- **THEN** navigation targets use absolute paths such as `/`, `/login`, and `/job/{id}`

### Requirement: Browser history updates are observed
The application SHALL subscribe to `popstate` events so back and forward navigation can update internal path state.

#### Scenario: Popstate updates path state
- **WHEN** the user navigates with the browser back or forward buttons
- **THEN** the application updates its tracked pathname to match `window.location.pathname`

### Requirement: Path-based views are not rendered yet
The application SHALL NOT render distinct page views based on the current pathname; only the home job list shell is implemented.

#### Scenario: Job detail path shows home shell
- **WHEN** the user navigates to `/job/{id}` within the SPA without a full document load
- **THEN** the application continues to render the home page shell rather than a job detail view

#### Scenario: Login path shows home shell
- **WHEN** the user navigates to `/login` within the SPA without a full document load
- **THEN** the application continues to render the home page shell rather than a login view
