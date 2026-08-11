import type { JobIngestDto, WorkArrangement } from '../dto/job.dto.ts'
import type { IngestQuery, JobSourceAdapter } from './types.ts'

interface KalibrrCompany {
  name?: string
}

interface KalibrrJob {
  id?: number | string
  name?: string
  company?: KalibrrCompany | string
  google_location_formatted_address?: string
  location?: string
  salary?: string
  salary_range?: { min?: number; max?: number } | string
  salary_currency?: string
  work_arrangement?: string
  workplace_type?: string
  skills?: Array<string | { name?: string }>
  function?: string
  description?: string
  created_at?: string
  updated_at?: string
  url?: string
  absolute_url?: string
}

interface KalibrrSearchResponse {
  jobs?: KalibrrJob[]
  records?: KalibrrJob[]
}

const PAGE_SIZE = 50

function mapWorkArrangement(value: string | undefined): WorkArrangement {
  if (!value) return 'unknown'
  const normalized = value.toLowerCase().replace(/[_-\s]+/g, '')
  if (normalized.includes('remote') || normalized.includes('wfh') || normalized.includes('workfromhome')) {
    return 'remote'
  }
  if (normalized.includes('hybrid')) return 'hybrid'
  if (normalized.includes('onsite') || normalized.includes('office')) return 'onsite'
  return 'unknown'
}

function companyName(company: KalibrrJob['company']): string {
  if (!company) return ''
  if (typeof company === 'string') return company
  return company.name ?? ''
}

function extractTags(job: KalibrrJob): string[] {
  const tags: string[] = []
  if (job.function) tags.push(job.function)
  for (const skill of job.skills ?? []) {
    if (typeof skill === 'string') tags.push(skill)
    else if (skill.name) tags.push(skill.name)
  }
  return tags
}

function extractSalary(job: KalibrrJob): {
  salary?: string
  salaryMin?: number
  salaryMax?: number
  currency?: string
} {
  const currency = job.salary_currency?.length === 3 ? job.salary_currency : undefined
  if (typeof job.salary === 'string' && job.salary.trim()) {
    return { salary: job.salary, currency }
  }
  if (typeof job.salary_range === 'string' && job.salary_range.trim()) {
    return { salary: job.salary_range, currency }
  }
  if (job.salary_range && typeof job.salary_range === 'object') {
    const min = job.salary_range.min
    const max = job.salary_range.max
    const salary =
      min != null && max != null
        ? `${min}–${max}`
        : min != null
          ? `${min}+`
          : max != null
            ? `up to ${max}`
            : undefined
    return {
      salary,
      salaryMin: typeof min === 'number' && min > 0 ? min : undefined,
      salaryMax: typeof max === 'number' && max > 0 ? max : undefined,
      currency,
    }
  }
  return { currency }
}

function applyUrl(job: KalibrrJob): string {
  if (job.absolute_url) return job.absolute_url
  if (job.url) {
    return job.url.startsWith('http') ? job.url : `https://www.kalibrr.com${job.url}`
  }
  if (job.id != null) return `https://www.kalibrr.com/c/jobs/${job.id}`
  return ''
}

function mapKalibrrJob(job: KalibrrJob): JobIngestDto {
  const salary = extractSalary(job)
  return {
    source: 'kalibrr',
    externalId: String(job.id ?? ''),
    title: job.name ?? '',
    company: companyName(job.company),
    location: job.google_location_formatted_address ?? job.location,
    salary: salary.salary,
    salaryMin: salary.salaryMin,
    salaryMax: salary.salaryMax,
    currency: salary.currency,
    workArrangement: mapWorkArrangement(job.work_arrangement ?? job.workplace_type),
    tags: extractTags(job),
    description: job.description,
    applyUrl: applyUrl(job),
    postedAt: job.created_at
      ? new Date(job.created_at)
      : job.updated_at
        ? new Date(job.updated_at)
        : undefined,
    rawPayload: job as unknown as Record<string, unknown>,
  }
}

async function fetchPage(keyword: string, offset: number): Promise<KalibrrJob[]> {
  const url = new URL('https://www.kalibrr.com/kjs/job_board/search')
  url.searchParams.set('query', keyword)
  url.searchParams.set('limit', String(PAGE_SIZE))
  url.searchParams.set('offset', String(offset))

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'dragonjobs-ingest/1.0',
    },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data = (await response.json()) as KalibrrSearchResponse | KalibrrJob[]
  if (Array.isArray(data)) return data
  return data.jobs ?? data.records ?? []
}

export const kalibrrAdapter: JobSourceAdapter = {
  name: 'kalibrr',

  async fetch(query: IngestQuery): Promise<JobIngestDto[]> {
    const results: JobIngestDto[] = []

    for (const keyword of query.keywords) {
      for (let page = 0; page < query.kalibrrMaxPages; page += 1) {
        try {
          const jobs = await fetchPage(keyword, page * PAGE_SIZE)
          if (jobs.length === 0) break
          for (const job of jobs) {
            results.push(mapKalibrrJob(job))
          }
          if (jobs.length < PAGE_SIZE) break
        } catch (error) {
          console.error(
            `[kalibrr] fetch failed for query="${keyword}" page=${page}:`,
            error instanceof Error ? error.message : error,
          )
          break
        }
      }
    }

    const seen = new Set<string>()
    return results.filter((job) => {
      if (!job.externalId || seen.has(job.externalId)) return false
      seen.add(job.externalId)
      return true
    })
  },
}
