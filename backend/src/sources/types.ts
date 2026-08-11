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

export function loadIngestQueryFromEnv(): IngestQuery {
  const keywords = (process.env.INGEST_KEYWORDS ?? 'developer,software engineer,devops,software,programmer,software architect')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)

  const kalibrrMaxPages = Number.parseInt(process.env.KALIBRR_MAX_PAGES ?? '5', 10)
  const remotiveCategory = process.env.REMOTIVE_CATEGORY ?? 'software-dev'
  const jobTtlHoursRaw = Number.parseInt(process.env.JOB_TTL_HOURS ?? '24', 10)
  const jobTtlHours = Number.isFinite(jobTtlHoursRaw) && jobTtlHoursRaw > 0 ? jobTtlHoursRaw : 24

  const lookbackRaw = process.env.INGEST_LOOKBACK_HOURS
  const lookbackParsed =
    lookbackRaw !== undefined && lookbackRaw !== ''
      ? Number.parseInt(lookbackRaw, 10)
      : Number.NaN
  const ingestLookbackHours =
    Number.isFinite(lookbackParsed) && lookbackParsed > 0 ? lookbackParsed : jobTtlHours

  return {
    keywords: keywords.length > 0 ? keywords : ['developer', 'software engineer', 'devops'],
    remotiveCategory,
    kalibrrMaxPages: Number.isFinite(kalibrrMaxPages) && kalibrrMaxPages > 0 ? kalibrrMaxPages : 5,
    jobTtlHours,
    ingestLookbackHours,
  }
}
