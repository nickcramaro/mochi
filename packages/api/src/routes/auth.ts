import { Hono } from 'hono'
import db from '../db/index.js'
import { hashPassword, verifyPassword, createToken } from '../lib/auth.js'

const auth = new Hono()

auth.post('/register', async (c) => {
  const { email, password } = await c.req.json()
  if (!email || !password || password.length < 8) {
    return c.json({ error: 'Email and password (8+ chars) required' }, 400)
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  const passwordHash = await hashPassword(password)
  db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(email, passwordHash)
  const userId = (db.prepare('SELECT last_insert_rowid() as id').get() as { id: number }).id

  // Create their Mochi
  db.prepare('INSERT INTO mochis (user_id) VALUES (?)').run(userId)

  const token = await createToken(userId)
  return c.json({ token, userId })
})

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json()
  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400)
  }

  const user = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(email) as
    | { id: number; password_hash: string }
    | undefined
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = await createToken(user.id)
  return c.json({ token, userId: user.id })
})

export default auth
