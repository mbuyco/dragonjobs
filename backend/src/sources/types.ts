import type { JobIngestDto } from '../dto/job.dto.ts'

export interface IngestQuery {
  keywords: string[]
  remotiveCategory: string
  kalibrrMaxPages: number
  jobTtlHours: number
  ingestLookbackHours: number
}

export interface SourceFetchResult {
  jobs: JobIngestDto[]
  inactiveSkipped: number
  unbuildableUrl: number
}

export interface JobSourceAdapter {
  readonly name: 'kalibrr' | 'remotive'
  fetch(query: IngestQuery): Promise<SourceFetchResult>
}

const DEFAULT_KEYWORDS =
  'developer,software engineer,devops,software,programmer,software architect'
const THREE_MONTHS_HOURS = 90 * 24 // 2160
const DEFAULT_JOB_TTL_HOURS = THREE_MONTHS_HOURS
const DEFAULT_INGEST_LOOKBACK_HOURS = THREE_MONTHS_HOURS

export function loadIngestQueryFromEnv(): IngestQuery {
  const keywordsRaw = process.env.INGEST_KEYWORDS?.trim()
  const keywords = (keywordsRaw || DEFAULT_KEYWORDS)
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)

  const kalibrrMaxPages = Number.parseInt(process.env.KALIBRR_MAX_PAGES ?? '5', 10)
  const remotiveCategory = process.env.REMOTIVE_CATEGORY ?? 'software-dev'
  const jobTtlHoursRaw = Number.parseInt(
    process.env.JOB_TTL_HOURS ?? String(DEFAULT_JOB_TTL_HOURS),
    10,
  )
  const jobTtlHours =
    Number.isFinite(jobTtlHoursRaw) && jobTtlHoursRaw > 0 ? jobTtlHoursRaw : DEFAULT_JOB_TTL_HOURS

  const lookbackRaw = process.env.INGEST_LOOKBACK_HOURS?.trim()
  const lookbackParsed = lookbackRaw
    ? Number.parseInt(lookbackRaw, 10)
    : DEFAULT_INGEST_LOOKBACK_HOURS
  const ingestLookbackHours =
    Number.isFinite(lookbackParsed) && lookbackParsed > 0
      ? lookbackParsed
      : DEFAULT_INGEST_LOOKBACK_HOURS

  const query: IngestQuery = {
    keywords: keywords.length > 0 ? keywords : ['developer', 'software engineer', 'devops'],
    remotiveCategory,
    kalibrrMaxPages: Number.isFinite(kalibrrMaxPages) && kalibrrMaxPages > 0 ? kalibrrMaxPages : 5,
    jobTtlHours,
    ingestLookbackHours,
  }

  return query
}
