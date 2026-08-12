## Context

`SearchBar` in `src/App.tsx` maintains `query` and `activeFilters` as local state. These values never leave the component, so the job list always shows all jobs. The `FILTERS` constant and `Filter` type already define the canonical filter set: `remote`, `backend`, `frontend`, `fullstack`, `devops`, `ai`.

Jobs are loaded as `JobListItem[]` and converted via `toJob()` into `Job` objects. Tags live in `job.details.stack`, work arrangement is mapped to `job.details.badge` (e.g. `"Remote"`).

## Goals / Non-Goals

**Goals:**
- Filters and search actually reduce the displayed job list.
- Pagination adapts to filtered results (count, page reset).

**Non-Goals:**
- URL-based filter state or deep linking.
- Debounced or server-side search.
- Fuzzy matching or relevance ranking.

## Decisions

**Lift state to App, pass via props.** `App` owns `query` and `activeFilters`; `SearchBar` receives them plus callbacks. This is the simplest approach — no context, no external state library. The alternative (a shared context) adds indirection for a single consumer.

**Filter matching strategy.** The `remote` filter matches `job.details.badge === 'Remote'` because work arrangement is already normalized there. All other filters match case-insensitively against any entry in `job.details.stack` (tags). This reuses existing data without new fields.

**OR across filters, AND with query.** When multiple filters are active, a job matches if it satisfies any filter (OR). When both query and filters are present, both must match (AND). This matches common job-board UX.

**Derive filteredJobs inline.** `filteredJobs` is computed on each render from `jobs`, `query`, and `activeFilters`. With hundreds of jobs this is negligible; `useMemo` can be added later if profiling shows a need.

## Risks / Trade-offs

- [Tag mismatch] Filter names may not exactly match tag strings from ingest (e.g. `"Back End"` vs `"backend"`). Mitigation: case-insensitive substring match against tags.
- [No empty-state messaging] Filtering to zero results shows the generic "No jobs found" message. Acceptable for now; a "No matching jobs" variant can be added separately.
