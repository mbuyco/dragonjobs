import { sql } from 'drizzle-orm'
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const jobSources = sqliteTable('job_sources', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  baseUrl: text('base_url').notNull(),
})

export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    sourceId: integer('source_id')
      .notNull()
      .references(() => jobSources.id),
    externalId: text('external_id').notNull(),
    title: text('title').notNull(),
    company: text('company').notNull(),
    location: text('location'),
    salary: text('salary'),
    salaryMin: real('salary_min'),
    salaryMax: real('salary_max'),
    currency: text('currency'),
    workArrangement: text('work_arrangement'),
    description: text('description'),
    applyUrl: text('apply_url').notNull(),
    postedAt: text('posted_at'),
    fetchedAt: text('fetched_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    rawPayload: text('raw_payload').notNull(),
  },
  (table) => [
    uniqueIndex('jobs_source_external_uidx').on(table.sourceId, table.externalId),
    index('idx_jobs_posted_at').on(table.postedAt),
    index('idx_jobs_is_active').on(table.isActive),
  ],
)

export const jobTags = sqliteTable(
  'job_tags',
  {
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
  },
  (table) => [
    uniqueIndex('job_tags_pk').on(table.jobId, table.tag),
    index('idx_job_tags_tag').on(table.tag),
  ],
)
