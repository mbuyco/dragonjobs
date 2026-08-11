import type { JobIngestDto } from '../dto/job.dto.ts'
import type { IngestQuery, JobSourceAdapter, SourceFetchResult } from './types.ts'

interface RemotiveJob {
  id: number | string
  url?: string
  title?: string
  company_name?: string
  category?: string
  job_type?: string
  publication_date?: string
  candidate_required_location?: string
  salary?: string
  tags?: string[]
}

interface RemotiveResponse {
  jobs?: RemotiveJob[]
}

function mapRemotiveJob(job: RemotiveJob): JobIngestDto {
  const tags = [...(job.tags ?? [])]
  if (job.job_type) tags.push(job.job_type)
  if (job.category) tags.push(job.category)

  return {
    source: 'remotive',
    externalId: String(job.id),
    title: job.title ?? '',
    company: job.company_name ?? '',
    location: job.candidate_required_location,
    salary: job.salary || undefined,
    workArrangement: 'remote',
    tags,
    applyUrl: job.url ?? '',
    postedAt: job.publication_date ? new Date(job.publication_date) : undefined,
  }
}

export const remotiveAdapter: JobSourceAdapter = {
  name: 'remotive',

  async fetch(query: IngestQuery): Promise<SourceFetchResult> {
    const results: JobIngestDto[] = []
    const searchTerms = query.keywords.length > 0 ? query.keywords : ['philippines']

    for (const keyword of searchTerms) {
      try {
        const url = new URL('https://remotive.com/api/remote-jobs')
        url.searchParams.set('category', query.remotiveCategory)
        url.searchParams.set('search', keyword)

        const response = await fetch(url)
        if (!response.ok) {
          console.error(`[remotive] HTTP ${response.status} for search="${keyword}"`)
          continue
        }

        const data = (await response.json()) as RemotiveResponse
        for (const job of data.jobs ?? []) {
          results.push(mapRemotiveJob(job))
        }
      } catch (error) {
        console.error(
          `[remotive] fetch failed for search="${keyword}":`,
          error instanceof Error ? error.message : error,
        )
      }
    }

    const seen = new Set<string>()
    const jobs = results.filter((job) => {
      if (seen.has(job.externalId)) return false
      seen.add(job.externalId)
      return true
    })

    return { jobs, inactiveSkipped: 0, unbuildableUrl: 0 }
  },
}
