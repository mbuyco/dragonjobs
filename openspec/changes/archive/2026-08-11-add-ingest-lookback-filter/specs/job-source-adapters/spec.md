## ADDED Requirements

### Requirement: Kalibrr postedAt uses created_at only
The Kalibrr adapter SHALL map `postedAt` from `created_at` only and SHALL NOT fall back to `updated_at`.

#### Scenario: Kalibrr created_at present
- **WHEN** a Kalibrr job has `created_at`
- **THEN** the adapter sets `postedAt` to that timestamp

#### Scenario: Kalibrr created_at missing
- **WHEN** a Kalibrr job has no `created_at` (even if `updated_at` is present)
- **THEN** the adapter omits `postedAt`
