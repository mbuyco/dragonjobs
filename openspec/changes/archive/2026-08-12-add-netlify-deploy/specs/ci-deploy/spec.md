## ADDED Requirements

### Requirement: Netlify deployment is centralized in a reusable workflow
The system SHALL centralize Netlify deployment steps in a reusable workflow invoked via `workflow_call`. The workflow SHALL download the `jobs-json` artifact into `public/`, run `npm ci`, build the frontend with root base path (`npm run build -- --base /`), verify `dist/jobs.json` exists, and publish `dist/` to Netlify using `netlify-cli deploy --prod` with credentials from repository secrets `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID`.

#### Scenario: Reusable Netlify workflow executes production deploy
- **WHEN** a caller workflow invokes the Netlify reusable deploy workflow with `jobs-json` available
- **THEN** it builds with root base path, verifies `dist/jobs.json`, and runs `netlify-cli deploy --prod --dir=dist`

#### Scenario: Missing Netlify secrets fail the Netlify job
- **WHEN** the Netlify reusable deploy workflow runs without valid `NETLIFY_AUTH_TOKEN` or `NETLIFY_SITE_ID`
- **THEN** the Netlify deploy step exits with a non-zero status

### Requirement: Reusable Netlify deploy workflow serializes overlapping deploys
The system SHALL configure Netlify deployment concurrency in the reusable Netlify deploy workflow so only one Netlify publish is active at a time, using concurrency group `netlify` with `cancel-in-progress: true`.

#### Scenario: New Netlify deploy cancels in-progress Netlify deploy
- **WHEN** a new Netlify deploy run starts while another Netlify deploy run is in progress
- **THEN** the newer Netlify deploy proceeds and the in-progress Netlify deploy run is cancelled

### Requirement: Refresh-triggered Netlify deploy is gated on data changes
For refresh-triggered runs, the system SHALL invoke the Netlify reusable deploy workflow only when the ingest summary reports `dataChanged` true, matching the refresh GitHub Pages deploy gate.

#### Scenario: Inserts trigger Netlify deploy
- **WHEN** the ingest summary shows `inserted > 0` such that `dataChanged` is true
- **THEN** the refresh workflow invokes the Netlify reusable deploy workflow

#### Scenario: TTL cleanup triggers Netlify deploy
- **WHEN** the ingest summary shows `ttlDeleted > 0`
- **THEN** the refresh workflow invokes the Netlify reusable deploy workflow

#### Scenario: No data change skips Netlify deploy
- **WHEN** ingest inserts zero jobs and `ttlDeleted = 0`
- **THEN** the refresh workflow does not invoke the Netlify reusable deploy workflow

### Requirement: Push-to-main path deploys to Netlify
For push-to-main-triggered runs, the system SHALL invoke the Netlify reusable deploy workflow after ingest preparation completes, independently from refresh `dataChanged` gating, in parallel with the GitHub Pages reusable deploy workflow.

#### Scenario: Push to main triggers Netlify deploy
- **WHEN** a commit is pushed to `main`
- **THEN** the push deploy workflow prepares `jobs-json` and invokes the Netlify reusable deploy workflow alongside the Pages reusable deploy workflow

### Requirement: Netlify SPA deep links resolve to index.html
The system SHALL include a SPA fallback redirect rule in the static build output so Netlify serves `index.html` for unknown paths (e.g. future `/job/:id` and `/login` routes).

#### Scenario: Deep link serves the app shell
- **WHEN** a client requests a path that is not a static asset on the Netlify deployment
- **THEN** Netlify responds with `index.html` and HTTP status 200

## MODIFIED Requirements

### Requirement: Deployment logic is centralized in a reusable workflow
The system SHALL centralize GitHub Pages deployment steps in a reusable workflow invoked via `workflow_call`. Caller workflows SHALL prepare and publish a `jobs-json` artifact contract (using the shared ingest preparation contract) and delegate deployment to the reusable workflow so all deploy paths share one implementation. Caller workflows SHALL also invoke a separate Netlify reusable deploy workflow for parallel Netlify publishing when deploy conditions are met.

#### Scenario: Refresh caller invokes reusable deploy workflow
- **WHEN** the refresh workflow (`refresh-jobs.yml`) completes ingest/export and `dataChanged` is true
- **THEN** it uploads `public/jobs.json` as `jobs-json` and invokes the reusable deploy workflow

#### Scenario: Refresh caller invokes Netlify reusable deploy workflow
- **WHEN** the refresh workflow completes ingest/export and `dataChanged` is true
- **THEN** it uploads `public/jobs.json` as `jobs-json` and invokes the Netlify reusable deploy workflow

#### Scenario: Main push caller invokes reusable deploy workflow
- **WHEN** a push event targets `main` in the push deploy workflow (`deploy-on-main.yml`)
- **THEN** that workflow prepares `jobs-json` and invokes the same reusable deploy workflow

#### Scenario: Main push caller invokes Netlify reusable deploy workflow
- **WHEN** a push event targets `main` in the push deploy workflow (`deploy-on-main.yml`)
- **THEN** that workflow prepares `jobs-json` and invokes the Netlify reusable deploy workflow
