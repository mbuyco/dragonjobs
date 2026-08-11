import { eq, max } from 'drizzle-orm'
import type { Db } from './client.ts'
import { jobSources, jobs } from './schema.ts'

export function getLatestSyncAt(db: Db, sourceName: string): string | undefined {
  const sourceIdRow = db
    .select({ id: jobSources.id })
    .from(jobSources)
    .where(eq(jobSources.name, sourceName))
    .get()

  if (!sourceIdRow) return undefined

  const row = db
    .select({ latestSyncAt: max(jobs.syncedAt) })
    .from(jobs)
    .where(eq(jobs.sourceId, sourceIdRow.id))
    .get()

  return row?.latestSyncAt ?? undefined
}
