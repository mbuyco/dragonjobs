## 1. Static assets for Netlify

- [x] 1.1 Add `public/_redirects` with SPA fallback (`/* /index.html 200`)
- [x] 1.2 Add optional `netlify.toml` with publish directory and redirect rule

## 2. Netlify reusable deploy workflow

- [x] 2.1 Create `.github/workflows/deploy-netlify-reusable.yml` with concurrency group `netlify`
- [x] 2.2 Download `jobs-json` artifact into `public/`, run `npm ci`, build with `npm run build -- --base /`
- [x] 2.3 Verify `dist/jobs.json` exists before deploy
- [x] 2.4 Deploy with `npx netlify-cli deploy --prod --dir=dist` using `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` secrets

## 3. Wire dual deploy into caller workflows

- [x] 3.1 Add `deploy-netlify` job to `refresh-jobs.yml` gated on `dataChanged == 'true'`
- [x] 3.2 Add `deploy-netlify` job to `deploy-on-main.yml` after ingest prepare (parallel with Pages deploy)
- [x] 3.3 Pass `secrets: inherit` to the Netlify reusable workflow from both callers

## 4. Documentation and verification

- [x] 4.1 Document Netlify site setup and required GitHub secrets in README (or backend README deploy section)
- [x] 4.2 Run `npm run build` locally to confirm no regressions
- [x] 4.3 Trigger deploy workflow and verify Netlify URL loads jobs at `/jobs.json` with root asset paths
