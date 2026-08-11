## 1. Env and helper

- [x] 1.1 Add `ingestLookbackHours` to `IngestQuery` and parse `INGEST_LOOKBACK_HOURS` (fallback to `jobTtlHours`) in `loadIngestQueryFromEnv`
- [x] 1.2 Add `isWithinLookback(postedAt, hours, now?)` helper

## 2. Pipeline gate

- [x] 2.1 Apply lookback after parse + alreadyPresent in `runIngest`; skip outside window
- [x] 2.2 Add `lookbackSkipped` to `SourceStats`, totals aggregation, and summary log line

## 3. Kalibrr mapping

- [x] 3.1 Map Kalibrr `postedAt` from `created_at` only (remove `updated_at` fallback)

## 4. Docs

- [x] 4.1 Document `INGEST_LOOKBACK_HOURS` and lookback filter step in `backend/README.md`
