## Why

Ingest currently inserts every newly seen `(source, externalId)` regardless of how old the source posting is, while board lifetime is controlled only by `synced_at` TTL. That pulls stale listings into the DB and wastes insert work. We need a separate insert lookback on source `postedAt` without conflating it with TTL cleanup.

## What Changes

- Add `INGEST_LOOKBACK_HOURS` (defaults to `JOB_TTL_HOURS` when unset) to gate **new** inserts: `postedAt >= now - lookback`
- Apply the gate in the ingest pipeline only (adapters stay date-param-free); count `lookbackSkipped` in the run summary
- Skip jobs with missing/invalid `postedAt`; allow future-dated `postedAt` values that still pass the cutoff
- **BREAKING** (behavior): reverse the prior rule that forbade gating inserts on source timestamps
- Kalibrr maps `postedAt` from `created_at` only (drop `updated_at` fallback)
- Document the new env var in `backend/README.md`

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `job-lifecycle`: Gate insert eligibility on `postedAt` vs lookback; keep TTL solely on `synced_at`
- `job-ingest`: Accept `INGEST_LOOKBACK_HOURS`, apply lookback during ingest, include `lookbackSkipped` in summary
- `job-source-adapters`: Kalibrr `postedAt` from `created_at` only

## Impact

- Code: `backend/src/sources/types.ts`, ingest pipeline, Kalibrr mapper, README
- Specs: `job-lifecycle`, `job-ingest`, `job-source-adapters`
- No frontend/API read changes; no change to append-only sync or TTL axis
