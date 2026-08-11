import { useEffect, useRef, useState } from 'react'

interface JobDetails {
  stack: string[]
  salary?: string
  postedAt?: string
  badge?: string
}

interface Job {
  id: string
  title: string
  company: string
  details: JobDetails
}

interface JobListItem {
  id: string
  title: string
  company: string
  source: 'kalibrr' | 'remotive'
  tags: string[]
  applyUrl: string
  salary?: string
  postedAt?: string
  workArrangement?: string
}

interface JobsResponse {
  jobs: JobListItem[]
}

const FILTERS = ['remote', 'backend', 'frontend', 'fullstack', 'devops', 'ai'] as const
type Filter = typeof FILTERS[number]

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString()
}

function toJob(item: JobListItem): Job {
  const badge =
    item.workArrangement === 'remote'
      ? 'Remote'
      : item.workArrangement && item.workArrangement !== 'unknown'
        ? item.workArrangement.charAt(0).toUpperCase() + item.workArrangement.slice(1)
        : undefined

  return {
    id: item.id,
    title: item.title,
    company: item.company,
    details: {
      stack: item.tags,
      applyUrl: item.applyUrl,
      ...(item.salary ? { salary: item.salary } : {}),
      ...(item.postedAt ? { postedAt: formatRelativeTime(item.postedAt) } : {}),
      ...(badge ? { badge } : {}),
    },
  }
}

function formatMeta(details: JobDetails): string {
  return [details.stack.join(' • '), details.salary, details.postedAt].filter(Boolean).join(' • ')
}

function DragonLogo() {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="4" />
      <path d="M50 22 C42 33 35 38 35 48 C35 57 42 62 50 74 C58 62 65 57 65 48 C65 38 58 33 50 22Z" fill="white" />
      <path d="M50 50 L18 32 L35 55 L20 78" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 50 L82 32 L65 55 L80 78" stroke="white" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function SearchBar() {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<Filter>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  function toggleFilter(f: Filter) {
    setActiveFilters(prev => {
      const next = new Set(prev)
      next.has(f) ? next.delete(f) : next.add(f)
      return next
    })
    inputRef.current?.focus()
  }

  return (
    <div className="search-box">
      <div className="search-input-row">
        <svg className="search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13 13l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search jobs, companies, technologies..."
          aria-label="Search jobs"
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery('')} aria-label="Clear search">
            ×
          </button>
        )}
      </div>
      <div className="search-filters" role="group" aria-label="Filter by category">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-pill${activeFilters.has(f) ? ' active' : ''}`}
            onClick={() => toggleFilter(f)}
            aria-pressed={activeFilters.has(f)}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [, setCurrentPath] = useState(window.location.pathname)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasRemotiveJobs, setHasRemotiveJobs] = useState(false)

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadJobs() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/jobs')
        if (!res.ok) throw new Error(`Failed to load jobs (${res.status})`)
        const data: JobsResponse = await res.json()
        if (cancelled) return
        setJobs(data.jobs.map(toJob))
        setHasRemotiveJobs(data.jobs.some(j => j.source === 'remotive'))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load jobs')
        setJobs([])
        setHasRemotiveJobs(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadJobs()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <header>
        <div className="container nav">
          <a href="/" className="logo">
            <DragonLogo />
            <span>DragonJobs</span>
          </a>
          <div className="nav-right">
            <a href="/login" className="nav-login">login</a>
          </div>
        </div>
      </header>

      <section className="search">
        <div className="container">
          <SearchBar />
        </div>
      </section>

      <main className="container jobs">
        {loading && <p className="jobs-status">Loading jobs…</p>}
        {error && <p className="jobs-status jobs-error">{error}</p>}
        {!loading && !error && jobs.length === 0 && (
          <p className="jobs-status">No jobs found. Run ingest to populate the database.</p>
        )}
        {!loading && !error && jobs.map((job, index) => (
          <div key={job.id} className="job">
            <div className="rank">{index + 1}.</div>
            <div>
              <a target="_blank" href={job.details.applyUrl} className="title">
                {job.title}
                <span className="company"> @ {job.company}</span>
              </a>
              {job.details.badge && <span className="badge">{job.details.badge}</span>}
              <div className="meta">{formatMeta(job.details)}</div>
            </div>
          </div>
        ))}
      </main>

      <footer>
        DragonJobs • Built for developers • Inspired by classic minimalist communities
        {hasRemotiveJobs && (
          <> • Jobs from <a href="https://remotive.com" target="_blank" rel="noopener noreferrer">Remotive</a></>
        )}
      </footer>
    </>
  )
}
