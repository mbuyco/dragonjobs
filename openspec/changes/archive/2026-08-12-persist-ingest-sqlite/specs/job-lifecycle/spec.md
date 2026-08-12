## MODIFIED Requirements

### Requirement: Ingest summary indicates whether data changed
The system SHALL include a `dataChanged` boolean in the ingest summary that is `true` when at least one job was inserted or when TTL cleanup deleted rows, and `false` when no jobs were inserted and no rows were deleted.

#### Scenario: dataChanged is true when jobs inserted
- **WHEN** the ingest run inserts one or more jobs
- **THEN** `dataChanged` is `true`

#### Scenario: dataChanged is true when TTL deletes rows
- **WHEN** TTL cleanup deletes one or more rows
- **THEN** `dataChanged` is `true`

#### Scenario: dataChanged is false when no inserts and no deletes
- **WHEN** the ingest run inserts zero jobs and TTL cleanup deletes zero rows
- **THEN** `dataChanged` is `false`

#### Scenario: dataChanged is logged in summary
- **WHEN** an ingest run completes
- **THEN** the logged summary includes `dataChanged=true` or `dataChanged=false`
