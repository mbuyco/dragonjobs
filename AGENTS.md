# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server (service worker enabled in dev via `vite-plugin-pwa`)
- `npm run build` — type-check (`tsc -p tsconfig.app.json`) then bundle with Vite. This is the only verification gate; there is no lint or test setup.
- `npm run preview` — serve the production build locally

`tsconfig.app.json` enables `strict`, `noUnusedLocals`, and `noUnusedParameters`, so `npm run build` fails on unused variables/parameters. `dist/` and `dev-dist/` are generated build artifacts and gitignored. `public/jobs.json` is also gitignored (CI exports it on the runner before building).

## Architecture

Static developer job board — a single-page React 19 app with a local Hono/SQLite backend for ingest and local reads. Production is pure static (no backend runtime).

- **Entry**: `src/main.tsx` mounts `<App />`; `src/vite-env.d.ts` holds Vite/TS ambient types.
- **Everything lives in `src/App.tsx`**: the job list, the `SearchBar` component, `DragonLogo` (inline SVG), and the `formatMeta` helper. Jobs are fetched at runtime: `/api/jobs` in Vite DEV (proxied to `localhost:3001`), `/jobs.json` in production builds.
- **Navigation is plain anchors**, not client-side routing: job cards link to `/job/:id` and the header to `/login`. App re-renders on `popstate` (back/forward), but the current path is not yet used to render different views — those pages don't exist yet.
- **`SearchBar` owns its query + filter state, but it is currently UI-only**: the `query` and `activeFilters` state is not wired into the `jobs.map` rendering, so searching/filtering does not change the list. `FILTERS` and the `Filter` type are the canonical filter set.
- **Styling** is a single global `src/styles.css` (dark theme: `#111` background, Inter font). Job rows use `rank`, `title`, `company`, `badge`, and `meta` classes; a `#ff6464` `focus-visible` outline is applied across interactive elements.
- **Backend** lives under `backend/` (ingest, SQLite, `GET /api/jobs`). See `backend/README.md`. CI exports jobs to `public/jobs.json` on the runner, builds the frontend, and deploys `dist/` to GitHub Pages when ingest data changed — without committing `jobs.json`.

## PWA

`vite.config.ts` registers `vite-plugin-pwa` with `registerType: 'autoUpdate'` and Workbox caching of static assets. The generated service worker lands in `dev-dist/` (dev) and `dist/` (build).
