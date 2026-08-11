## Context

DragonJobs is a single-page React 19 job board with a Node.js/Hono backend that reads from a local SQLite database. The goal is to eliminate the need for a backend runtime in production by exporting jobs to a static JSON file during CI. The GitHub Actions workflow will run the ingest pipeline, export jobs to `frontend/public/jobs.json`, and conditionally commit/push only when the data has changed or TTL has expired, which triggers a static-site deploy.

Current relevant state:
- Ingest already has a TTL gate that skips source fetches when `synced_at` is within `JOB_TTL_HOURS`.
- Ingest already returns a summary with `ttlSkipped`, `inserted`, and `ttlDeleted` counts.
- Frontend currently fetches `/api/jobs` from the Hono server.
- Vite serves `public/` as static assets in the build output.

## Goals / Non-Goals

**Goals:**
- Run `npm run ingest` in GitHub Actions on a schedule.
- Export jobs to `frontend/public/jobs.json` after ingest.
- Commit and push `jobs.json` only when the ingest run produced meaningful changes (new inserts, TTL deletions, or a source fetch outside its TTL window).
- Change the frontend to load jobs from `/jobs.json` instead of `/api/jobs`.
- Enable pure static hosting of the frontend with no backend dependency.

**Non-Goals:**
- Real-time job updates.
- Server-side search or pagination.
- Changing the database, schema, or source adapters.
- Migrating existing backend hosting for local development.

## Decisions

### Decision: Frontend reads `/jobs.json` instead of `/api/jobs`
- **Rationale**: Eliminates the need for a backend runtime in production. The existing `JobListResponse` Zod schema already matches the JSON shape, so no frontend parsing changes are needed beyond the fetch URL.
- **Alternatives considered**: Keep the backend API and deploy it as a serverless function. Rejected because it adds hosting complexity and cold-start risk for a read-only endpoint.

### Decision: Workflow commits `jobs.json` only when data changed
- **Rationale**: Avoids unnecessary deploys and respects rate limits on source APIs. The deploy is gated on whether ingest actually changed state.
- **Alternatives considered**: Deploy on every schedule run regardless of changes. Rejected because it wastes deploy minutes and creates noisy commits.

### Decision: Ingest summary drives the deploy decision
- **Rationale**: The summary already tracks `ttlSkipped`, `inserted`, and `ttlDeleted`. A deploy is warranted if any source was not TTL-skipped (meaning data may have changed) or if TTL deleted rows.
- **Alternatives considered**: Compare old and new JSON diffs. Rejected because summary flags are cheaper to compute and already available.

### Decision: Export script writes to `public/jobs.json`
- **Rationale**: Vite copies `public/` into `dist/` unchanged, so `/jobs.json` is available as a static asset without extra routing or middleware.
- **Alternatives considered**: Write JSON to `src/data/jobs.json` and import it at build time. Rejected because it requires a frontend rebuild for every data refresh, whereas a static `public/` file can be committed and deployed independently.

## Risks / Trade-offs

- **Risk**: GitHub Actions runs on a public IP that Remotive or Kalibrr may rate-limit.
  - **Mitigation**: The ingest pipeline already logs per-source fetch failures and continues gracefully. Workflow runs on a schedule, not per-request, so rate-limit risk is bounded.

- **Risk**: Stale `jobs.json` between workflow runs.
  - **Mitigation**: Schedule runs every 3 hours. TTL defaults to 24 hours, so data stays fresh relative to source update frequency.

- **Risk**: Large `jobs.json` slows static hosting or CDN caching.
  - **Mitigation**: Even with thousands of jobs, the JSON file stays well under typical static-asset limits. CDN caching headers can be tuned at the host level if needed.

- **Risk**: Frontend fetch fails if `jobs.json` is missing.
  - **Mitigation**: The frontend already handles load/error states and shows a fallback message when no jobs are available.
