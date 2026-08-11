import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createDb } from './db/client.ts'
import { listJobs } from './db/list-jobs.ts'
import { JobListResponse } from './dto/job-list.dto.ts'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  }),
)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

app.get('/api/jobs', (c) => {
  const db = createDb()
  const jobs = listJobs(db)
  const body = JobListResponse.parse({ jobs })
  return c.json(body)
})

const port = Number(process.env.PORT) || 3001

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})
