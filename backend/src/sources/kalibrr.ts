import type { JobIngestDto, WorkArrangement } from '../dto/job.dto.ts'
import type { IngestQuery, JobSourceAdapter, SourceFetchResult } from './types.ts'

interface KalibrrCompany {
  name?: string
  code?: string
  visible?: boolean
}

interface KalibrrCompanyInfo {
  code?: string
  hidden?: boolean
}

interface KalibrrJob {
  id?: number | string
  name?: string
  slug?: string
  company?: KalibrrCompany | string
  company_info?: KalibrrCompanyInfo
  google_location_formatted_address?: string
  location?: string
  salary?: string
  salary_range?: { min?: number; max?: number } | string
  salary_currency?: string
  salary_maximum?: number
  maximum_salary?: number
  work_arrangement?: string
  workplace_type?: string
  is_work_from_home?: boolean
  is_hybrid?: boolean
  skills?: Array<string | { name?: string }>
  job_sds_skills?: Array<{ sds_skill?: { name?: string } }>
  function?: string
  created_at?: string
  updated_at?: string
  visibility?: string
  application_end_date?: string
  apply_redirect_url?: string
  url?: string
  absolute_url?: string
}

interface KalibrrSearchResponse {
  jobs?: KalibrrJob[]
  records?: KalibrrJob[]
}

const PAGE_SIZE = 50

function mapWorkArrangement(job: KalibrrJob): WorkArrangement {
  const value = job.work_arrangement ?? job.workplace_type
  if (!value) {
    if (job.is_work_from_home) return 'remote'
    if (job.is_hybrid) return 'hybrid'
    return 'unknown'
  }
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

function companyCode(job: KalibrrJob): string | undefined {
  if (typeof job.company === 'object' && job.company?.code) return job.company.code
  return job.company_info?.code
}

function extractTags(job: KalibrrJob): string[] {
  const tags: string[] = []
  if (job.function) tags.push(job.function)
  for (const skill of job.skills ?? []) {
    if (typeof skill === 'string') tags.push(skill)
    else if (skill.name) tags.push(skill.name)
  }
  for (const entry of job.job_sds_skills ?? []) {
    if (entry.sds_skill?.name) tags.push(entry.sds_skill.name)
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
  const maxSalary = job.maximum_salary ?? job.salary_maximum
  if (typeof maxSalary === 'number' && maxSalary > 0) {
    return { salaryMax: maxSalary, currency }
  }
  return { currency }
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function buildApplyUrl(job: KalibrrJob): string | undefined {
  const redirect = job.apply_redirect_url?.trim()
  if (redirect && isAbsoluteHttpUrl(redirect)) return redirect

  const code = companyCode(job)
  const id = job.id
  const slug = job.slug?.trim()
  if (code && id != null && slug) {
    return `https://www.kalibrr.com/c/${code}/jobs/${id}/${slug}`
  }
  if (code && id != null) {
    return `https://www.kalibrr.com/c/${code}/jobs/${id}`
  }

  return undefined
}

function isInactiveListing(job: KalibrrJob, now: Date): boolean {
  if (job.visibility && job.visibility !== 'public') return true

  if (job.application_end_date) {
    const end = new Date(job.application_end_date)
    if (!Number.isNaN(end.getTime()) && end < now) return true
  }

  if (typeof job.company === 'object' && job.company?.visible === false) return true
  if (job.company_info?.hidden === true) return true

  return false
}

function mapKalibrrJob(job: KalibrrJob): JobIngestDto | undefined {
  const applyUrl = buildApplyUrl(job)
  if (!applyUrl) return undefined

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
    workArrangement: mapWorkArrangement(job),
    tags: extractTags(job),
    applyUrl,
    postedAt: job.created_at
      ? new Date(job.created_at)
      : job.updated_at
        ? new Date(job.updated_at)
        : undefined,
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

  async fetch(query: IngestQuery): Promise<SourceFetchResult> {
    const results: JobIngestDto[] = []
    let inactiveSkipped = 0
    let unbuildableUrl = 0
    const now = new Date()

    for (const keyword of query.keywords) {
      for (let page = 0; page < query.kalibrrMaxPages; page += 1) {
        try {
          const jobs = await fetchPage(keyword, page * PAGE_SIZE)
          if (jobs.length === 0) break
          for (const job of jobs) {
            if (isInactiveListing(job, now)) {
              inactiveSkipped += 1
              continue
            }
            const mapped = mapKalibrrJob(job)
            if (!mapped) {
              unbuildableUrl += 1
              continue
            }
            results.push(mapped)
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
    const jobs = results.filter((job) => {
      if (!job.externalId || seen.has(job.externalId)) return false
      seen.add(job.externalId)
      return true
    })

    return { jobs, inactiveSkipped, unbuildableUrl }
  },
}
