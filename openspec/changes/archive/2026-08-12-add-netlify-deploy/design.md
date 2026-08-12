## Context

DragonJobs production is a static Vite/React PWA. CI runs ingest, exports `public/jobs.json`, builds `dist/`, and deploys to GitHub Pages via reusable workflows. [`vite.config.ts`](../../../vite.config.ts) sets `base` to `/${repo}/` when `GITHUB_ACTIONS=true` for project Pages URLs. Netlify serves from the site root and requires `base: '/'`. The user wants dual deploy: keep Pages and add Netlify on the free plan, with GitHub Actions continuing to own ingest and deploy (Netlify auto-builds disabled).

## Goals / Non-Goals

**Goals:**

- Deploy the same `jobs-json` artifact to Netlify after every Pages-eligible deploy
- Build a Netlify-specific bundle with root base path so assets and `jobs.json` resolve correctly
- Support SPA deep links on Netlify via redirect rules
- Require only standard Netlify free-tier credentials (auth token + site ID)

**Non-Goals:**

- Replacing or removing GitHub Pages
- Running ingest on Netlify build infrastructure
- Netlify Functions, edge handlers, or backend runtime
- Changing ingest, SQLite cache, or `dataChanged` gating logic
- Committing `public/jobs.json` to the repository

## Decisions

### 1. GitHub Actions deploys to Netlify via `netlify-cli`

- **Rationale**: Matches the existing Pages pattern (reusable workflow, `jobs-json` artifact, no committed secrets in repo). Netlify free tier has no built-in cron; scheduled refresh stays in GitHub Actions.
- **Alternatives**: Netlify Git integration with extended build command running ingest — rejected because `better-sqlite3` native compile and lack of SQLite cache make cold ingest on every Netlify build fragile and slow.

### 2. Separate build with `--base /` for Netlify

- **Rationale**: A single build cannot serve both GitHub Pages (`/dragonjobs/`) and Netlify (`/`). The Netlify reusable workflow runs `npm run build -- --base /` after downloading `jobs-json`.
- **Alternatives**: Env-driven `vite.config.ts` refactor (`DEPLOY_TARGET=netlify`) — deferred; CLI override is sufficient and avoids config churn.

### 3. Dual parallel deploy jobs in caller workflows

- **Rationale**: `refresh-jobs.yml` and `deploy-on-main.yml` invoke both `deploy-pages-reusable.yml` and `deploy-netlify-reusable.yml` after ingest. Refresh Netlify deploy uses the same `dataChanged` gate as Pages.
- **Alternatives**: Single workflow deploying to both targets sequentially — rejected; parallel jobs are faster and isolate failure domains.

### 4. SPA fallback via `public/_redirects`

- **Rationale**: Vite copies `public/` to `dist/`. Netlify honors `_redirects` for client-side routes (`/job/:id`, `/login`) without server config.
- **Alternatives**: `netlify.toml` redirects only — acceptable supplement; `_redirects` is the minimal portable choice.

### 5. Netlify site with builds stopped

- **Rationale**: Prevents Netlify from building on push without `jobs.json`, which would produce a broken site. All publishes come from GitHub Actions.
- **Alternatives**: Netlify build hook triggered from GHA — unnecessary when CLI deploy uploads `dist/` directly.

### 6. Separate concurrency group for Netlify deploys

- **Rationale**: Pages deploy uses group `pages` with `cancel-in-progress: true`. Netlify uses group `netlify` so a Pages cancel does not abort an in-flight Netlify publish (and vice versa).

## Risks / Trade-offs

- **[Risk] Double build minutes on every deploy** → Acceptable: each build is ~1–2 min; dual deploy only runs when Pages would have deployed anyway.
- **[Risk] Netlify secrets missing or expired** → Mitigation: Netlify job fails independently; Pages deploy still succeeds. Document secrets in README/backend deploy section.
- **[Risk] `netlify-cli` version drift** → Mitigation: Pin major version in workflow (`npx netlify-cli@23`) or add as devDependency later.
- **[Risk] PWA scope mismatch if base override forgotten** → Mitigation: `--base /` updates manifest `start_url`/`scope` via existing Vite PWA plugin config.

## Migration Plan

1. Operator creates Netlify site, disables auto-builds, adds `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` to GitHub secrets.
2. Merge workflow and `_redirects` changes; push to `main` or dispatch **Deploy On Main**.
3. Verify Netlify URL loads jobs; confirm Pages URL still works at subpath.
4. Optionally attach custom domain on Netlify; Pages URL remains until explicitly retired.

**Rollback**: Remove Netlify deploy jobs from caller workflows; delete or ignore Netlify site. Pages deploy is untouched.

## Open Questions

- None blocking implementation. Optional follow-up: document Netlify setup in README and retire Pages when migration is complete.
