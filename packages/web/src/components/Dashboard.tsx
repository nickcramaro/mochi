import { useEffect, useState } from 'react'
import { api, clearToken } from '../lib/api'
import MochiCanvas from './MochiCanvas'
import TraitBar from './TraitBar'
import type { Traits, Stage } from '../lib/sprite'

interface MochiData {
  id: number
  name: string
  stage: Stage
  traits: Traits
  totalSessions: number
  dormancyState: string
  lastFedAt: string | null
  createdAt: string
}

const TRAIT_COLORS: Record<string, string> = {
  warmth: '#f59e0b',
  energy: '#22c55e',
  complexity: '#a855f7',
  stability: '#3b82f6',
  size: '#6b7280',
  curiosity: '#06b6d4',
  intensity: '#ef4444',
}

const TRAIT_LABELS: Record<string, string> = {
  warmth: 'Warmth',
  energy: 'Energy',
  complexity: 'Complexity',
  stability: 'Stability',
  size: 'Size',
  curiosity: 'Curiosity',
  intensity: 'Intensity',
}

function formatStage(stage: string): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1)
}

function formatDormancy(state: string): string {
  if (state === 'awake') return ''
  if (state === 'drowsy') return 'Drowsy'
  if (state === 'sleeping') return 'Sleeping'
  if (state === 'deep_sleep') return 'Deep Sleep'
  return state
}

interface Props {
  onLogout: () => void
}

export default function Dashboard({ onLogout }: Props) {
  const [mochi, setMochi] = useState<MochiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getMochi()
      .then((data) => setMochi(data as MochiData))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    clearToken()
    onLogout()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (error || !mochi) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-400">{error || 'Failed to load Mochi'}</p>
      </div>
    )
  }

  const dormancyLabel = formatDormancy(mochi.dormancyState)

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pt-4">
        <h1 className="text-2xl font-bold text-white">Mochi</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Log out
        </button>
      </div>

      {/* Creature Display */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-6">
        <MochiCanvas
          traits={mochi.traits}
          stage={mochi.stage}
          dormancy={mochi.dormancyState}
        />
        <div className="text-center mt-4">
          <h2 className="text-xl font-semibold text-white">{mochi.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-sm text-gray-400">{formatStage(mochi.stage)}</span>
            {dormancyLabel && (
              <>
                <span className="text-gray-600">|</span>
                <span className="text-sm text-yellow-400">{dormancyLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{mochi.totalSessions}</p>
          <p className="text-xs text-gray-400 mt-1">Sessions</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{formatStage(mochi.stage)}</p>
          <p className="text-xs text-gray-400 mt-1">Stage</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {mochi.lastFedAt
              ? new Date(mochi.lastFedAt).toLocaleDateString()
              : 'Never'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Last Fed</p>
        </div>
      </div>

      {/* Traits */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Traits</h3>
        <div className="space-y-3">
          {Object.entries(mochi.traits).map(([key, value]) => (
            <TraitBar
              key={key}
              label={TRAIT_LABELS[key] || key}
              value={value}
              color={TRAIT_COLORS[key] || '#888'}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
