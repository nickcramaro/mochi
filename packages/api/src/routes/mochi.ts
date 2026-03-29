import { Hono } from 'hono'
import db from '../db/index.js'
import { authMiddleware } from '../lib/auth.js'
import { evolve, getDormancyState } from '../lib/evolution.js'

const mochi = new Hono()
mochi.use('*', authMiddleware)

interface MochiRow {
  id: number
  user_id: number
  name: string
  stage: string
  warmth: number
  energy: number
  complexity: number
  stability: number
  size: number
  curiosity: number
  intensity: number
  total_sessions: number
  dormancy_state: string
  last_fed_at: string | null
  created_at: string
  updated_at: string
}

mochi.get('/', (c) => {
  const userId = c.get('userId')
  const row = db.prepare('SELECT * FROM mochis WHERE user_id = ?').get(userId) as MochiRow | undefined
  if (!row) return c.json({ error: 'No Mochi found' }, 404)

  const dormancy = getDormancyState(row.last_fed_at)
  if (dormancy !== row.dormancy_state) {
    db.prepare('UPDATE mochis SET dormancy_state = ? WHERE id = ?').run(dormancy, row.id)
    row.dormancy_state = dormancy
  }

  return c.json({
    id: row.id,
    name: row.name,
    stage: row.stage,
    traits: {
      warmth: row.warmth,
      energy: row.energy,
      complexity: row.complexity,
      stability: row.stability,
      size: row.size,
      curiosity: row.curiosity,
      intensity: row.intensity,
    },
    totalSessions: row.total_sessions,
    dormancyState: row.dormancy_state,
    lastFedAt: row.last_fed_at,
    createdAt: row.created_at,
  })
})

mochi.post('/feed', async (c) => {
  const userId = c.get('userId')
  const session = await c.req.json()

  const row = db.prepare('SELECT * FROM mochis WHERE user_id = ?').get(userId) as MochiRow | undefined
  if (!row) return c.json({ error: 'No Mochi found' }, 404)

  const traits = {
    warmth: row.warmth,
    energy: row.energy,
    complexity: row.complexity,
    stability: row.stability,
    size: row.size,
    curiosity: row.curiosity,
    intensity: row.intensity,
  }

  const toolUsage = typeof session.tool_usage === 'string'
    ? JSON.parse(session.tool_usage)
    : session.tool_usage || {}

  const { traits: newTraits, stage } = evolve(traits, row.total_sessions, {
    duration_minutes: session.duration_minutes || 0,
    tool_usage: toolUsage,
    sentiment_avg: session.sentiment_avg || 0,
    sentiment_variance: session.sentiment_variance || 0,
    iteration_count: session.iteration_count || 0,
    completed: session.completed !== false,
    time_of_day: session.time_of_day || 'morning',
    error_count: session.error_count || 0,
  })

  // Store session
  db.prepare(`
    INSERT INTO sessions (mochi_id, duration_minutes, tool_usage, sentiment_avg, sentiment_variance, iteration_count, completed, time_of_day, error_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    row.id,
    session.duration_minutes || 0,
    JSON.stringify(toolUsage),
    session.sentiment_avg || 0,
    session.sentiment_variance || 0,
    session.iteration_count || 0,
    session.completed !== false ? 1 : 0,
    session.time_of_day || 'morning',
    session.error_count || 0,
  )

  // Update mochi
  db.prepare(`
    UPDATE mochis SET
      warmth = ?, energy = ?, complexity = ?, stability = ?,
      size = ?, curiosity = ?, intensity = ?,
      stage = ?, total_sessions = total_sessions + 1,
      dormancy_state = 'awake', last_fed_at = datetime('now'),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    newTraits.warmth, newTraits.energy, newTraits.complexity, newTraits.stability,
    newTraits.size, newTraits.curiosity, newTraits.intensity,
    stage, row.id,
  )

  return c.json({
    stage,
    traits: newTraits,
    totalSessions: row.total_sessions + 1,
  })
})

mochi.get('/history', (c) => {
  const userId = c.get('userId')
  const row = db.prepare('SELECT id FROM mochis WHERE user_id = ?').get(userId) as { id: number } | undefined
  if (!row) return c.json({ error: 'No Mochi found' }, 404)

  const sessions = db.prepare(
    'SELECT id, duration_minutes, sentiment_avg, iteration_count, time_of_day, created_at FROM sessions WHERE mochi_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(row.id)

  return c.json({ sessions })
})

mochi.patch('/name', async (c) => {
  const userId = c.get('userId')
  const { name } = await c.req.json()
  if (!name || name.length > 30) return c.json({ error: 'Name required (max 30 chars)' }, 400)

  db.prepare('UPDATE mochis SET name = ?, updated_at = datetime(\'now\') WHERE user_id = ?').run(name, userId)
  return c.json({ name })
})

export default mochi
