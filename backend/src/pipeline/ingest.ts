import { ZodError } from 'zod'
import type { Db } from '../db/client.ts'
import { upsertJob } from '../db/upsert.ts'
import { JobIngestDto } from '../dto/job.dto.ts'
import { kalibrrAdapter } from '../sources/kalibrr.ts'
import { remotiveAdapter } from '../sources/remotive.ts'
import { loadIngestQueryFromEnv, type JobSourceAdapter } from '../sources/types.ts'

export interface SourceStats {
  source: string
  fetched: number
  valid: number
  skipped: number
  upserted: number
}

export interface IngestSummary {
  sources: SourceStats[]
  totals: Omit<SourceStats, 'source'>
}

const adapters: JobSourceAdapter[] = [remotiveAdapter, kalibrrAdapter]

export async function runIngest(db: Db): Promise<IngestSummary> {
  const query = loadIngestQueryFromEnv()
  const sources: SourceStats[] = []

  for (const adapter of adapters) {
    const stats: SourceStats = {
      source: adapter.name,
      fetched: 0,
      valid: 0,
      skipped: 0,
      upserted: 0,
    }

    const fetched = await adapter.fetch(query)
    stats.fetched = fetched.length

    for (const candidate of fetched) {
      try {
        const job = JobIngestDto.parse(candidate)
        upsertJob(db, job)
        stats.valid += 1
        stats.upserted += 1
      } catch (error) {
        stats.skipped += 1
        const externalId =
          candidate && typeof candidate === 'object' && 'externalId' in candidate
            ? String((candidate as { externalId?: unknown }).externalId ?? 'unknown')
            : 'unknown'
        if (error instanceof ZodError) {
          console.error(
            `[ingest] skip ${adapter.name}/${externalId}:`,
            error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
          )
        } else {
          console.error(
            `[ingest] skip ${adapter.name}/${externalId}:`,
            error instanceof Error ? error.message : error,
          )
        }
      }
    }

    sources.push(stats)
  }

  const totals = sources.reduce(
    (acc, source) => {
      acc.fetched += source.fetched
      acc.valid += source.valid
      acc.skipped += source.skipped
      acc.upserted += source.upserted
      return acc
    },
    { fetched: 0, valid: 0, skipped: 0, upserted: 0 },
  )

  return { sources, totals }
}

export function logIngestSummary(summary: IngestSummary): void {
  for (const source of summary.sources) {
    console.log(
      `[${source.source}] fetched=${source.fetched} valid=${source.valid} skipped=${source.skipped} upserted=${source.upserted}`,
    )
  }
  console.log(
    `[total] fetched=${summary.totals.fetched} valid=${summary.totals.valid} skipped=${summary.totals.skipped} upserted=${summary.totals.upserted}`,
  )
}
