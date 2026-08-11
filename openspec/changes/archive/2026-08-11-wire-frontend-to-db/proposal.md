## Why

DragonJobs ingest pipeline now persists real listings in `backend/data/dragonjobs.db`, but the React app still renders a hardcoded `jobs` array in `App.tsx`. Users see stale demo data instead of ingested Kalibrr and Remotive listings. Wiring the frontend to the database completes the MVP data loop started in the ingest change.

## What Changes

- Add a backend HTTP read API that queries active jobs from SQLite and returns a JSON list shaped for the frontend
- Replace the hardcoded `jobs` array with client-side fetch on app load (loading and error states)
- Map DB fields (`job_tags`, `salary`, `posted_at`, `work_arrangement`, source) to the existing `Job` / `JobDetails` display model
- Configure Vite dev proxy so the frontend can call the API during local development
- **BREAKING**: Job ids change from numeric demo values to UUID strings from the database; `/job/{id}` links use the new ids
- Add Remotive attribution when Remotive-sourced jobs appear in the list (required by Remotive API terms)

## Capabilities

### New Capabilities

- `job-read-api`: HTTP endpoints to list and optionally fetch single jobs from SQLite for the frontend

### Modified Capabilities

- `job-listing`: Job list source changes from static in-memory array to API-fetched data; loading/error/empty states; UUID ids; Remotive attribution

## Impact

- **Backend**: New HTTP server module, job query layer, `JobListItem` response DTO, npm script to run API alongside ingest
- **Frontend**: `App.tsx` data fetching, remove hardcoded array, optional loading/error UI, Vite proxy config
- **Specs**: Delta updates to `job-listing` and `search-filter`; new `job-read-api` spec
- **Dependencies**: Lightweight HTTP framework in backend (e.g. Hono or Node built-in `http`); no new frontend deps
- **Dev workflow**: Run backend API + `npm run dev` together; ingest still populates DB via `npm run ingest`
- **Unchanged**: Ingest pipeline, source adapters, PWA shell, client navigation (detail/login pages still not implemented)
