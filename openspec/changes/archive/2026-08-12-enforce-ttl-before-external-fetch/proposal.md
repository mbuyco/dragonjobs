## Why

The ingest pipeline currently fetches from every external source on every run, regardless of whether local data is still fresh. This wastes API quota, increases latency, and risks hitting rate limits on Remotive and Kalibrr. The system already tracks `synced_at` and has a configurable `JOB_TTL_HOURS`, but that TTL only governs row deletion—not whether a fresh external fetch should occur.

## What Changes

- Add a TTL gate in the ingest pipeline that skips `adapter.fetch()` for a source when its most recent successful sync is within `JOB_TTL_HOURS`.
- Log when a fetch is skipped due to TTL and surface the skip count in the ingest summary.
- No changes to source adapters, frontend, or database schema.

## Capabilities

### Modified Capabilities
- `job-ingest`: Add a pre-fetch TTL gate that skips external API calls for sources already synced within the TTL window.

## Impact

- `backend/src/pipeline/ingest.ts` — TTL gate logic and new summary counters.
- `backend/src/db/sync.ts` — helper to query latest `synced_at` per source.
- No frontend, schema, or adapter changes.
