## 1. Backend API setup

- [x] 1.1 Add `hono` and `@hono/node-server` dependencies to `backend/package.json`
- [x] 1.2 Add `serve` npm script pointing to `tsx src/server.ts`
- [x] 1.3 Create `backend/src/server.ts` with Hono app, CORS middleware, `GET /api/health`, and port from `PORT` env (default 3001)

## 2. Job query layer

- [x] 2.1 Create `backend/src/dto/job-list.dto.ts` with Zod schema for `JobListItem` (id, title, company, source, tags, applyUrl, optional salary/postedAt/workArrangement)
- [x] 2.2 Create `backend/src/db/list-jobs.ts` querying active jobs with tags, sorted by `posted_at DESC` then `fetched_at DESC`
- [x] 2.3 Wire `GET /api/jobs` in server to call list query and return `{ jobs: JobListItem[] }`

## 3. Frontend data fetching

- [x] 3.1 Change `Job.id` type from `number` to `string` in `src/App.tsx`
- [x] 3.2 Remove hardcoded `jobs` array; add fetch-on-mount with loading, error, and empty states
- [x] 3.3 Map API response to `Job` / `JobDetails` (tags → stack, workArrangement remote → badge, postedAt → relative time helper)
- [x] 3.4 Use list index + 1 for rank display instead of job id

## 4. Dev integration

- [x] 4.1 Add Vite dev proxy in `vite.config.ts` forwarding `/api` to `http://localhost:3001`
- [x] 4.2 Exclude `/api/*` from PWA Workbox cache (network-only for API routes)
- [x] 4.3 Update `backend/README.md` with serve + two-terminal dev workflow

## 5. Remotive attribution and polish

- [x] 5.1 Show Remotive footer attribution (link to https://remotive.com) when any fetched job has source `remotive`
- [x] 5.2 Add minimal CSS for loading, error, and empty states in `src/styles.css`

## 6. Verification

- [x] 6.1 Run `cd backend && npm run db:migrate && npm run ingest && npm run serve` and confirm `GET /api/jobs` returns data
- [x] 6.2 Run root `npm run build` and confirm TypeScript passes with no unused variables
- [x] 6.3 Manual smoke test: `npm run dev` with API running shows ingested jobs instead of demo data
