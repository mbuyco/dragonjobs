import { runMigrations } from './db/migrate.ts'
import { logIngestSummary, runIngest } from './pipeline/ingest.ts'
import { resolveDatabasePath } from './db/path.ts'

async function main() {
  try {
    const dbPath = resolveDatabasePath()
    console.log(`Using database: ${dbPath}`)
    const db = runMigrations()
    const summary = await runIngest(db)
    logIngestSummary(summary)
  } catch (error) {
    console.error(
      'Ingest failed — database cannot be opened or created:',
      error instanceof Error ? error.message : error,
    )
    process.exit(1)
  }
}

void main()
