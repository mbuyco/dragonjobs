import type { JobIngestDto } from '../dto/job.dto.ts'

export interface IngestQuery {
  keywords: string[]
  remotiveCategory: string
  kalibrrMaxPages: number
}

export interface JobSourceAdapter {
  readonly name: 'kalibrr' | 'remotive'
  fetch(query: IngestQuery): Promise<JobIngestDto[]>
}

export function loadIngestQueryFromEnv(): IngestQuery {
  const keywords = (process.env.INGEST_KEYWORDS ?? 'developer,software engineer,devops')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)

  const kalibrrMaxPages = Number.parseInt(process.env.KALIBRR_MAX_PAGES ?? '5', 10)
  const remotiveCategory = process.env.REMOTIVE_CATEGORY ?? 'software-dev'

  return {
    keywords: keywords.length > 0 ? keywords : ['developer', 'software engineer', 'devops'],
    remotiveCategory,
    kalibrrMaxPages: Number.isFinite(kalibrrMaxPages) && kalibrrMaxPages > 0 ? kalibrrMaxPages : 5,
  }
}
