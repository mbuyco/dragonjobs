## 1. Lift state to App

- [x] 1.1 Add `query`, `setQuery`, `activeFilters`, `setActiveFilters` state to `App` component
- [x] 1.2 Define `SearchBarProps` interface with `query`, `onQueryChange`, `activeFilters`, `onToggleFilter`
- [x] 1.3 Update `SearchBar` to accept props and remove its local state

## 2. Filtering logic

- [x] 2.1 Add `filteredJobs` derivation in `App` that applies text search (case-insensitive match against title, company, tags) and category filters (`remote` matches badge, others match tags via OR; query AND filters)
- [x] 2.2 Replace `jobs` with `filteredJobs` in `pageCount`, `pageJobs`, `showStart`, `showEnd`, and "Showing X of Y" display

## 3. Pagination reset

- [x] 3.1 Reset `page` to 1 when `query` or `activeFilters` changes (either inline in setters or via useEffect)

## 4. Verification

- [x] 4.1 Run `npm run build` and confirm no type errors
