import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runMigrations } from './db/migrate.ts'
import { logIngestSummary, runIngest, type IngestSummary } from './pipeline/ingest.ts'
import { resolveDatabasePath } from './db/path.ts'

const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const SUMMARY_OUTPUT = resolve(BACKEND_ROOT, 'backend/data/ingest-summary.json')

function writeSummary(summary: IngestSummary) {
  const payload = {
    dataChanged: summary.dataChanged,
    ttlDeleted: summary.ttlDeleted,
    sources: summary.sources.map((source) => ({
      name: source.source,
      fetched: source.fetched,
      inserted: source.inserted,
      alreadyPresent: source.alreadyPresent,
      lookbackSkipped: source.lookbackSkipped,
    })),
    totals: summary.totals,
  }
  mkdirSync(dirname(SUMMARY_OUTPUT), { recursive: true })
  writeFileSync(SUMMARY_OUTPUT, JSON.stringify(payload, null, 2), 'utf-8')
  console.log(`Summary written to ${SUMMARY_OUTPUT}`)
}

async function main() {
  try {
    const dbPath = resolveDatabasePath()
    console.log(`Using database: ${dbPath}`)
    const db = runMigrations()
    const summary = await runIngest(db)
    logIngestSummary(summary)
    writeSummary(summary)
  } catch (error) {
    console.error(
      'Ingest failed — database cannot be opened or created:',
      error instanceof Error ? error.message : error,
    )
    process.exit(1)
  }
}

void main()
