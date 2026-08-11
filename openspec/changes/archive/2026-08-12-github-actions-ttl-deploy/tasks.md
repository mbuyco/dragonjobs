## 1. Backend: Export and Summary Changes

- [x] 1.1 Add `backend/src/export-jobs.ts` that calls `listJobs(createDb())`, validates with `JobListResponse`, and writes JSON to a configurable output path
- [x] 1.2 Add `export:jobs` script to `backend/package.json` that runs `tsx src/export-jobs.ts`
- [x] 1.3 Add `dataChanged` boolean to `IngestSummary` in `backend/src/pipeline/ingest.ts`, computed from `ttlDeleted`, source `ttlSkipped`, and `inserted` counts
- [x] 1.4 Update `logIngestSummary` to log `dataChanged=true` or `dataChanged=false`

## 2. Frontend: Switch to Static JSON

- [x] 2.1 Change the jobs fetch URL in `src/App.tsx` from `/api/jobs` to `/jobs.json`
- [x] 2.2 Verify `public/jobs.json` is served correctly by running `npm run build` and checking the output

## 3. CI/CD: GitHub Actions Workflow

- [x] 3.1 Create `.github/workflows/refresh-jobs.yml` with scheduled and manual triggers
- [x] 3.2 Add steps to install dependencies, run migrations, run ingest, and export jobs
- [x] 3.3 Add conditional deploy logic that parses the ingest summary and commits only when `dataChanged=true`
- [x] 3.4 Configure the workflow to use `GITHUB_TOKEN` for committing `frontend/public/jobs.json`

## 4. Verification

- [x] 4.1 Run `npm run build` in the frontend and confirm `dist/jobs.json` exists
- [x] 4.2 Trigger the workflow manually in GitHub Actions and verify it commits `jobs.json` when data changes
- [x] 4.3 Verify the frontend loads jobs from `/jobs.json` when served from `dist/`
