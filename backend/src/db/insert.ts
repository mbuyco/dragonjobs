import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import type { JobIngestDto } from '../dto/job.dto.ts'
import type { Db } from './client.ts'
import { jobs, jobTags } from './schema.ts'
import { getSourceId } from './seed.ts'

export function getExistingExternalIds(db: Db, source: JobIngestDto['source']): Set<string> {
  const sourceId = getSourceId(db, source)
  const rows = db
    .select({ externalId: jobs.externalId })
    .from(jobs)
    .where(eq(jobs.sourceId, sourceId))
    .all()
  return new Set(rows.map((row) => row.externalId))
}

/** Insert when `(source, externalId)` absent. Returns true if inserted. */
export function insertJobIfAbsent(db: Db, job: JobIngestDto): boolean {
  const sourceId = getSourceId(db, job.source)
  const existing = db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.sourceId, sourceId), eq(jobs.externalId, job.externalId)))
    .get()

  if (existing) return false

  const jobId = randomUUID()
  const syncedAt = new Date().toISOString()

  db.insert(jobs)
    .values({
      id: jobId,
      sourceId,
      externalId: job.externalId,
      title: job.title,
      company: job.company,
      location: job.location ?? null,
      salary: job.salary ?? null,
      salaryMin: job.salaryMin ?? null,
      salaryMax: job.salaryMax ?? null,
      currency: job.currency ?? null,
      workArrangement: job.workArrangement,
      applyUrl: job.applyUrl,
      postedAt: job.postedAt?.toISOString() ?? null,
      syncedAt,
    })
    .run()

  if (job.tags.length > 0) {
    db.insert(jobTags)
      .values(job.tags.map((tag) => ({ jobId, tag })))
      .run()
  }

  return true
}
