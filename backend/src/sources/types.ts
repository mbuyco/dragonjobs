import type { JobIngestDto } from '../dto/job.dto.ts'

export interface IngestQuery {
  keywords: string[]
  remotiveCategory: string
  kalibrrMaxPages: number
  jobTtlHours: number
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
  const keywords = (process.env.INGEST_KEYWORDS ?? 'developer,software engineer,devops')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)

  const kalibrrMaxPages = Number.parseInt(process.env.KALIBRR_MAX_PAGES ?? '5', 10)
  const remotiveCategory = process.env.REMOTIVE_CATEGORY ?? 'software-dev'
  const jobTtlHours = Number.parseInt(process.env.JOB_TTL_HOURS ?? '24', 10)

  return {
    keywords: keywords.length > 0 ? keywords : ['developer', 'software engineer', 'devops'],
    remotiveCategory,
    kalibrrMaxPages: Number.isFinite(kalibrrMaxPages) && kalibrrMaxPages > 0 ? kalibrrMaxPages : 5,
    jobTtlHours: Number.isFinite(jobTtlHours) && jobTtlHours > 0 ? jobTtlHours : 24,
  }
}
