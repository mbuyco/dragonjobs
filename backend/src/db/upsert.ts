import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import type { JobIngestDto } from '../dto/job.dto.ts'
import type { Db } from './client.ts'
import { jobs, jobTags } from './schema.ts'
import { getSourceId } from './seed.ts'

export function upsertJob(db: Db, job: JobIngestDto): void {
  const sourceId = getSourceId(db, job.source)
  const existing = db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.sourceId, sourceId), eq(jobs.externalId, job.externalId)))
    .get()

  const now = new Date().toISOString()
  const jobId = existing?.id ?? randomUUID()
  const values = {
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
    description: job.description ?? null,
    applyUrl: job.applyUrl,
    postedAt: job.postedAt?.toISOString() ?? null,
    fetchedAt: now,
    isActive: true,
    rawPayload: JSON.stringify(job.rawPayload),
  }

  if (existing) {
    db.update(jobs).set(values).where(eq(jobs.id, jobId)).run()
  } else {
    db.insert(jobs).values(values).run()
  }

  db.delete(jobTags).where(eq(jobTags.jobId, jobId)).run()
  if (job.tags.length > 0) {
    db.insert(jobTags)
      .values(job.tags.map((tag) => ({ jobId, tag })))
      .run()
  }
}
