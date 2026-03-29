const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('mochi_token')
}

export function setToken(token: string) {
  localStorage.setItem('mochi_token', token)
}

export function clearToken() {
  localStorage.removeItem('mochi_token')
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  register: (email: string, password: string) =>
    request<{ token: string; userId: number }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; userId: number }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMochi: () =>
    request<{
      id: number
      name: string
      stage: string
      traits: {
        warmth: number
        energy: number
        complexity: number
        stability: number
        size: number
        curiosity: number
        intensity: number
      }
      totalSessions: number
      dormancyState: string
      lastFedAt: string | null
      createdAt: string
    }>('/mochi'),

  getHistory: () =>
    request<{ sessions: Array<Record<string, unknown>> }>('/mochi/history'),

  renameMochi: (name: string) =>
    request<{ name: string }>('/mochi/name', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
}
