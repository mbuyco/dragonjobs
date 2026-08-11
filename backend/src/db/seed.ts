import { eq } from 'drizzle-orm'
import type { Db } from './client.ts'
import { jobSources } from './schema.ts'

const SOURCES = [
  { name: 'kalibrr', baseUrl: 'https://www.kalibrr.com' },
  { name: 'remotive', baseUrl: 'https://remotive.com' },
] as const

export function seedJobSources(db: Db) {
  for (const source of SOURCES) {
    const existing = db.select().from(jobSources).where(eq(jobSources.name, source.name)).get()
    if (!existing) {
      db.insert(jobSources).values(source).run()
    }
  }
}

export function getSourceId(db: Db, name: string): number {
  const row = db.select().from(jobSources).where(eq(jobSources.name, name)).get()
  if (!row) {
    throw new Error(`Unknown job source: ${name}`)
  }
  return row.id
}
