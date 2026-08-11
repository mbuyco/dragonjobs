## ADDED Requirements

### Requirement: Ingest summary indicates whether data changed
The system SHALL include a `dataChanged` boolean in the ingest summary that is `true` when at least one source was fetched outside its TTL window or when TTL cleanup deleted rows, and `false` when every source was TTL-skipped and no rows were deleted.

#### Scenario: dataChanged is true when source fetched
- **WHEN** the ingest run calls `adapter.fetch()` for any source
- **THEN** `dataChanged` is `true` regardless of whether new jobs were inserted

#### Scenario: dataChanged is true when TTL deletes rows
- **WHEN** TTL cleanup deletes one or more rows
- **THEN** `dataChanged` is `true`

#### Scenario: dataChanged is false when all sources skipped
- **WHEN** every configured source is skipped due to TTL and no rows are deleted
- **THEN** `dataChanged` is `false`

#### Scenario: dataChanged is logged in summary
- **WHEN** an ingest run completes
- **THEN** the logged summary includes `dataChanged=true` or `dataChanged=false`
