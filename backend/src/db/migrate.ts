import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createDb } from './client.ts'
import { seedJobSources } from './seed.ts'

const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export function runMigrations(databaseUrl?: string) {
  const db = createDb(databaseUrl)
  migrate(db, { migrationsFolder: resolve(BACKEND_ROOT, 'drizzle') })
  seedJobSources(db)
  return db
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  try {
    runMigrations()
    console.log('Migrations applied.')
  } catch (error) {
    console.error('Migration failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
