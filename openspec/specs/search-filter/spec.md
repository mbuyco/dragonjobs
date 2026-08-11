# search-filter

## Purpose

Define the search and category filter controls shown above the job list, including query input, clear action, and multi-select filter pills for developer job categories.

## Requirements

### Requirement: Search input accepts free-text query
The system SHALL provide a search field with placeholder text for jobs, companies, and technologies.

#### Scenario: User types a query
- **WHEN** the user enters text in the search field
- **THEN** the system updates the local query state to match the input value

#### Scenario: Clear button appears with text
- **WHEN** the search field contains non-empty text
- **THEN** the system shows a clear control that resets the query to empty when activated

### Requirement: Category filter pills toggle selection
The system SHALL offer filter pills for remote, backend, frontend, fullstack, devops, and ai categories.

#### Scenario: Filter pill toggles on click
- **WHEN** the user clicks an inactive filter pill
- **THEN** the system marks that filter as active and updates its pressed state for accessibility

#### Scenario: Active filter pill toggles off
- **WHEN** the user clicks an active filter pill
- **THEN** the system removes that filter from the active set and updates its pressed state

#### Scenario: Focus returns to search input after filter toggle
- **WHEN** the user toggles a filter pill
- **THEN** the system returns keyboard focus to the search input

### Requirement: Search and filters do not affect the job list yet
The search query and active filters SHALL be maintained in local UI state only and MUST NOT filter or reorder the displayed job list.

#### Scenario: List unchanged while searching
- **WHEN** the user types a query or toggles filter pills
- **THEN** the job list continues to show all jobs from the static array in their original order
