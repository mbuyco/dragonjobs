import { useEffect, useState } from 'react'

interface JobDetails {
  stack: string[]
  salary?: string
  postedAt?: string
  badge?: string
}

interface Job {
  id: number
  title: string
  company: string
  details: JobDetails
}

const jobs: Job[] = [
  { id: 1, title: 'Senior Full Stack Engineer', company: 'Stripe', details: { stack: ['React', 'Node.js', 'PostgreSQL'], salary: '$170k–220k', postedAt: '2 hours ago', badge: 'Remote' } },
  { id: 2, title: 'Staff AI Engineer', company: 'Anthropic', details: { stack: ['Python', 'LLM', 'AWS'], salary: '$250k+', postedAt: 'today', badge: 'Hiring' } },
  { id: 3, title: 'Senior Backend Engineer', company: 'GitLab', details: { stack: ['Go', 'Kubernetes', 'PostgreSQL'], postedAt: '5 hours ago', badge: 'Remote' } },
  { id: 4, title: 'Platform Engineer', company: 'Cloudflare', details: { stack: ['Rust', 'Linux', 'Networking'], postedAt: 'yesterday' } },
  { id: 5, title: 'Senior Laravel Developer', company: 'Startup', details: { stack: ['Laravel', 'Vue', 'MySQL'], salary: '$80k–120k', badge: 'Remote' } },
  { id: 6, title: 'DevOps Engineer', company: 'Netflix', details: { stack: ['Terraform', 'AWS', 'Docker'], postedAt: '1 day ago' } },
  { id: 7, title: 'Frontend Engineer', company: 'Vercel', details: { stack: ['Next.js', 'React', 'TypeScript'], postedAt: 'today' } },
  { id: 8, title: 'Software Engineer', company: 'Linear', details: { stack: ['TypeScript', 'GraphQL'], badge: 'Remote' } },
  { id: 9, title: 'Machine Learning Engineer', company: 'OpenAI', details: { stack: ['Python', 'CUDA', 'Distributed Systems'] } },
  { id: 10, title: 'Senior Infrastructure Engineer', company: 'Datadog', details: { stack: ['Go', 'Linux', 'Kubernetes'], postedAt: '3 days ago' } },
]

function formatMeta(details: JobDetails): string {
  const parts = [
    details.stack.join(' • '),
    details.salary,
    details.postedAt,
  ].filter(Boolean)
  return parts.join(' • ')
}

const navLinks = [
  { label: 'new', href: '/' },
  { label: 'remote', href: '/browse#remote' },
  { label: 'backend', href: '/browse#backend' },
  { label: 'frontend', href: '/browse#frontend' },
  { label: 'fullstack', href: '/browse#fullstack' },
  { label: 'devops', href: '/browse#devops' },
  { label: 'ai', href: '/browse#ai' },
  { label: 'salary', href: '/browse#salary' },
]

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

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return (
    <>
      <header>
        <div className="container nav">
          <a href="/" className="logo">
            <DragonLogo />
            <span>DragonJobs</span>
          </a>
          <nav className="menu">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={link.href === currentPath ? 'active' : undefined}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="right">
            <a href="/login">login</a>
          </div>
        </div>
      </header>

      <section className="search">
        <div className="container">
          <input placeholder="Search jobs, companies, technologies..." />
        </div>
      </section>

      <main className="container jobs">
        {jobs.map((job) => (
          <div key={job.id} className="job">
            <div className="rank">{job.id}.</div>
            <div>
              <a href={`/job/${job.id}`} className="title">{job.title}</a>
              <span className="company">@ {job.company}</span>
              {job.details.badge && <span className="badge">{job.details.badge}</span>}
              <div className="meta">{formatMeta(job.details)}</div>
            </div>
          </div>
        ))}
      </main>

      <footer>
        DragonJobs • Built for developers • Inspired by classic minimalist communities
      </footer>
    </>
  )
}
