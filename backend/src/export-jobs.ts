import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { JobListResponse } from './dto/job-list.dto.ts'
import { listJobs } from './db/list-jobs.ts'
import { runMigrations } from './db/migrate.ts'

const BACKEND_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const JOBS_OUTPUT = resolve(BACKEND_ROOT, 'public/jobs.json')

export async function exportJobs(outputPath = JOBS_OUTPUT) {
  const db = runMigrations()
  const jobs = listJobs(db)
  const body = JobListResponse.parse({ jobs })
  mkdirSync(dirname(outputPath), { recursive: true })
  const json = JSON.stringify(body, null, 2)
  const fs = await import('node:fs')
  fs.writeFileSync(outputPath, json, 'utf-8')
  console.log(`Exported ${jobs.length} jobs to ${outputPath}`)
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectRun) {
  try {
    await exportJobs()
  } catch (error) {
    console.error('Export failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
