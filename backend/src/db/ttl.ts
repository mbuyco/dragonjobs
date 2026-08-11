import { lt } from 'drizzle-orm'
import type { Db } from './client.ts'
import { jobs } from './schema.ts'

export function deleteJobsSyncedBefore(db: Db, cutoffIso: string): number {
  const deleted = db.delete(jobs).where(lt(jobs.syncedAt, cutoffIso)).run()
  return deleted.changes
}
