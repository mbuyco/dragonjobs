## Context

The job list in `src/App.tsx` currently renders every job returned from `/api/jobs` (dev) or `/jobs.json` (prod) in a single flat list. There is no pagination. As the dataset grows beyond a few dozen entries, the page becomes unwieldy. The search/filter UI exists but is not yet wired to the list.

## Goals / Non-Goals

**Goals:**
- Slice the in-memory `jobs` array into pages of 20 and render only the current page
- Show a pagination bar with Prev/Next and numbered page buttons (ellipsis for large counts)
- Display a count line ("Showing 1–20 of N jobs") to orient the user
- Rank numbers continue to reflect global position (e.g. page 2 starts at 21.)
- Scroll to top when navigating between pages
- Hide the pagination bar when there is only one page

**Non-Goals:**
- Server-side pagination (not possible with a static `jobs.json` on GitHub Pages)
- URL-based page state (`?page=2`) — not in scope for this change
- Integrating pagination with the search/filter state (search/filter is not yet wired)
- Adding new dependencies

## Decisions

### Client-side slicing over URL params

The jobs payload is fetched once and held in state. Slicing with `Array.prototype.slice` is trivial and keeps the implementation self-contained. URL-based page state would require either a routing library or careful `popstate` handling; that complexity belongs in a separate change once routing is introduced.

### PAGE_SIZE = 20

Twenty jobs per page is a common default for developer job boards (e.g. HN Who's Hiring, Remotive). It keeps the list scannable without excessive clicking. The constant is defined at module level for easy future adjustment.

### Ellipsis strategy for page buttons

When `pageCount > 7`, show: first page, ellipsis, up to 3 pages around current, ellipsis, last page. This is a standard windowing pattern that keeps the bar compact. Fewer than 8 pages renders all buttons directly.

### Scroll to top on page change

Calling `window.scrollTo({ top: 0, behavior: 'smooth' })` on page change matches the expectation that navigating to a new page brings you to the top of that page. This is unconditional — no need to check scroll position.

### Inline Pagination component

The `Pagination` component is defined in `App.tsx` alongside `SearchBar` and `DragonLogo`. There is no file-splitting convention in this codebase (everything lives in `App.tsx`), so consistency wins over separation.

## Risks / Trade-offs

- [Risk] Page state is lost on full page reload → Mitigation: Acceptable for now; URL-based state is a follow-up.
- [Risk] When search/filter is eventually wired, `page` must reset to 1 on query change → Mitigation: Document this in code; the reset is a one-liner (`setPage(1)`) when that work happens.
- [Risk] Very large `pageCount` produces many ellipsis transitions → Mitigation: The 7-button window cap handles this gracefully.
