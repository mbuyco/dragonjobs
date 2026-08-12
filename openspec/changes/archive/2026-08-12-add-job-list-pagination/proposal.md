## Why

The job list renders all available jobs in a single unbounded scroll, which degrades usability and perceived performance as the dataset grows. Pagination lets users navigate a manageable page of results and gives the UI a clear sense of scale.

## What Changes

- Add a `PAGE_SIZE` constant (20 jobs per page) to `src/App.tsx`
- Add `page` state to the `App` component; derive `pageJobs` slice and `pageCount`
- Render only the current page's jobs; update rank numbers to reflect global position
- Add a `Pagination` component with Prev/Next buttons, numbered page buttons, and ellipsis for large page counts; scrolls to top on page change
- Show a count line ("Showing 1–20 of N jobs") above or below the list
- Add pagination CSS classes to `src/styles.css` (dark theme, crimson active state)

## Capabilities

### New Capabilities

- `job-list-pagination`: Client-side pagination of the job list — slicing the full in-memory jobs array by page, rendering navigation controls, and displaying a result count.

### Modified Capabilities

- `job-listing`: The job list rendering changes from showing all jobs to showing a paginated slice; rank numbers now reflect global position across pages.

## Impact

- `src/App.tsx`: new state, derived values, updated render, new `Pagination` component
- `src/styles.css`: new `.pagination`, `.pagination-btn`, `.pagination-info` classes
- No backend, API, or data-fetching changes required
- No new dependencies
