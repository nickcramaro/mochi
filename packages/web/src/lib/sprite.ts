/**
 * Procedural pixel art generator for Mochi creatures.
 *
 * Takes trait values (0-1) and a stage, outputs pixel data
 * that can be rendered to a Canvas element.
 */

export interface Traits {
  warmth: number
  energy: number
  complexity: number
  stability: number
  size: number
  curiosity: number
  intensity: number
}

export type Stage = 'egg' | 'hatchling' | 'juvenile' | 'adult' | 'elder'

interface Color {
  r: number
  g: number
  b: number
}

// Color palettes that blend based on warmth trait
const COOL_PALETTE: Color[] = [
  { r: 100, g: 140, b: 200 },
  { r: 70, g: 110, b: 170 },
  { r: 140, g: 180, b: 220 },
  { r: 80, g: 130, b: 160 },
]

const WARM_PALETTE: Color[] = [
  { r: 220, g: 140, b: 80 },
  { r: 180, g: 100, b: 60 },
  { r: 240, g: 180, b: 120 },
  { r: 200, g: 120, b: 90 },
]

const NEUTRAL_PALETTE: Color[] = [
  { r: 160, g: 140, b: 180 },
  { r: 120, g: 100, b: 140 },
  { r: 200, g: 180, b: 210 },
  { r: 140, g: 130, b: 160 },
]

function lerpColor(a: Color, b: Color, t: number): Color {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  }
}

function getPalette(warmth: number): Color[] {
  if (warmth < 0.4) {
    return COOL_PALETTE.map((_, i) => lerpColor(COOL_PALETTE[i], NEUTRAL_PALETTE[i], warmth / 0.4))
  } else if (warmth > 0.6) {
    return NEUTRAL_PALETTE.map((_, i) => lerpColor(NEUTRAL_PALETTE[i], WARM_PALETTE[i], (warmth - 0.6) / 0.4))
  }
  return NEUTRAL_PALETTE
}

function colorToString(c: Color, alpha = 1): string {
  return `rgba(${c.r},${c.g},${c.b},${alpha})`
}

const STAGE_SIZES: Record<Stage, number> = {
  egg: 12,
  hatchling: 16,
  juvenile: 24,
  adult: 32,
  elder: 40,
}

/**
 * Generate a 2D grid of pixel colors for a Mochi creature.
 * Returns a flat array of colors (row-major) + grid size.
 */
export function generateSprite(traits: Traits, stage: Stage, frame = 0): {
  pixels: (string | null)[][]
  size: number
} {
  const gridSize = STAGE_SIZES[stage]
  const palette = getPalette(traits.warmth)
  const [primary, dark, light, accent] = palette

  // Initialize empty grid
  const pixels: (string | null)[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill(null)
  )

  const cx = Math.floor(gridSize / 2)
  const cy = Math.floor(gridSize / 2)

  if (stage === 'egg') {
    // Simple oval
    const rx = Math.floor(gridSize * 0.3)
    const ry = Math.floor(gridSize * 0.4)
    const wobble = Math.sin(frame * 0.5) * 0.5

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const dx = (x - cx + wobble) / rx
        const dy = (y - cy) / ry
        const dist = dx * dx + dy * dy
        if (dist < 1) {
          if (dist > 0.7) pixels[y][x] = colorToString(dark)
          else if (dy < -0.3) pixels[y][x] = colorToString(light)
          else pixels[y][x] = colorToString(primary)
        }
      }
    }
    return { pixels, size: gridSize }
  }

  // Body shape — stability controls symmetry enforcement
  const bodyRadius = gridSize * (0.25 + traits.size * 0.1)
  const symmetry = traits.stability

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Noise for asymmetry (reduced by stability)
      const noise = (1 - symmetry) * Math.sin(x * 3.7 + y * 2.3) * bodyRadius * 0.2
      const effectiveRadius = bodyRadius + noise

      if (dist < effectiveRadius) {
        // Outline
        if (dist > effectiveRadius - 1.5) {
          pixels[y][x] = colorToString(dark)
        }
        // Highlight on top
        else if (dy < -bodyRadius * 0.3 && dx > -bodyRadius * 0.3 && dx < bodyRadius * 0.3) {
          pixels[y][x] = colorToString(light)
        }
        // Body fill
        else {
          pixels[y][x] = colorToString(primary)
        }
      }
    }
  }

  // Eyes — curiosity controls size
  const eyeSize = Math.max(1, Math.floor(1 + traits.curiosity * 2))
  const eyeSpacing = Math.floor(bodyRadius * 0.4)
  const eyeY = cy - Math.floor(bodyRadius * 0.2)

  for (let dy = -eyeSize; dy <= eyeSize; dy++) {
    for (let dx = -eyeSize; dx <= eyeSize; dx++) {
      if (dx * dx + dy * dy <= eyeSize * eyeSize) {
        const ly = eyeY + dy
        // Left eye
        const lx = cx - eyeSpacing + dx
        if (ly >= 0 && ly < gridSize && lx >= 0 && lx < gridSize) {
          pixels[ly][lx] = '#1a1a2e'
        }
        // Right eye (mirrored)
        const rx = cx + eyeSpacing + dx
        if (ly >= 0 && ly < gridSize && rx >= 0 && rx < gridSize) {
          pixels[ly][rx] = '#1a1a2e'
        }
      }
    }
  }

  // Eye shine
  if (eyeSize >= 1) {
    const shineY = eyeY - Math.floor(eyeSize * 0.5)
    const shineX1 = cx - eyeSpacing + Math.floor(eyeSize * 0.3)
    const shineX2 = cx + eyeSpacing + Math.floor(eyeSize * 0.3)
    if (shineY >= 0 && shineY < gridSize) {
      if (shineX1 >= 0 && shineX1 < gridSize) pixels[shineY][shineX1] = '#ffffff'
      if (shineX2 >= 0 && shineX2 < gridSize) pixels[shineY][shineX2] = '#ffffff'
    }
  }

  // Complexity: add pattern markings
  if (traits.complexity > 0.3 && stage !== 'hatchling') {
    const markingCount = Math.floor(traits.complexity * 6)
    for (let i = 0; i < markingCount; i++) {
      const angle = (i / markingCount) * Math.PI * 2
      const r = bodyRadius * 0.5
      const mx = Math.floor(cx + Math.cos(angle) * r)
      const my = Math.floor(cy + Math.sin(angle) * r)
      if (mx >= 0 && mx < gridSize && my >= 0 && my < gridSize && pixels[my][mx] !== null) {
        pixels[my][mx] = colorToString(accent)
      }
    }
  }

  // Intensity: glow effect on edges
  if (traits.intensity > 0.5) {
    const glowAlpha = (traits.intensity - 0.5) * 2
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (pixels[y][x] === null) {
          // Check if adjacent to body
          const neighbors = [
            [y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1],
          ]
          const hasBody = neighbors.some(([ny, nx]) =>
            ny >= 0 && ny < gridSize && nx >= 0 && nx < gridSize && pixels[ny][nx] !== null
          )
          if (hasBody) {
            pixels[y][x] = colorToString(light, glowAlpha * 0.4)
          }
        }
      }
    }
  }

  // Energy: bounce animation
  if (traits.energy > 0.5 && frame % 4 < 2) {
    // Shift body up by 1 pixel on even frames for bounce effect
    const shifted: (string | null)[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(null)
    )
    for (let y = 1; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        shifted[y - 1][x] = pixels[y][x]
      }
    }
    return { pixels: shifted, size: gridSize }
  }

  return { pixels, size: gridSize }
}
