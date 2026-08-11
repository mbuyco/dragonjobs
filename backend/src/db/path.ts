import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_DB_URL = 'file:./data/dragonjobs.db'
const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export function resolveDatabasePath(databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DB_URL): string {
  const withoutScheme = databaseUrl.replace(/^file:/, '')
  const absolutePath = isAbsolute(withoutScheme)
    ? withoutScheme
    : resolve(BACKEND_ROOT, withoutScheme)

  mkdirSync(dirname(absolutePath), { recursive: true })
  return absolutePath
}
