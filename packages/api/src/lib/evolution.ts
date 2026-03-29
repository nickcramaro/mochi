const LEARNING_RATE = 0.012
const SIZE_INCREMENT = 0.001

const STAGE_THRESHOLDS = {
  egg: 0,
  hatchling: 3,
  juvenile: 20,
  adult: 100,
  elder: 500,
} as const

type Stage = keyof typeof STAGE_THRESHOLDS

interface Traits {
  warmth: number
  energy: number
  complexity: number
  stability: number
  size: number
  curiosity: number
  intensity: number
}

interface SessionData {
  duration_minutes: number
  tool_usage: Record<string, number>
  sentiment_avg: number
  sentiment_variance: number
  iteration_count: number
  completed: boolean
  time_of_day: string
  error_count: number
}

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

export function evolve(traits: Traits, totalSessions: number, session: SessionData): { traits: Traits; stage: Stage } {
  const toolNames = Object.keys(session.tool_usage)
  const totalToolUses = Object.values(session.tool_usage).reduce((a, b) => a + b, 0)
  const readSearchUses = (session.tool_usage['Read'] || 0) +
    (session.tool_usage['Grep'] || 0) +
    (session.tool_usage['Glob'] || 0) +
    (session.tool_usage['WebSearch'] || 0) +
    (session.tool_usage['WebFetch'] || 0)

  const isNight = ['night', 'late_night'].includes(session.time_of_day)

  // Traits drift toward their signal. No signal = gentle decay toward 0.5
  const DECAY = 0.003
  function nudge(current: number, signal: number): number {
    // Signal pushes trait, absence pulls toward 0.5
    const push = signal * LEARNING_RATE
    const pull = (0.5 - current) * DECAY
    return clamp(current + push + pull)
  }

  const newTraits: Traits = {
    warmth: nudge(traits.warmth, session.sentiment_avg),
    energy: nudge(traits.energy, session.completed ? 0.8 : -0.4),
    complexity: nudge(traits.complexity, toolNames.length / 8),
    stability: nudge(traits.stability, 1 - session.sentiment_variance * 2),
    size: clamp(traits.size + SIZE_INCREMENT), // size only grows, never decays
    curiosity: nudge(traits.curiosity, totalToolUses > 0 ? (readSearchUses / totalToolUses) * 1.5 : 0),
    intensity: nudge(traits.intensity, isNight ? 1 : -0.3),
  }

  const newTotal = totalSessions + 1
  let stage: Stage = 'egg'
  for (const [s, threshold] of Object.entries(STAGE_THRESHOLDS).reverse()) {
    if (newTotal >= threshold) {
      stage = s as Stage
      break
    }
  }

  return { traits: newTraits, stage }
}

export function getDormancyState(lastFedAt: string | null): string {
  if (!lastFedAt) return 'awake'
  const daysSince = (Date.now() - new Date(lastFedAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSince < 3) return 'awake'
  if (daysSince < 7) return 'drowsy'
  if (daysSince < 30) return 'sleeping'
  return 'deep_sleep'
}
