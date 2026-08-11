import { ZodError } from 'zod'
import type { Db } from '../db/client.ts'
import { getExistingExternalIds, insertJobIfAbsent } from '../db/insert.ts'
import { getLatestSyncAt } from '../db/sync.ts'
import { deleteJobsSyncedBefore } from '../db/ttl.ts'
import { JobIngestDto } from '../dto/job.dto.ts'
import { kalibrrAdapter } from '../sources/kalibrr.ts'
import { remotiveAdapter } from '../sources/remotive.ts'
import { loadIngestQueryFromEnv, type JobSourceAdapter } from '../sources/types.ts'
import { isWithinLookback } from './lookback.ts'

export interface SourceStats {
  source: string
  fetched: number
  valid: number
  skipped: number
  inserted: number
  alreadyPresent: number
  inactiveSkipped: number
  unbuildableUrl: number
  lookbackSkipped: number
  ttlSkipped: number
}

export interface IngestSummary {
  dataChanged: boolean
  ttlDeleted: number
  sources: SourceStats[]
  totals: Omit<SourceStats, 'source'>
}

const adapters: JobSourceAdapter[] = [remotiveAdapter, kalibrrAdapter]

function emptySourceStats(source: string): SourceStats {
  return {
    source,
    fetched: 0,
    valid: 0,
    skipped: 0,
    inserted: 0,
    alreadyPresent: 0,
    inactiveSkipped: 0,
    unbuildableUrl: 0,
    lookbackSkipped: 0,
    ttlSkipped: 0,
  }
}

function ttlCutoffIso(jobTtlHours: number): string {
  return new Date(Date.now() - jobTtlHours * 60 * 60 * 1000).toISOString()
}

export async function runIngest(db: Db): Promise<IngestSummary> {
  const query = loadIngestQueryFromEnv()
  const ttlDeleted = deleteJobsSyncedBefore(db, ttlCutoffIso(query.jobTtlHours))
  const sources: SourceStats[] = []
  const now = new Date()

  for (const adapter of adapters) {
    const stats = emptySourceStats(adapter.name)
    const cutoffIso = ttlCutoffIso(query.jobTtlHours)
    const latestSyncAt = getLatestSyncAt(db, adapter.name)

    if (latestSyncAt && latestSyncAt >= cutoffIso) {
      stats.ttlSkipped = 1
      console.log(`[${adapter.name}] skip fetch: within TTL`)
      sources.push(stats)
      continue
    }

    const fetchResult = await adapter.fetch(query)
    stats.fetched =
      fetchResult.jobs.length + fetchResult.inactiveSkipped + fetchResult.unbuildableUrl
    stats.inactiveSkipped = fetchResult.inactiveSkipped
    stats.unbuildableUrl = fetchResult.unbuildableUrl

    const existingIds = getExistingExternalIds(db, adapter.name)

    for (const candidate of fetchResult.jobs) {
      try {
        const job = JobIngestDto.parse(candidate)

        if (existingIds.has(job.externalId)) {
          stats.alreadyPresent += 1
          stats.valid += 1
          continue
        }

        if (!isWithinLookback(job.postedAt, query.ingestLookbackHours, now)) {
          stats.lookbackSkipped += 1
          stats.valid += 1
          continue
        }

        if (insertJobIfAbsent(db, job)) {
          existingIds.add(job.externalId)
          stats.inserted += 1
          stats.valid += 1
        } else {
          stats.alreadyPresent += 1
          stats.valid += 1
        }
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
      acc.inserted += source.inserted
      acc.alreadyPresent += source.alreadyPresent
      acc.inactiveSkipped += source.inactiveSkipped
      acc.unbuildableUrl += source.unbuildableUrl
      acc.lookbackSkipped += source.lookbackSkipped
      acc.ttlSkipped += source.ttlSkipped
      return acc
    },
    {
      fetched: 0,
      valid: 0,
      skipped: 0,
      inserted: 0,
      alreadyPresent: 0,
      inactiveSkipped: 0,
      unbuildableUrl: 0,
      lookbackSkipped: 0,
      ttlSkipped: 0,
    },
  )

  const dataChanged = ttlDeleted > 0 || sources.some((source) => source.ttlSkipped === 0)

  return { dataChanged, ttlDeleted, sources, totals }
}

export function logIngestSummary(summary: IngestSummary): void {
  console.log(`[ttl] deleted=${summary.ttlDeleted}`)
  for (const source of summary.sources) {
    console.log(
      `[${source.source}] fetched=${source.fetched} valid=${source.valid} skipped=${source.skipped} inserted=${source.inserted} already-present=${source.alreadyPresent} inactive-skipped=${source.inactiveSkipped} unbuildable-url=${source.unbuildableUrl} lookback-skipped=${source.lookbackSkipped} ttl-skipped=${source.ttlSkipped}`,
    )
  }
  const t = summary.totals
  console.log(
    `[total] fetched=${t.fetched} valid=${t.valid} skipped=${t.skipped} inserted=${t.inserted} already-present=${t.alreadyPresent} inactive-skipped=${t.inactiveSkipped} unbuildable-url=${t.unbuildableUrl} lookback-skipped=${t.lookbackSkipped} ttl-deleted=${summary.ttlDeleted}`,
  )
  console.log(`dataChanged=${summary.dataChanged}`)
}
