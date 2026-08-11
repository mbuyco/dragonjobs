import { z } from 'zod'
import { WorkArrangement } from './job.dto.ts'

export const JobListItem = z.object({
  id: z.string().uuid(),
  title: z.string(),
  company: z.string(),
  source: z.enum(['kalibrr', 'remotive']),
  tags: z.array(z.string()),
  applyUrl: z.string().url(),
  salary: z.string().optional(),
  postedAt: z.string().datetime().optional(),
  workArrangement: WorkArrangement.optional(),
})
export type JobListItem = z.infer<typeof JobListItem>

export const JobListResponse = z.object({
  jobs: z.array(JobListItem),
})
export type JobListResponse = z.infer<typeof JobListResponse>
