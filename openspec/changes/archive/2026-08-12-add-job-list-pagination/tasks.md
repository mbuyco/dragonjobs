## 1. App State and Data Slicing

- [x] 1.1 Add `PAGE_SIZE = 20` constant near `FILTERS` in `src/App.tsx`
- [x] 1.2 Add `const [page, setPage] = useState(1)` to the `App` component
- [x] 1.3 Derive `pageCount = Math.ceil(jobs.length / PAGE_SIZE)` and `pageJobs = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)`
- [x] 1.4 Update the job list render to iterate `pageJobs` instead of `jobs`
- [x] 1.5 Update rank display to use global position: `(page - 1) * PAGE_SIZE + index + 1`

## 2. Pagination Component

- [x] 2.1 Create a `Pagination` component in `src/App.tsx` that accepts `page`, `pageCount`, and `onPageChange` props
- [x] 2.2 Implement Prev and Next buttons; disable Prev on page 1 and Next on the last page
- [x] 2.3 Implement page number button generation with ellipsis for `pageCount > 7` (show first, up to 3 around current, last)
- [x] 2.4 Call `window.scrollTo({ top: 0, behavior: 'smooth' })` inside `onPageChange` before updating state
- [x] 2.5 Hide the entire `Pagination` component when `pageCount <= 1`

## 3. Result Count Line

- [x] 3.1 Add a count line above or below the job list showing "Showing X–Y of N jobs" derived from `page`, `PAGE_SIZE`, and `jobs.length`
- [x] 3.2 Hide the count line when there are no jobs or while loading

## 4. CSS Styles

- [x] 4.1 Add `.pagination` styles to `src/styles.css` (flex row, centered, gap, padding)
- [x] 4.2 Add `.pagination-btn` base styles (dark theme, matching existing button aesthetic)
- [x] 4.3 Add `.pagination-btn.active` styles (crimson `#8B0000` background, white text)
- [x] 4.4 Add `.pagination-btn:disabled` styles (muted color, no pointer cursor)
- [x] 4.5 Add `.pagination-info` styles (small grey centered text)

## 5. Verification

- [x] 5.1 Run `npm run build` and confirm it passes with no TypeScript errors
- [x] 5.2 Manually verify page 1 shows jobs 1–20, page 2 shows 21–40, rank numbers are correct
- [x] 5.3 Verify Prev is disabled on page 1, Next is disabled on the last page
- [x] 5.4 Verify pagination bar is hidden when total jobs ≤ 20
