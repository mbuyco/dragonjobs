import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema.ts'
import { resolveDatabasePath } from './path.ts'

export type Db = ReturnType<typeof createDb>

export function createDb(databaseUrl?: string) {
  const dbPath = resolveDatabasePath(databaseUrl)
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}
