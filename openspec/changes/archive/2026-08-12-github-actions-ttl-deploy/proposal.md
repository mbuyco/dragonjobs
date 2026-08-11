## Why

The job board currently requires a backend server and database to serve jobs, which complicates deployment and adds operational overhead. By exporting jobs to a static JSON file during CI and gating deploys on actual data freshness, we can serve the board from pure static hosting while ensuring deploys only happen when there is meaningful new or refreshed data to present. This aligns deployment cost with data value and reduces unnecessary builds.

## What Changes

- Add a GitHub Actions workflow that runs the ingest pipeline on a schedule.
- Gate the deploy step so it only occurs when the ingest run produced changes (new inserts, TTL cleanup, or a source fetch that was outside its TTL window).
- Export the current job list to `frontend/public/jobs.json` as part of the workflow.
- The frontend reads `/jobs.json` instead of `/api/jobs`, eliminating the need for a backend runtime in production.
- No database, serverless functions, or backend hosting required in production.

## Capabilities

### New Capabilities
- `ci-deploy`: Automated CI workflow that ingests fresh jobs, exports them to static JSON, and conditionally deploys only when data has changed or TTL has expired.

### Modified Capabilities
- `job-lifecycle`: TTL semantics now directly control whether the deploy step runs; a deploy is triggered only when at least one source was outside its TTL window or when TTL cleanup deleted stale rows.

## Impact

- `backend/src/pipeline/ingest.ts` — expose whether the run changed data so the CI workflow can decide to deploy.
- `frontend/src/App.tsx` — switch the jobs fetch from `/api/jobs` to `/jobs.json`.
- New workflow file: `.github/workflows/refresh-jobs.yml`.
- No new runtime dependencies; no changes to database schema or source adapters.
