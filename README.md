# 🐉 DragonJobs

Developer job board — a static React PWA that lists roles ingested from Kalibrr and Remotive. Production is pure static (GitHub Pages); a local Hono/SQLite backend handles ingest and API reads during development.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TypeScript, `vite-plugin-pwa` |
| Backend | Hono, Drizzle ORM, SQLite (`better-sqlite3`), Zod |
| Deploy | GitHub Actions → GitHub Pages |

## Quick start

**Prerequisites:** Node.js 20+

### Frontend only

```bash
npm install
npm run dev
```

Without the backend, the job list will fail to load in development (it expects `/api/jobs`). For a full local experience, run both:

### Full local setup

**Terminal 1 — backend:**

```bash
cd backend
npm install
npm run db:migrate
npm run ingest    # optional — populate SQLite
npm run serve     # http://localhost:3001
```

**Terminal 2 — frontend:**

```bash
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:3001`. See [backend/README.md](backend/README.md) for ingest options, env vars, and API details.

### Scripts (frontend)

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server (PWA enabled in dev) |
| `npm run build` | Type-check + production bundle |
| `npm run preview` | Serve the production build locally |

## How it works

```
Sources (Kalibrr, Remotive)
        │
        ▼
  backend ingest ──► SQLite
        │
        ├── DEV:  GET /api/jobs  ◄── Vite proxy ◄── React app
        │
        └── CI:   export public/jobs.json ──► Vite build ──► GitHub Pages
```

- **Development:** the app fetches `/api/jobs` (proxied to the local backend).
- **Production:** the app fetches static `/jobs.json`. That file is gitignored; CI exports it on the runner before building, then deploys `dist/`.
- **PWA:** service worker with auto-update caches static assets; `/api` requests stay network-only.

## Project layout

```
├── src/                 # React app (App.tsx, styles, entry)
├── public/              # Static assets; jobs.json written by CI/export
├── backend/             # Ingest pipeline, SQLite, read API
├── openspec/            # Specs and change history
└── .github/workflows/   # Scheduled ingest + Pages deploy
```

## Production deploy

The [Refresh Jobs](.github/workflows/refresh-jobs.yml) workflow runs about every 3 hours (and on manual dispatch):

1. Migrate DB and run ingest
2. Export `public/jobs.json`
3. If data changed, build the frontend and deploy `dist/` to GitHub Pages

Enable **Settings → Pages → Build and deployment → Source: GitHub Actions** once for the repo.

## Notes

- Remotive listings require attribution when shown in the UI (link + credit).
- Kalibrr uses undocumented search endpoints; treat as an MVP data source.
- Search/filter UI is present but not yet wired to the job list.
- Job detail (`/job/:id`) and login routes are linked but not implemented yet.
