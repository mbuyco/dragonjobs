import { desc, eq, inArray, sql } from 'drizzle-orm'
import type { JobListItem } from '../dto/job-list.dto.ts'
import type { Db } from './client.ts'
import { jobSources, jobTags, jobs } from './schema.ts'

export function listJobs(db: Db): JobListItem[] {
  const rows = db
    .select({
      id: jobs.id,
      title: jobs.title,
      company: jobs.company,
      salary: jobs.salary,
      postedAt: jobs.postedAt,
      workArrangement: jobs.workArrangement,
      applyUrl: jobs.applyUrl,
      source: jobSources.name,
    })
    .from(jobs)
    .innerJoin(jobSources, eq(jobs.sourceId, jobSources.id))
    .where(eq(jobs.isActive, true))
    .orderBy(
      sql`CASE WHEN ${jobs.postedAt} IS NULL THEN 1 ELSE 0 END`,
      desc(jobs.postedAt),
      desc(jobs.fetchedAt),
    )
    .all()

  if (rows.length === 0) {
    return []
  }

  const jobIds = rows.map((row) => row.id)
  const tagRows = db
    .select({ jobId: jobTags.jobId, tag: jobTags.tag })
    .from(jobTags)
    .where(inArray(jobTags.jobId, jobIds))
    .all()

  const tagsByJobId = new Map<string, string[]>()
  for (const tagRow of tagRows) {
    const existing = tagsByJobId.get(tagRow.jobId) ?? []
    existing.push(tagRow.tag)
    tagsByJobId.set(tagRow.jobId, existing)
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    company: row.company,
    source: row.source as JobListItem['source'],
    tags: tagsByJobId.get(row.id) ?? [],
    applyUrl: row.applyUrl,
    ...(row.salary ? { salary: row.salary } : {}),
    ...(row.postedAt ? { postedAt: row.postedAt } : {}),
    ...(row.workArrangement
      ? { workArrangement: row.workArrangement as JobListItem['workArrangement'] }
      : {}),
  }))
}
