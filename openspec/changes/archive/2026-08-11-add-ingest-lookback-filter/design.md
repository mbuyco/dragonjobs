## Context

Ingest is append-only: new `(source, externalId)` rows get `synced_at = now`; TTL deletes rows whose `synced_at` is older than `JOB_TTL_HOURS`. Adapters (Remotive, Kalibrr) fetch without date query params and map source timestamps into optional `postedAt`. Lifecycle specs previously forbade gating inserts on those timestamps, so old postings still enter the DB when first seen.

## Goals / Non-Goals

**Goals:**

- Gate **new** inserts on source freshness via `INGEST_LOOKBACK_HOURS`
- Keep TTL cleanup exclusively on `synced_at` / `JOB_TTL_HOURS`
- Surface `lookbackSkipped` in ingest summary logs
- Align Kalibrr `postedAt` with true create time (`created_at` only)

**Non-Goals:**

- API-side date query parameters on Remotive/Kalibrr
- Changing append-only sync or refreshing existing rows
- Frontend / read API changes
- Using lookback for TTL eviction

## Decisions

### 1. Split env knobs

- `JOB_TTL_HOURS` — hard-delete when `synced_at < now - N hours`
- `INGEST_LOOKBACK_HOURS` — insert only when `postedAt >= now - N hours`
- If lookback unset, use `JOB_TTL_HOURS` (else 24)

**Alternative considered:** Reuse `JOB_TTL_HOURS` for both. Rejected — couples fetch freshness to board wipe age.

### 2. Pipeline-only gate

Apply lookback in `runIngest` after Zod parse and `alreadyPresent`, before `insertJobIfAbsent`. Adapters remain mapping-only.

**Alternative considered:** Filter inside each adapter. Rejected — duplicates logic and mixes fetch mapping with insert policy.

### 3. Predicate details

- Eligible: `postedAt` present, finite, and `>= now - lookbackHours`
- Missing/invalid `postedAt` → `lookbackSkipped`
- Future `postedAt` allowed if it passes the cutoff
- Already-present jobs are not lookback-counted (TTL owns eviction)

### 4. Kalibrr `postedAt = created_at` only

Drop `updated_at` fallback so edits cannot re-qualify old listings into the window. Missing `created_at` → no `postedAt` → lookback skip.

### 5. Shared helper

`isWithinLookback(postedAt, hours, now?)` used by the pipeline for a single definition of the cutoff.

## Risks / Trade-offs

- **[Risk] Full API payloads still downloaded** → Mitigation: accept post-fetch filter for MVP; revisit API date params if a source documents them
- **[Risk] Stricter Kalibrr mapping drops jobs without `created_at`** → Mitigation: intentional; count via `lookbackSkipped`
- **[Risk] Spec reversal vs archived “no lookback” design** → Mitigation: explicit MODIFIED lifecycle/ingest specs in this change

## Migration Plan

1. Deploy code + env docs; no DB migration
2. Optional: set `INGEST_LOOKBACK_HOURS` independently of TTL
3. Rollback: remove lookback gate (or set a very large lookback); TTL behavior unchanged

## Open Questions

None — decisions locked in grilling.
