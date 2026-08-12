## Why

The SearchBar component renders search input and filter pills but they are UI-only — toggling filters or typing a query has no effect on the job list. Users expect these controls to actually filter jobs.

## What Changes

- Lift `query` and `activeFilters` state from `SearchBar` up to `App` so the job list can consume them.
- Add a `filteredJobs` derivation that applies text search and category filters to the loaded jobs.
- Text search matches case-insensitively against job title, company, and tags.
- The `remote` filter matches jobs with `badge === 'Remote'`; other filters (`backend`, `frontend`, `fullstack`, `devops`, `ai`) match case-insensitively against tag entries.
- Multiple active filters use OR logic; query and filters combine with AND.
- Reset pagination to page 1 when search or filters change.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `search-filter`: The requirement "search and filters do not affect the job list yet" is replaced with active filtering and search behavior that reduces the displayed job list.

## Impact

- `src/App.tsx`: `SearchBar` component signature changes (receives props instead of owning state). `App` gains filtering logic and passes `filteredJobs` to pagination and rendering.
- No new dependencies, no API changes, no backend impact.
