import { SignJWT, jwtVerify } from 'jose'
import { hash, compare } from 'bcrypt'
import type { Context, Next } from 'hono'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'mochi-dev-secret')
const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed)
}

export async function createToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<number> {
  const { payload } = await jwtVerify(token, SECRET)
  return Number(payload.sub)
}

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    const userId = await verifyToken(header.slice(7))
    c.set('userId', userId)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
}
