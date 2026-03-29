import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { migrate } from './db/index.js'
import auth from './routes/auth.js'
import mochi from './routes/mochi.js'

migrate()

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

app.route('/api/auth', auth)
app.route('/api/mochi', mochi)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

export default {
  port: Number(process.env.PORT) || 3001,
  fetch: app.fetch,
}
