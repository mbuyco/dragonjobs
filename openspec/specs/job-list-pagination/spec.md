# job-list-pagination

## Purpose

Define how DragonJobs paginates the job list, including page size, navigation controls, rank numbering, and result count display.

## Requirements

### Requirement: Job list is paginated into pages of 20
The system SHALL split the full in-memory job array into pages of 20 jobs each. Only the jobs belonging to the current page SHALL be rendered in the list. The default page on load SHALL be page 1.

#### Scenario: First page shows first 20 jobs
- **WHEN** the jobs array contains more than 20 entries and the user is on page 1
- **THEN** the system renders exactly 20 job rows (jobs 1–20)

#### Scenario: Last page shows remaining jobs
- **WHEN** the user navigates to the last page
- **THEN** the system renders only the remaining jobs (which may be fewer than 20)

#### Scenario: Single page hides pagination controls
- **WHEN** the total number of jobs is 20 or fewer
- **THEN** the system does not render the pagination bar

### Requirement: Rank numbers reflect global position across pages
Each job row's rank number SHALL reflect its position in the full dataset, not its position on the current page.

#### Scenario: Second page starts at rank 21
- **WHEN** the user is on page 2 with PAGE_SIZE of 20
- **THEN** the first job row on that page displays rank "21."

### Requirement: Pagination bar provides navigation controls
The system SHALL render a pagination bar below the job list with Prev, numbered page buttons, and Next controls. The active page SHALL be visually distinguished. Prev SHALL be disabled on page 1; Next SHALL be disabled on the last page.

#### Scenario: Prev disabled on first page
- **WHEN** the user is on page 1
- **THEN** the Prev button is disabled and cannot be clicked to navigate

#### Scenario: Next disabled on last page
- **WHEN** the user is on the last page
- **THEN** the Next button is disabled and cannot be clicked to navigate

#### Scenario: Clicking a page number navigates to that page
- **WHEN** the user clicks a numbered page button
- **THEN** the system renders the jobs for that page and scrolls to the top of the page

#### Scenario: Ellipsis shown for large page counts
- **WHEN** the total page count exceeds 7
- **THEN** the pagination bar shows the first page, an ellipsis, up to 3 pages around the current page, an ellipsis, and the last page

### Requirement: Result count is displayed
The system SHALL display a count line showing the range of jobs currently visible and the total job count (e.g. "Showing 1–20 of 143 jobs").

#### Scenario: Count line reflects current page range
- **WHEN** the user is on page 2 with PAGE_SIZE of 20 and 143 total jobs
- **THEN** the count line reads "Showing 21–40 of 143 jobs"

### Requirement: Page navigation scrolls to top
The system SHALL scroll the page to the top whenever the user navigates to a different page.

#### Scenario: Scroll on page change
- **WHEN** the user clicks Prev, Next, or a numbered page button
- **THEN** the window scrolls to the top of the page
