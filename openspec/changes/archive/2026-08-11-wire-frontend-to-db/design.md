## Context

The ingest pipeline (completed) writes validated jobs to SQLite at `backend/data/dragonjobs.db`. The React frontend still renders ten hardcoded demo jobs from a static array in `App.tsx`. There is no HTTP server, no fetch logic, and no shared types between backend and frontend packages.

The existing `Job` interface uses `id: number` and `JobDetails` with `stack`, `salary`, `postedAt`, and `badge`. The database uses UUID string ids, relational tags in `job_tags`, ISO date strings for `posted_at`, and `work_arrangement` instead of a free-form badge.

## Goals / Non-Goals

**Goals:**

- Expose active jobs from SQLite via a read-only HTTP API the frontend can call
- Replace the hardcoded array with fetched data while preserving the current row layout and `formatMeta` behavior
- Map DB fields to the frontend display model (tags → stack, work arrangement → badge, relative posted time)
- Support local dev with Vite proxy (`/api` → backend server)
- Show loading and error UI when fetch is in progress or fails
- Display Remotive attribution in the footer when any Remotive jobs are shown

**Non-Goals:**

- Search/filter wiring (UI state stays local; list shows all fetched jobs)
- Job detail page (`/job/:id` view still not implemented)
- Authentication, pagination UI, or infinite scroll
- Production deployment topology (reverse proxy, CDN, separate hosts)
- Build-time static JSON export as the primary data path
- Cross-source fuzzy deduplication or ranking algorithm

## Decisions

### 1. Lightweight HTTP server in backend (Hono + @hono/node-server)

**Choice:** Add Hono with `@hono/node-server` in `backend/src/server.ts`, started via `npm run serve`.

**Rationale:** Minimal routing/CORS/JSON helpers; fits Node ESM; easy to add `GET /api/jobs` and health check. Keeps read path separate from ingest CLI.

**Alternatives considered:** Node built-in `http` (zero deps but verbose); embedding API in Vite (couples frontend dev server to DB); build-time JSON dump (stale until rebuild, no live dev loop).

### 2. Single list endpoint with joined tags

**Choice:** `GET /api/jobs` returns `{ jobs: JobListItem[] }` where each item includes id, title, company, salary, postedAt (ISO), workArrangement, source, tags[], applyUrl. Query: active jobs ordered by `posted_at DESC NULLS LAST`, then `fetched_at DESC`. Tags loaded via Drizzle relation or a single query with aggregation.

**Rationale:** One round trip for the home page; frontend maps to display model. Detail endpoint deferred until detail page exists.

### 3. Shared response DTO validated with Zod

**Choice:** Define `JobListItemDto` in `backend/src/dto/job-list.dto.ts` (Zod schema + inferred type). API serializes validated rows.

**Rationale:** Consistent with ingest DTO pattern; catches mapping bugs at the boundary.

### 4. Frontend fetch on mount with rank from index

**Choice:** `App` uses `useEffect` + `fetch('/api/jobs')`. Change `Job.id` to `string` (UUID). Display rank as `index + 1`, not the id value.

**Rationale:** Preserves visual rank ordering without misusing UUIDs as display numbers.

**Field mapping:**

| DB / API | Frontend display |
|---|---|
| `tags[]` | `details.stack` |
| `salary` | `details.salary` |
| `postedAt` | `details.postedAt` (relative, e.g. "2 days ago") |
| `workArrangement === 'remote'` | `details.badge = 'Remote'` |
| other arrangements | no badge (or capitalize arrangement if present) |
| `source === 'remotive'` | triggers footer attribution |

### 5. Vite dev proxy

**Choice:** Add to `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:3001', changeOrigin: true },
  },
},
```

Backend default port `3001` via `PORT` env var.

**Rationale:** Frontend keeps relative `/api/jobs` URLs; no CORS issues in dev; production can use same path behind a reverse proxy.

### 6. CORS enabled on API for preview/production flexibility

**Choice:** Hono CORS middleware allowing the Vite dev origin and same-origin in preview.

**Rationale:** Supports `vite preview` and future split hosting without blocking fetch.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| API not running during dev shows empty/error state | Document two-terminal workflow; health check endpoint; clear error message in UI |
| UUID ids break existing `/job/1` bookmarks | Acceptable MVP break; detail page not implemented yet |
| Relative time formatting edge cases | Simple helper (hours/days); fall back to ISO date string |
| Remotive attribution omitted | Spec requirement + footer link when Remotive jobs present |
| PWA service worker caches stale API responses | Exclude `/api/*` from Workbox cache (network-only for API) |
| Large job lists slow initial render | Acceptable for MVP; pagination deferred |

## Migration Plan

1. Add backend serve script and `GET /api/jobs` query layer
2. Add Vite proxy and frontend fetch logic
3. Remove hardcoded `jobs` array from `App.tsx`
4. Update `job-listing` spec via delta; archive change
5. Dev workflow: `cd backend && npm run db:migrate && npm run ingest && npm run serve` + root `npm run dev`

**Rollback:** Revert frontend to hardcoded array; stop API server. Ingest pipeline unaffected.

## Open Questions

- Should root `package.json` add a convenience script (`dev:all`) to run API + Vite together?
- Numeric rank vs. posted-date order only — confirm descending `posted_at` is acceptable default sort
- Include `applyUrl` in list response now (for future detail/apply) or omit until detail page?
