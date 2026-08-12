## MODIFIED Requirements

### Requirement: Search input accepts free-text query
The system SHALL provide a search field with placeholder text for jobs, companies, and technologies. Typing a query SHALL filter the job list to show only jobs whose title, company, or tags contain the query (case-insensitive).

#### Scenario: User types a query
- **WHEN** the user enters text in the search field
- **THEN** the system filters the displayed job list to only jobs matching the query against title, company, or tags (case-insensitive)

#### Scenario: Clear button appears with text
- **WHEN** the search field contains non-empty text
- **THEN** the system shows a clear control that resets the query to empty when activated, restoring the full job list (subject to active filters)

### Requirement: Category filter pills toggle selection
The system SHALL offer filter pills for remote, backend, frontend, fullstack, devops, and ai categories. Toggling filters SHALL filter the displayed job list.

#### Scenario: Filter pill toggles on click
- **WHEN** the user clicks an inactive filter pill
- **THEN** the system marks that filter as active and reduces the job list to jobs matching any active filter

#### Scenario: Active filter pill toggles off
- **WHEN** the user clicks an active filter pill
- **THEN** the system removes that filter from the active set and updates the job list accordingly

#### Scenario: Focus returns to search input after filter toggle
- **WHEN** the user toggles a filter pill
- **THEN** the system returns keyboard focus to the search input

## REMOVED Requirements

### Requirement: Search and filters do not affect the job list yet
**Reason**: Replaced by active filtering behavior in the modified requirements above.
**Migration**: No migration needed; the UI-only state is now wired to filter the job list.

## ADDED Requirements

### Requirement: Filter matching uses OR logic across categories
The system SHALL show a job if it matches any of the active filter categories (OR). The `remote` filter SHALL match jobs with a "Remote" badge. Other filters SHALL match case-insensitively against any tag in the job's stack.

#### Scenario: Multiple filters active
- **WHEN** the user activates both "backend" and "frontend" filters
- **THEN** the system shows jobs that match either "backend" or "frontend" in their tags

#### Scenario: Remote filter matches badge
- **WHEN** the user activates the "remote" filter
- **THEN** the system shows only jobs with the "Remote" badge

### Requirement: Query and filters combine with AND logic
The system SHALL require a job to match both the text query and at least one active filter when both are present.

#### Scenario: Query with active filter
- **WHEN** the user types "react" and activates the "frontend" filter
- **THEN** the system shows only jobs that contain "react" in title, company, or tags AND have a "frontend" tag

### Requirement: Pagination resets on filter or search change
The system SHALL reset the current page to 1 whenever the query or active filters change.

#### Scenario: User changes search while on page 3
- **WHEN** the user is on page 3 and types a new search query
- **THEN** the system resets to page 1 of the filtered results
