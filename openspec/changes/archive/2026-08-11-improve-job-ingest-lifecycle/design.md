## Context

The ingest CLI fetches Kalibrr + Remotive, validates with Zod, and upserts into SQLite. Operators see dead Kalibrr apply links because the adapter falls back to `https://www.kalibrr.com/c/jobs/{id}` (404). Correct public URLs: `https://www.kalibrr.com/c/{company.code}/jobs/{id}/{slug}`. Search payloads expose activity signals (`visibility`, `application_end_date`, company visibility) that ingest ignores. Every run re-upserts the full fetch set and never expires rows.

**Empirical Kalibrr check (Aug 2026):**

| URL pattern | Status |
|---|---|
| `/c/jobs/{id}` (current fallback) | **404** |
| `/c/{code}/jobs/{id}/{slug}` | **200** |
| `/c/{code}/jobs/{id}` | **200** |

Sample of 100 search results: 100/100 had `apply_redirect_url` or `company.code` + `id` + `slug`. Zero needed bare `/c/jobs/{id}`. Probe was compensating for wrong URL construction — not needed after fix.

## Goals / Non-Goals

**Goals:**

- Fix Kalibrr apply URL construction so links work without HTTP probing
- Filter inactive Kalibrr listings via search API fields at insert time
- Append-only ingest: insert when `(source, externalId)` absent; never refresh existing rows
- Hard-delete all jobs older than 24h by **`synced_at`** (when we ingested), not source posting dates
- Drop `description`, `raw_payload`, `is_active`; rename `fetched_at` → `synced_at`
- Keep `npm run ingest` as single orchestration path

**Non-Goals:**

- HTTP apply-URL probing (any source)
- Mid-run deletion of inactive/404 jobs (TTL owns removal)
- External-source-timestamp lookback (`activation_date`, `publication_date` for insert eligibility)
- Background daemon / always-on sync loop
- Frontend or read-API contract changes (except dropping dead `is_active` filter)
- Cross-source fuzzy dedup
- Upsert refresh of mutable fields

## Decisions

### 1. Fix Kalibrr apply URL — no probe needed

**Choice:** Build apply URL as:

1. `apply_redirect_url` when present and absolute HTTP(S)
2. Else `https://www.kalibrr.com/c/{company.code}/jobs/{id}/{slug}` when code + id + slug exist
3. Else `https://www.kalibrr.com/c/{company.code}/jobs/{id}` when code + id exist
4. Else **skip job** (no bare `/c/jobs/{id}`, no HTTP probe)

**Rationale:** Bare path 404s; company-scoped paths 200. Search API always provides buildable URLs in practice. Probe added latency and false negatives for no gain.

### 2. Kalibrr active filter from search API fields

**Choice:** Skip insert when any of:

- `visibility` present and not `public`
- `application_end_date` in the past (UTC)
- `company.visible === false` or `company_info.hidden === true`

**Rationale:** Free, no extra HTTP. Fields exist on search endpoint today. Missing fields → treat as unknown-active, allow insert if URL buildable.

**Remotive:** No reliable active/status field on public list API. Insert if not in DB and DTO valid. TTL removes stale rows.

### 3. No apply-URL HTTP probing

**Choice:** No `probeApplyUrl` helper. Kalibrr correctness comes from URL construction + API active filter. Remotive uses `job.url` from API as-is.

**Rationale:** Kalibrr 404s were construction bug. External redirect URLs come from Kalibrr API directly. Probing Remotive/Kalibrr adds latency, rate-limit risk, and false skips on network blips — with no mid-run delete, skipped inserts just mean missing row until next run.

### 4. Append-only sync

**Choice:**

- Insert only when `(source, externalId)` not in DB
- Existing rows untouched during 3h fetch runs
- No upsert refresh of title, tags, salary, etc.

**Rationale:** Board is ephemeral (24h TTL). Salary not displayed on site. User visits apply URL for details. Stale title up to 24h acceptable.

### 5. Lifecycle time axis: `synced_at`, not source dates

**Choice:**

- Rename `fetched_at` → `synced_at`; set on insert only
- `JOB_TTL_HOURS` (default 24): `DELETE FROM jobs WHERE synced_at < now() - N hours`
- **No** `INGEST_LOOKBACK_HOURS`; **no** insert gating on `postedAt`, `activation_date`, or `publication_date`

**Rationale:** External posting dates lag (especially Remotive). Our board lifetime is "how long since we synced." Operator cron (~3h fetch, 24h wipe) is scheduling, not an env lookback on source timestamps.

### 6. Removal: TTL only

**Choice:** Hard-delete via TTL at run start. No mid-run delete for inactive/404. Cascades `job_tags`.

**Rationale:** Product choice — 3h runs fetch new jobs only; 24h TTL wipes board and next fetch repopulates. Worst-case dead link on board: ~24h.

### 7. Drop `is_active`

**Choice:** Remove column and `idx_jobs_is_active`. Read API lists all rows in DB (all live until TTL). Hard delete only.

### 8. Pipeline order

```
1. TTL cleanup (delete jobs where synced_at older than JOB_TTL_HOURS)
2. For each adapter:
   a. fetch()
   b. map + DTO validate
   c. Kalibrr: skip inactive (API fields) and unbuildable apply URL
   d. if (source, externalId) already in DB → skip
   e. insert new survivors (synced_at = now)
3. Log summary
```

### 9. Config surface

| Variable | Default | Meaning |
|---|---|---|
| `JOB_TTL_HOURS` | `24` | Hard-delete rows with `synced_at` older than N hours |
| existing | unchanged | `INGEST_KEYWORDS`, `KALIBRR_MAX_PAGES`, `REMOTIVE_CATEGORY`, `DATABASE_URL` |

### 10. Slim jobs schema

Remove `description`, `raw_payload`, `is_active`. Rename `fetched_at` → `synced_at`.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Kalibrr API stops returning code/slug | Skip unbuildable jobs; log count; revisit if pattern emerges |
| Kalibrr undocumented fields rename | Missing visibility/end-date → unknown-active; still insert if URL buildable |
| Insert-only means stale title 24h | Accepted; TTL evicts |
| No probe means trust API redirect URLs | Kalibrr serves redirect URLs; 24h TTL bounds exposure |
| Remotive stale listings until TTL | Accepted; no active signal available |

## Migration Plan

1. Schema migration: drop `description`, `raw_payload`, `is_active`; rename `fetched_at` → `synced_at`
2. Kalibrr adapter URL + active filter
3. Insert-only persist + TTL helper
4. Pipeline wire-up
5. Read API drop `is_active` filter
6. README env docs
7. Re-run `npm run ingest`; confirm Kalibrr URLs company-scoped, append-only inserts, TTL counts in logs

**Rollback:** Revert commits; restore prior schema from backup if migration applied.
