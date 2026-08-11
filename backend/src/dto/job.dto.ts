import { z } from 'zod'

export const WorkArrangement = z.enum(['remote', 'hybrid', 'onsite', 'unknown'])
export type WorkArrangement = z.infer<typeof WorkArrangement>

export const JobIngestDto = z.object({
  source: z.enum(['kalibrr', 'remotive']),
  externalId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  salary: z.string().optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  workArrangement: WorkArrangement.default('unknown'),
  tags: z.array(z.string()).default([]),
  description: z.string().optional(),
  applyUrl: z.string().url(),
  postedAt: z.coerce.date().optional(),
  rawPayload: z.record(z.unknown()),
})
export type JobIngestDto = z.infer<typeof JobIngestDto>

export const IngestBatch = z.object({
  source: z.enum(['kalibrr', 'remotive']),
  fetchedAt: z.coerce.date(),
  jobs: z.array(JobIngestDto),
})
export type IngestBatch = z.infer<typeof IngestBatch>
