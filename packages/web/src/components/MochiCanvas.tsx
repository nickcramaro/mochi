import { useRef, useEffect, useState } from 'react'
import { generateSprite, type Traits, type Stage } from '../lib/sprite'

interface Props {
  traits: Traits
  stage: Stage
  dormancy: string
  pixelScale?: number
}

const STAGE_SCALE: Record<string, number> = { egg: 8, hatchling: 10, juvenile: 11, adult: 12, elder: 14 }

export default function MochiCanvas({ traits, stage, dormancy, pixelScale }: Props) {
  const scale = pixelScale ?? STAGE_SCALE[stage] ?? 10
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [frame, setFrame] = useState(0)

  // Animation loop
  useEffect(() => {
    const fps = dormancy === 'sleeping' || dormancy === 'deep_sleep' ? 1 : dormancy === 'drowsy' ? 2 : 4
    const interval = setInterval(() => {
      setFrame((f) => f + 1)
    }, 1000 / fps)
    return () => clearInterval(interval)
  }, [dormancy])

  // Render sprite
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { pixels, size } = generateSprite(traits, stage, frame)
    canvas.width = size * scale
    canvas.height = size * scale

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const color = pixels[y][x]
        if (color) {
          ctx.fillStyle = color
          ctx.fillRect(x * scale, y * scale, scale, scale)
        }
      }
    }

    // Dormancy overlay
    if (dormancy === 'sleeping' || dormancy === 'deep_sleep') {
      ctx.fillStyle = 'rgba(0, 0, 20, 0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Z's
      ctx.fillStyle = '#8888cc'
      ctx.font = `${scale * 3}px monospace`
      const zOffset = Math.sin(frame * 0.3) * scale * 2
      ctx.fillText('z', canvas.width * 0.65 + zOffset, canvas.height * 0.25 - zOffset)
      ctx.font = `${scale * 2}px monospace`
      ctx.fillText('z', canvas.width * 0.72 + zOffset * 1.5, canvas.height * 0.15 - zOffset * 1.5)
    }
  }, [traits, stage, frame, scale, dormancy])

  return (
    <canvas
      ref={canvasRef}
      className="block mx-auto"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
