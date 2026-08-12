## Why

DragonJobs currently deploys only to GitHub Pages. Netlify's free tier offers an alternative static host with automatic HTTPS, deploy previews, and optional custom domains — useful for migration, redundancy, or a cleaner production URL. The app is already a static Vite build with CI-generated `jobs.json`, so adding Netlify requires no backend runtime changes.

## What Changes

- Add a reusable GitHub Actions workflow that builds the frontend with `base: '/'` and deploys `dist/` to Netlify via `netlify-cli`
- Wire the new workflow into existing caller workflows (`refresh-jobs.yml`, `deploy-on-main.yml`) alongside the current GitHub Pages deploy
- Add SPA redirect rules so future deep links (`/job/:id`, `/login`) resolve correctly on Netlify
- Document required GitHub secrets (`NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`) for operators
- Keep GitHub Pages deploy unchanged (dual deploy during migration)

## Capabilities

### New Capabilities

_(none — Netlify deploy extends existing CI/deploy behavior)_

### Modified Capabilities

- `ci-deploy`: Add parallel Netlify deployment path with separate base-path build, Netlify secrets, and refresh/main caller integration while preserving existing GitHub Pages behavior

## Impact

- **Workflows**: New `deploy-netlify-reusable.yml`; updates to `refresh-jobs.yml` and `deploy-on-main.yml`
- **Static assets**: New `public/_redirects` (and optional `netlify.toml`)
- **Secrets**: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID` in GitHub repository settings
- **Build**: Second frontend build per deploy (Pages uses project subpath base; Netlify uses root base)
- **Unchanged**: Ingest pipeline, SQLite cache, `jobs.json` export, GitHub Pages reusable workflow
