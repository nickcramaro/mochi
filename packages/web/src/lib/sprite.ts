/**
 * Procedural pixel art generator for Mochi creatures.
 * Each creature is uniquely shaped by 7 trait dimensions.
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

interface Color { r: number; g: number; b: number }

// Wider color range for more visual punch
const COOL: Color[] = [
  { r: 80, g: 140, b: 220 },  // body
  { r: 45, g: 90, b: 160 },   // outline
  { r: 140, g: 185, b: 240 }, // highlight
  { r: 60, g: 170, b: 200 },  // accent
  { r: 110, g: 160, b: 230 }, // belly
]
const WARM: Color[] = [
  { r: 235, g: 140, b: 65 },
  { r: 180, g: 85, b: 35 },
  { r: 255, g: 195, b: 110 },
  { r: 230, g: 95, b: 75 },
  { r: 245, g: 175, b: 120 },
]
const NEU: Color[] = [
  { r: 165, g: 140, b: 195 },
  { r: 110, g: 90, b: 145 },
  { r: 210, g: 190, b: 230 },
  { r: 170, g: 120, b: 185 },
  { r: 190, g: 170, b: 210 },
]

function lerp(a: Color, b: Color, t: number): Color {
  return { r: Math.round(a.r + (b.r - a.r) * t), g: Math.round(a.g + (b.g - a.g) * t), b: Math.round(a.b + (b.b - a.b) * t) }
}

function getPalette(w: number): Color[] {
  if (w < 0.35) return COOL.map((_, i) => lerp(COOL[i], NEU[i], w / 0.35))
  if (w > 0.65) return NEU.map((_, i) => lerp(NEU[i], WARM[i], (w - 0.65) / 0.35))
  return NEU
}

function c(col: Color, a = 1): string {
  return a >= 1 ? `rgb(${col.r},${col.g},${col.b})` : `rgba(${col.r},${col.g},${col.b},${a})`
}

function set(px: (string | null)[][], y: number, x: number, color: string, gs: number) {
  if (y >= 0 && y < gs && x >= 0 && x < gs) px[y][x] = color
}

function get(px: (string | null)[][], y: number, x: number, gs: number): string | null {
  if (y >= 0 && y < gs && x >= 0 && x < gs) return px[y][x]
  return null
}

const SIZES: Record<Stage, number> = { egg: 16, hatchling: 20, juvenile: 28, adult: 36, elder: 44 }

export function generateSprite(traits: Traits, stage: Stage, frame = 0): {
  pixels: (string | null)[][]
  size: number
} {
  const gs = SIZES[stage]
  const pal = getPalette(traits.warmth)
  const [body, outline, highlight, accent, belly] = pal
  const px: (string | null)[][] = Array.from({ length: gs }, () => Array(gs).fill(null))
  const cx = Math.floor(gs / 2)
  const cy = Math.floor(gs / 2)

  // ── EGG ──────────────────────────────────────────────
  if (stage === 'egg') {
    const rx = gs * 0.28
    const ry = gs * 0.36
    const wobble = Math.sin(frame * 0.4) * 0.8

    for (let y = 0; y < gs; y++) {
      for (let x = 0; x < gs; x++) {
        const dx = (x - cx + wobble) / rx
        const dy = (y - cy + 1) / ry
        const d = dx * dx + dy * dy
        if (d < 1) {
          if (d > 0.78) set(px, y, x, c(outline), gs)
          else if (dy < -0.15 && d < 0.55) set(px, y, x, c(highlight), gs)
          else set(px, y, x, c(body), gs)
        }
      }
    }
    // Crack lines hint at what's inside
    if (traits.size > 0.3) {
      const crackY = cy + Math.floor(ry * 0.1)
      for (let i = -2; i <= 2; i++) {
        set(px, crackY, cx + i, c(outline), gs)
        if (Math.abs(i) < 2) set(px, crackY + 1, cx + i + 1, c(outline), gs)
      }
    }
    return { pixels: px, size: gs }
  }

  // ── BODY ─────────────────────────────────────────────
  // Shape varies by stage: rounder when young, more defined when older
  const baseR = gs * (0.22 + traits.size * 0.06)
  const bodyW = baseR * (stage === 'hatchling' ? 1.1 : stage === 'elder' ? 0.9 : 1.0)
  const bodyH = baseR * (stage === 'hatchling' ? 0.95 : stage === 'elder' ? 1.15 : 1.05)
  const bodyOffY = stage === 'hatchling' ? 1 : stage === 'elder' ? -1 : 0

  for (let y = 0; y < gs; y++) {
    for (let x = 0; x < gs; x++) {
      const dx = (x - cx) / bodyW
      const dy = (y - (cy + bodyOffY)) / bodyH
      let d = dx * dx + dy * dy

      // Asymmetry from low stability
      const noise = (1 - traits.stability) * Math.sin(x * 2.9 + y * 1.7 + traits.complexity * 4) * 0.15
      d += noise

      if (d < 1) {
        if (d > 0.82) set(px, y, x, c(outline), gs)
        else if (dy < -0.25 && Math.abs(dx) < 0.5 && d < 0.6) set(px, y, x, c(highlight), gs)
        else set(px, y, x, c(body), gs)
      }
    }
  }

  // ── BELLY PATCH ──────────────────────────────────────
  if (stage !== 'hatchling') {
    const bellyR = bodyW * 0.55
    const bellyY = cy + bodyOffY + bodyH * 0.2
    for (let y = 0; y < gs; y++) {
      for (let x = 0; x < gs; x++) {
        const dx = (x - cx) / bellyR
        const dy = (y - bellyY) / (bellyR * 0.7)
        if (dx * dx + dy * dy < 1 && px[y]?.[x] === c(body)) {
          set(px, y, x, c(belly), gs)
        }
      }
    }
  }

  // ── EARS / HORNS ─────────────────────────────────────
  // Stage-dependent features on top
  if (stage === 'hatchling' || stage === 'juvenile') {
    // Cute round ears
    const earR = stage === 'hatchling' ? 2 : 3
    const earSpread = Math.floor(bodyW * 0.6)
    const earY = cy + bodyOffY - Math.floor(bodyH * 0.85)
    for (const side of [-1, 1]) {
      const earX = cx + side * earSpread
      for (let dy = -earR; dy <= earR; dy++) {
        for (let dx = -earR; dx <= earR; dx++) {
          if (dx * dx + dy * dy <= earR * earR) {
            const ey = earY + dy, ex = earX + dx
            if (dx * dx + dy * dy > (earR - 1) * (earR - 1))
              set(px, ey, ex, c(outline), gs)
            else
              set(px, ey, ex, c(accent), gs)
          }
        }
      }
    }
  } else if (stage === 'adult' || stage === 'elder') {
    // Pointed ears/horns — height based on energy
    const hornH = Math.floor(2 + traits.energy * 4)
    const hornSpread = Math.floor(bodyW * 0.55)
    const hornBase = cy + bodyOffY - Math.floor(bodyH * 0.8)
    for (const side of [-1, 1]) {
      const hx = cx + side * hornSpread
      for (let i = 0; i < hornH; i++) {
        const width = Math.max(1, Math.floor((1 - i / hornH) * 3))
        for (let dx = -width; dx <= width; dx++) {
          const hy = hornBase - i
          if (Math.abs(dx) === width || i === 0)
            set(px, hy, hx + dx, c(outline), gs)
          else
            set(px, hy, hx + dx, c(accent), gs)
        }
      }
    }
    // Elder gets a crown/halo
    if (stage === 'elder') {
      const crownY = cy + bodyOffY - Math.floor(bodyH) - 2
      for (let x = cx - 4; x <= cx + 4; x++) {
        if ((x + crownY) % 2 === 0) set(px, crownY, x, c(accent), gs)
      }
      set(px, crownY - 1, cx, c(accent), gs)
      set(px, crownY - 1, cx - 3, c(accent), gs)
      set(px, crownY - 1, cx + 3, c(accent), gs)
    }
  }

  // ── EYES ─────────────────────────────────────────────
  const eyeR = Math.max(1, Math.floor(1.2 + traits.curiosity * (stage === 'hatchling' ? 1.5 : stage === 'elder' ? 2.5 : 2)))
  const eyeSpread = Math.floor(bodyW * 0.38)
  const eyeY = cy + bodyOffY - Math.floor(bodyH * 0.15)

  for (const side of [-1, 1]) {
    const ex = cx + side * eyeSpread
    // White of eye
    for (let dy = -eyeR; dy <= eyeR; dy++) {
      for (let dx = -eyeR; dx <= eyeR; dx++) {
        if (dx * dx + dy * dy <= eyeR * eyeR) {
          set(px, eyeY + dy, ex + dx, '#e8e8f0', gs)
        }
      }
    }
    // Pupil (smaller)
    const pupilR = Math.max(1, eyeR - 1)
    for (let dy = -pupilR; dy <= pupilR; dy++) {
      for (let dx = -pupilR; dx <= pupilR; dx++) {
        if (dx * dx + dy * dy <= pupilR * pupilR) {
          set(px, eyeY + dy, ex + dx, '#1a1a2e', gs)
        }
      }
    }
    // Shine
    set(px, eyeY - Math.floor(eyeR * 0.5), ex + Math.floor(eyeR * 0.3), '#ffffff', gs)
    if (eyeR >= 2) set(px, eyeY - Math.floor(eyeR * 0.5), ex + Math.floor(eyeR * 0.3) + 1, '#ffffff', gs)
  }

  // ── MOUTH ────────────────────────────────────────────
  const mouthY = cy + bodyOffY + Math.floor(bodyH * 0.25)
  if (traits.warmth > 0.6) {
    // Smile — wider when warmer
    const smileW = Math.floor(1 + traits.warmth * 2.5)
    for (let i = -smileW; i <= smileW; i++) {
      const yOff = Math.abs(i) >= smileW ? -1 : 0
      set(px, mouthY + yOff, cx + i, '#2a1a3e', gs)
    }
  } else if (traits.warmth < 0.35) {
    // Flat/frown
    const w = 2
    for (let i = -w; i <= w; i++) {
      const yOff = Math.abs(i) >= w ? 1 : 0
      set(px, mouthY + yOff, cx + i, '#2a1a3e', gs)
    }
  } else {
    // Neutral dot
    set(px, mouthY, cx, '#2a1a3e', gs)
    set(px, mouthY, cx + 1, '#2a1a3e', gs)
  }

  // ── CHEEK BLUSH ──────────────────────────────────────
  if (traits.warmth > 0.5 && stage !== 'hatchling') {
    const blushAlpha = (traits.warmth - 0.5) * 1.5
    const blushR = Math.floor(bodyW * 0.15)
    const blushY = eyeY + eyeR + 2
    for (const side of [-1, 1]) {
      const bx = cx + side * Math.floor(eyeSpread + eyeR + 1)
      for (let dy = -blushR; dy <= blushR; dy++) {
        for (let dx = -blushR; dx <= blushR; dx++) {
          if (dx * dx + dy * dy <= blushR * blushR) {
            const py = blushY + dy, ppx = bx + dx
            if (get(px, py, ppx, gs) && get(px, py, ppx, gs) !== c(outline))
              set(px, py, ppx, c({ r: 240, g: 100, b: 120 }, blushAlpha), gs)
          }
        }
      }
    }
  }

  // ── FEET ─────────────────────────────────────────────
  if (stage !== 'hatchling') {
    const footY = cy + bodyOffY + Math.floor(bodyH * 0.85)
    const footW = Math.floor(bodyW * 0.3)
    const footSpread = Math.floor(bodyW * 0.4)
    for (const side of [-1, 1]) {
      const fx = cx + side * footSpread
      for (let dx = -footW; dx <= footW; dx++) {
        set(px, footY, fx + dx, c(outline), gs)
        set(px, footY + 1, fx + dx, c(outline), gs)
        if (Math.abs(dx) < footW) {
          set(px, footY, fx + dx, c(body), gs)
        }
      }
    }
  }

  // ── TAIL ─────────────────────────────────────────────
  if (stage === 'juvenile' || stage === 'adult' || stage === 'elder') {
    const tailLen = Math.floor(2 + traits.energy * 3)
    const tailX = cx + Math.floor(bodyW * 0.9)
    const tailY = cy + bodyOffY + Math.floor(bodyH * 0.3)
    const tailCurve = traits.energy > 0.5 ? -1 : 1
    for (let i = 0; i < tailLen; i++) {
      const tx = tailX + i
      const ty = tailY + Math.floor(tailCurve * Math.sin(i * 0.8) * 2)
      set(px, ty, tx, c(outline), gs)
      set(px, ty - 1, tx, c(body), gs)
      if (i === tailLen - 1) set(px, ty, tx, c(accent), gs) // tip
    }
  }

  // ── COMPLEXITY MARKINGS ──────────────────────────────
  if (traits.complexity > 0.3 && stage !== 'hatchling') {
    // Stripes or spots based on complexity level
    const isStripes = traits.stability > 0.5
    if (isStripes) {
      // Horizontal stripes
      const count = Math.floor(1 + traits.complexity * 3)
      const spacing = Math.floor(bodyH * 2 / (count + 1))
      for (let i = 1; i <= count; i++) {
        const sy = cy + bodyOffY - Math.floor(bodyH) + i * spacing
        for (let x = 0; x < gs; x++) {
          if (get(px, sy, x, gs) === c(body) || get(px, sy, x, gs) === c(belly)) {
            set(px, sy, x, c(accent, 0.5), gs)
          }
        }
      }
    } else {
      // Spots
      const count = Math.floor(2 + traits.complexity * 5)
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + 0.7
        const r = bodyW * 0.5
        const sx = Math.floor(cx + Math.cos(angle) * r)
        const sy = Math.floor((cy + bodyOffY) + Math.sin(angle) * bodyH * 0.5)
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx * dx + dy * dy <= 1) {
              const val = get(px, sy + dy, sx + dx, gs)
              if (val && val !== c(outline) && val !== '#1a1a2e' && val !== '#ffffff' && val !== '#e8e8f0')
                set(px, sy + dy, sx + dx, c(accent, 0.6), gs)
            }
          }
        }
      }
    }
  }

  // ── INTENSITY GLOW ───────────────────────────────────
  if (traits.intensity > 0.4) {
    const ga = (traits.intensity - 0.4) * 1.2
    const glowColor = traits.warmth > 0.6
      ? { r: 255, g: 180, b: 80 }
      : traits.warmth < 0.35
        ? { r: 100, g: 160, b: 255 }
        : { r: 200, g: 160, b: 240 }
    // First ring
    for (let y = 0; y < gs; y++) {
      for (let x = 0; x < gs; x++) {
        if (!px[y][x]) {
          const adj = [[y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]]
          if (adj.some(([ny, nx]) => get(px, ny, nx, gs) && get(px, ny, nx, gs) !== c(glowColor, ga * 0.3)))
            set(px, y, x, c(glowColor, ga * 0.3), gs)
        }
      }
    }
    // Second ring for high intensity
    if (traits.intensity > 0.7) {
      const ring1 = px.map(r => [...r])
      for (let y = 0; y < gs; y++) {
        for (let x = 0; x < gs; x++) {
          if (!ring1[y][x]) {
            const adj = [[y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]]
            if (adj.some(([ny, nx]) => {
              const v = ny >= 0 && ny < gs && nx >= 0 && nx < gs ? ring1[ny][nx] : null
              return v === c(glowColor, ga * 0.3)
            }))
              set(px, y, x, c(glowColor, ga * 0.12), gs)
          }
        }
      }
    }
  }

  // ── ANIMATION: BOUNCE ────────────────────────────────
  if (traits.energy > 0.4 && frame % 4 < 2) {
    const shift = traits.energy > 0.7 ? 2 : 1
    const shifted: (string | null)[][] = Array.from({ length: gs }, () => Array(gs).fill(null))
    for (let y = shift; y < gs; y++) {
      for (let x = 0; x < gs; x++) {
        shifted[y - shift][x] = px[y][x]
      }
    }
    return { pixels: shifted, size: gs }
  }

  return { pixels: px, size: gs }
}
