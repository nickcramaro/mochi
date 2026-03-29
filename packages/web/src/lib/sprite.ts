/**
 * Procedural pixel art generator for Mochi creatures v3.
 * Traits drive fundamentally different body shapes, appendages, and faces.
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

// 12 palettes: warmth is primary axis, energy+intensity+stability are secondary selectors
// [body, outline, highlight, accent, belly]
const PALETTES: Record<string, Color[]> = {
  ice:      [{ r: 70, g: 140, b: 220 }, { r: 30, g: 70, b: 140 }, { r: 150, g: 200, b: 255 }, { r: 40, g: 200, b: 230 }, { r: 120, g: 175, b: 240 }],
  storm:    [{ r: 80, g: 70, b: 150 }, { r: 35, g: 30, b: 85 }, { r: 140, g: 130, b: 210 }, { r: 140, g: 60, b: 200 }, { r: 110, g: 100, b: 170 }],
  slate:    [{ r: 100, g: 120, b: 140 }, { r: 50, g: 60, b: 75 }, { r: 160, g: 175, b: 195 }, { r: 80, g: 160, b: 180 }, { r: 130, g: 145, b: 165 }],
  teal:     [{ r: 50, g: 160, b: 160 }, { r: 20, g: 90, b: 95 }, { r: 120, g: 220, b: 210 }, { r: 40, g: 200, b: 180 }, { r: 90, g: 185, b: 180 }],
  moss:     [{ r: 90, g: 170, b: 100 }, { r: 40, g: 100, b: 50 }, { r: 150, g: 220, b: 150 }, { r: 60, g: 200, b: 130 }, { r: 130, g: 195, b: 140 }],
  lavender: [{ r: 170, g: 140, b: 200 }, { r: 105, g: 80, b: 140 }, { r: 215, g: 190, b: 240 }, { r: 200, g: 110, b: 210 }, { r: 195, g: 170, b: 220 }],
  rose:     [{ r: 200, g: 120, b: 140 }, { r: 130, g: 60, b: 80 }, { r: 240, g: 180, b: 195 }, { r: 220, g: 80, b: 120 }, { r: 220, g: 160, b: 175 }],
  peach:    [{ r: 230, g: 160, b: 120 }, { r: 160, g: 90, b: 60 }, { r: 255, g: 210, b: 180 }, { r: 220, g: 120, b: 90 }, { r: 240, g: 190, b: 160 }],
  sunset:   [{ r: 230, g: 130, b: 70 }, { r: 170, g: 75, b: 30 }, { r: 255, g: 195, b: 120 }, { r: 240, g: 85, b: 80 }, { r: 245, g: 175, b: 120 }],
  fire:     [{ r: 220, g: 75, b: 45 }, { r: 140, g: 35, b: 20 }, { r: 255, g: 155, b: 75 }, { r: 255, g: 200, b: 40 }, { r: 230, g: 125, b: 75 }],
  solar:    [{ r: 240, g: 190, b: 60 }, { r: 180, g: 120, b: 20 }, { r: 255, g: 230, b: 130 }, { r: 255, g: 140, b: 60 }, { r: 250, g: 210, b: 100 }],
  crimson:  [{ r: 180, g: 50, b: 60 }, { r: 100, g: 25, b: 30 }, { r: 230, g: 110, b: 110 }, { r: 255, g: 80, b: 50 }, { r: 200, g: 90, b: 90 }],
}

function getPalette(warmth: number, intensity: number, energy: number, stability: number): Color[] {
  // Cold range (warmth 0-0.25): ice, storm, slate based on intensity+stability
  if (warmth < 0.25) {
    if (intensity > 0.6) return PALETTES.storm
    if (stability > 0.6) return PALETTES.slate
    return PALETTES.ice
  }
  // Cool range (0.25-0.45): teal, moss based on energy
  if (warmth < 0.45) {
    return energy > 0.5 ? PALETTES.moss : PALETTES.teal
  }
  // Neutral range (0.45-0.6): lavender, rose based on intensity
  if (warmth < 0.6) {
    return intensity > 0.4 ? PALETTES.rose : PALETTES.lavender
  }
  // Warm range (0.6-0.8): peach, sunset based on energy
  if (warmth < 0.8) {
    return energy > 0.6 ? PALETTES.sunset : PALETTES.peach
  }
  // Hot range (0.8+): solar, fire, crimson based on intensity+energy
  if (intensity > 0.6) return PALETTES.crimson
  if (energy > 0.6) return PALETTES.fire
  return PALETTES.solar
}

function c(col: Color, a = 1): string {
  return a >= 1 ? `rgb(${col.r},${col.g},${col.b})` : `rgba(${col.r},${col.g},${col.b},${a})`
}

function set(px: (string | null)[][], y: number, x: number, color: string, gs: number) {
  if (y >= 0 && y < gs && x >= 0 && x < gs) px[y][x] = color
}

function get(px: (string | null)[][], y: number, x: number, gs: number): string | null {
  return (y >= 0 && y < gs && x >= 0 && x < gs) ? px[y][x] : null
}

function fillCircle(px: (string | null)[][], cy: number, cx: number, r: number, color: string, gs: number) {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++)
      if (dx * dx + dy * dy <= r * r) set(px, cy + dy, cx + dx, color, gs)
}

function fillEllipse(px: (string | null)[][], cy: number, cx: number, rx: number, ry: number, color: string, gs: number) {
  for (let y = -ry; y <= ry; y++)
    for (let x = -rx; x <= rx; x++)
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) set(px, cy + y, cx + x, color, gs)
}

const SIZES: Record<Stage, number> = { egg: 16, hatchling: 22, juvenile: 30, adult: 38, elder: 46 }

export function generateSprite(traits: Traits, stage: Stage, frame = 0): {
  pixels: (string | null)[][]
  size: number
} {
  const gs = SIZES[stage]
  const pal = getPalette(traits.warmth, traits.intensity, traits.energy, traits.stability)
  const [body, outline, highlight, accent, belly] = pal
  const px: (string | null)[][] = Array.from({ length: gs }, () => Array(gs).fill(null))
  const cx = Math.floor(gs / 2)
  const cy = Math.floor(gs / 2)

  // ── EGG ──────────────────────────────────────────────
  if (stage === 'egg') {
    const rx = Math.floor(gs * 0.25), ry = Math.floor(gs * 0.35)
    const wobble = Math.sin(frame * 0.4) * 0.7
    fillEllipse(px, cy + 1, cx + Math.round(wobble), rx, ry, c(body), gs)
    fillEllipse(px, cy + 1, cx + Math.round(wobble), rx - 1, ry - 1, c(body), gs)
    // Outline
    for (let y = 0; y < gs; y++) for (let x = 0; x < gs; x++) {
      if (px[y][x] && [[y-1,x],[y+1,x],[y,x-1],[y,x+1]].some(([ny,nx]) => !get(px, ny, nx, gs)))
        set(px, y, x, c(outline), gs)
    }
    // Top highlight
    fillEllipse(px, cy - Math.floor(ry * 0.3), cx + Math.round(wobble), Math.floor(rx * 0.5), Math.floor(ry * 0.3), c(highlight), gs)
    // Crack
    const crackY = cy + 1
    for (let i = -2; i <= 2; i++) set(px, crackY, cx + i + Math.round(wobble), c(outline), gs)
    set(px, crackY - 1, cx + 1 + Math.round(wobble), c(outline), gs)
    set(px, crackY + 1, cx - 1 + Math.round(wobble), c(outline), gs)
    return { pixels: px, size: gs }
  }

  // ── BODY MORPHOLOGY ──────────────────────────────────
  // Energy: tall/thin (high) vs squat/wide (low) — now much more dramatic
  // Stability: smooth (high) vs jagged/blobby (low)
  // Curiosity also affects head-to-body ratio (curious = bigger head area)
  const heightRatio = 0.65 + traits.energy * 0.7   // 0.65-1.35 (much wider range)
  const widthRatio = 1.45 - traits.energy * 0.6    // 0.85-1.45
  const stageScale = { hatchling: 0.7, juvenile: 0.82, adult: 0.92, elder: 1.0 }[stage] || 0.85
  const baseSize = gs * 0.28 * stageScale + traits.size * gs * 0.04

  const bw = Math.floor(baseSize * widthRatio)
  const bh = Math.floor(baseSize * heightRatio)
  const bodyTop = cy - bh
  const bodyBot = cy + Math.floor(bh * 0.7)

  // Draw body with stability-driven edge noise
  for (let y = 0; y < gs; y++) {
    for (let x = 0; x < gs; x++) {
      const dx = (x - cx) / bw
      const dy = (y - cy) / bh
      let d = dx * dx + dy * dy
      // Low stability = wobbly edges
      if (traits.stability < 0.5) {
        const wobbleAmt = (0.5 - traits.stability) * 0.4
        d += Math.sin(x * 3.1 + y * 2.7 + traits.complexity * 7) * wobbleAmt
        d += Math.cos(x * 1.9 - y * 3.3) * wobbleAmt * 0.5
      }
      if (d < 1) set(px, y, x, c(body), gs)
    }
  }

  // Outline the body
  for (let y = 0; y < gs; y++) for (let x = 0; x < gs; x++) {
    if (px[y][x] === c(body)) {
      const neighbors = [[y-1,x],[y+1,x],[y,x-1],[y,x+1]]
      if (neighbors.some(([ny, nx]) => !get(px, ny, nx, gs)))
        set(px, y, x, c(outline), gs)
    }
  }

  // Highlight top area
  for (let y = 0; y < gs; y++) for (let x = 0; x < gs; x++) {
    if (px[y][x] === c(body) && y < cy - bh * 0.3 && Math.abs(x - cx) < bw * 0.5)
      set(px, y, x, c(highlight), gs)
  }

  // ── BELLY ────────────────────────────────────────────
  const bellyW = Math.floor(bw * 0.6)
  const bellyH = Math.floor(bh * 0.5)
  const bellyY = cy + Math.floor(bh * 0.15)
  for (let y = 0; y < gs; y++) for (let x = 0; x < gs; x++) {
    const dx = (x - cx) / bellyW, dy = (y - bellyY) / bellyH
    if (dx * dx + dy * dy < 1 && px[y][x] === c(body))
      set(px, y, x, c(belly), gs)
  }

  // ── APPENDAGE TYPE ───────────────────────────────────
  // Driven by complexity + energy: determines what grows on the creature
  // Low complexity = simple (ears/nubs). High complexity = elaborate (wings/tentacles/antennae)
  // Energy controls size of appendages

  // 7 appendage types from complexity + stability + energy
  let appendageType: string
  if (traits.complexity < 0.25) {
    appendageType = 'nubs'
  } else if (traits.complexity < 0.45) {
    appendageType = traits.energy > 0.5 ? 'ears' : 'crest'  // ears vs single crest
  } else if (traits.complexity < 0.65) {
    appendageType = traits.stability > 0.5 ? 'horns' : 'spines'  // curved horns vs spiky ridge
  } else {
    if (traits.stability > 0.6) appendageType = 'wings'
    else if (traits.stability > 0.3) appendageType = 'antlers'  // branching antlers
    else appendageType = 'tentacles'
  }

  const appSize = Math.floor(2 + traits.energy * (stage === 'elder' ? 7 : stage === 'adult' ? 5 : 3))

  if (appendageType === 'nubs') {
    // Simple round bumps on top
    for (const side of [-1, 1]) {
      fillCircle(px, bodyTop + 2, cx + side * Math.floor(bw * 0.5), Math.min(appSize, 3), c(body), gs)
      fillCircle(px, bodyTop + 2, cx + side * Math.floor(bw * 0.5), Math.min(appSize - 1, 2), c(highlight), gs)
    }
  } else if (appendageType === 'ears') {
    // Pointed cat-like ears
    for (const side of [-1, 1]) {
      const earX = cx + side * Math.floor(bw * 0.55)
      const earBase = bodyTop + 1
      for (let i = 0; i < appSize; i++) {
        const w = Math.max(1, Math.floor((1 - i / appSize) * appSize * 0.6))
        for (let dx = -w; dx <= w; dx++) {
          if (Math.abs(dx) === w) set(px, earBase - i, earX + dx, c(outline), gs)
          else set(px, earBase - i, earX + dx, c(accent), gs)
        }
      }
    }
  } else if (appendageType === 'crest') {
    // Single fin/crest running down center top — like a mohawk
    const crestH = appSize + 2
    for (let i = 0; i < crestH; i++) {
      const w = Math.max(1, Math.floor(1.5 + Math.sin(i * 0.8) * 1.5))
      for (let dx = -w; dx <= w; dx++) {
        if (Math.abs(dx) === w) set(px, bodyTop - i, cx + dx, c(outline), gs)
        else set(px, bodyTop - i, cx + dx, c(accent), gs)
      }
    }
    set(px, bodyTop - crestH, cx, c(highlight), gs) // tip
  } else if (appendageType === 'horns') {
    // Curved horns
    for (const side of [-1, 1]) {
      const hx = cx + side * Math.floor(bw * 0.45)
      for (let i = 0; i < appSize; i++) {
        const curve = Math.floor(side * (i * i) / (appSize * 1.5))
        const w = Math.max(1, Math.floor((1 - i / appSize) * 3))
        for (let dx = -w; dx <= w; dx++) {
          if (Math.abs(dx) === w) set(px, bodyTop - i, hx + curve + dx, c(outline), gs)
          else set(px, bodyTop - i, hx + curve + dx, c(accent), gs)
        }
      }
      set(px, bodyTop - appSize, hx + Math.floor(side * appSize / 2), c(highlight), gs)
    }
  } else if (appendageType === 'spines') {
    // Spiky ridge — multiple short sharp spikes across the top
    const spineCount = Math.floor(3 + traits.complexity * 3)
    const spread = bw * 0.8
    for (let s = 0; s < spineCount; s++) {
      const sx = cx + Math.floor(-spread / 2 + (s / (spineCount - 1)) * spread)
      const sHeight = Math.floor(2 + (1 - Math.abs(s - spineCount / 2) / (spineCount / 2)) * appSize * 0.7)
      for (let i = 0; i < sHeight; i++) {
        set(px, bodyTop - i, sx, c(accent), gs)
        if (i === 0) { set(px, bodyTop, sx - 1, c(outline), gs); set(px, bodyTop, sx + 1, c(outline), gs) }
      }
      set(px, bodyTop - sHeight, sx, c(highlight), gs)
    }
  } else if (appendageType === 'antlers') {
    // Branching antler trees on both sides
    for (const side of [-1, 1]) {
      const ax = cx + side * Math.floor(bw * 0.4)
      // Main trunk
      for (let i = 0; i < appSize; i++) {
        set(px, bodyTop - i, ax, c(accent), gs)
        // Branches at intervals
        if (i > 1 && i % 3 === 0 && i < appSize - 1) {
          const branchLen = Math.floor(2 + (i / appSize) * 3)
          for (let b = 1; b <= branchLen; b++) {
            set(px, bodyTop - i - b, ax + side * b, c(accent), gs)
          }
          set(px, bodyTop - i - branchLen, ax + side * branchLen, c(highlight), gs)
        }
      }
      set(px, bodyTop - appSize, ax, c(highlight), gs)
    }
  } else if (appendageType === 'wings') {
    // Spread wings on sides
    for (const side of [-1, 1]) {
      const wingX = cx + side * Math.floor(bw * 0.9)
      const wingY = cy - Math.floor(bh * 0.3)
      for (let i = 0; i < appSize; i++) {
        const wingW = Math.floor(appSize * 0.8 * (1 - (i * i) / (appSize * appSize)))
        for (let j = 0; j <= wingW; j++) {
          const wx = wingX + side * j
          const wy = wingY - i
          if (j === wingW || i === 0 || i === appSize - 1)
            set(px, wy, wx, c(outline), gs)
          else
            set(px, wy, wx, c(accent, 0.7), gs)
        }
        // Wing membrane lines
        if (i > 0 && i < appSize - 1 && i % 2 === 0) {
          for (let j = 1; j < wingW; j++)
            set(px, wingY - i, wingX + side * j, c(outline, 0.4), gs)
        }
      }
    }
  } else if (appendageType === 'tentacles') {
    // Wavy tentacles on top and sides
    const tentCount = Math.floor(2 + traits.complexity * 3)
    for (let t = 0; t < tentCount; t++) {
      const angle = -Math.PI * 0.8 + (t / (tentCount - 1)) * Math.PI * 1.6
      for (let i = 0; i < appSize; i++) {
        const wave = Math.sin(i * 1.2 + t + frame * 0.3) * 2
        const tx = cx + Math.floor(Math.cos(angle) * (bw * 0.8 + i * 1.2)) + Math.round(wave)
        const ty = cy + Math.floor(Math.sin(angle) * (bh * 0.8 + i * 1.2))
        const thick = Math.max(1, Math.floor((1 - i / appSize) * 2.5))
        for (let dx = -thick; dx <= thick; dx++)
          set(px, ty, tx + dx, i === appSize - 1 ? c(accent) : c(body), gs)
      }
    }
  }

  // Elder bonus: extra center crest/horn
  if (stage === 'elder') {
    const crestH = Math.floor(3 + traits.energy * 4)
    for (let i = 0; i < crestH; i++) {
      const w = Math.max(1, Math.floor((1 - i / crestH) * 2.5))
      for (let dx = -w; dx <= w; dx++) {
        if (Math.abs(dx) === w) set(px, bodyTop - i - 1, cx + dx, c(outline), gs)
        else set(px, bodyTop - i - 1, cx + dx, c(accent), gs)
      }
    }
    // Gem at base of crest
    fillCircle(px, bodyTop, cx, 2, c(accent), gs)
    set(px, bodyTop - 1, cx, c(highlight), gs)
  }

  // ── FACE TYPE ────────────────────────────────────────
  // Curiosity: eye count (1/2/3) and size
  // Energy: eye shape (round vs narrow/tall vs wide/flat)
  // Stability: eye symmetry

  const eyeY = cy - Math.floor(bh * 0.15)
  const eyeCount = traits.curiosity > 0.85 ? 3 : traits.curiosity < 0.2 ? 1 : 2
  const eyeR = Math.max(1, Math.floor(1.5 + traits.curiosity * (stage === 'elder' ? 2.5 : 2)))

  // Eye shape: energy makes eyes tall/narrow, low energy makes them wide/sleepy
  const eyeRX = Math.max(1, Math.floor(eyeR * (1.3 - traits.energy * 0.6)))  // wide when low energy
  const eyeRY = Math.max(1, Math.floor(eyeR * (0.7 + traits.energy * 0.6)))  // tall when high energy

  function drawEye(ey: number, ex: number, isThird = false) {
    const erx = isThird ? Math.max(1, eyeRX - 1) : eyeRX
    const ery = isThird ? Math.max(1, eyeRY - 1) : eyeRY
    // Sclera
    fillEllipse(px, ey, ex, erx, ery, '#e8e8f0', gs)
    // Pupil — intensity makes pupils smaller (alert), low intensity bigger (relaxed)
    const pupilScale = 0.5 + (1 - traits.intensity) * 0.3
    const prx = Math.max(1, Math.floor(erx * pupilScale))
    const pry = Math.max(1, Math.floor(ery * pupilScale))
    fillEllipse(px, ey, ex, prx, pry, isThird ? c(accent) : '#1a1a2e', gs)
    // Shine
    set(px, ey - Math.floor(ery * 0.4), ex + Math.floor(erx * 0.3), '#ffffff', gs)
    if (erx >= 2) set(px, ey - Math.floor(ery * 0.4), ex + Math.floor(erx * 0.3) + 1, '#ffffff', gs)
  }

  if (eyeCount === 1) {
    drawEye(eyeY, cx)
  } else if (eyeCount === 3) {
    const spread = Math.floor(bw * 0.35)
    drawEye(eyeY, cx - spread)
    drawEye(eyeY, cx + spread)
    drawEye(eyeY - Math.floor(bh * 0.3), cx, true)
  } else {
    const spread = Math.floor(bw * 0.35)
    drawEye(eyeY, cx - spread)
    drawEye(eyeY, cx + spread)
  }

  // Mouth
  const mouthY = cy + Math.floor(bh * 0.25)
  if (traits.warmth > 0.65) {
    // Big smile
    const w = Math.floor(1 + (traits.warmth - 0.5) * 5)
    for (let i = -w; i <= w; i++) {
      const yOff = Math.abs(i) >= w ? -1 : Math.abs(i) >= w - 1 ? 0 : 1
      set(px, mouthY + yOff, cx + i, '#2a1a3e', gs)
    }
  } else if (traits.warmth < 0.3) {
    // Frown with fangs for low warmth
    const w = Math.floor(1 + (0.5 - traits.warmth) * 3)
    for (let i = -w; i <= w; i++) {
      const yOff = Math.abs(i) >= w ? 1 : 0
      set(px, mouthY + yOff, cx + i, '#2a1a3e', gs)
    }
    // Fangs
    if (traits.warmth < 0.15) {
      set(px, mouthY + 1, cx - Math.floor(w * 0.5), '#e8e8f0', gs)
      set(px, mouthY + 2, cx - Math.floor(w * 0.5), '#e8e8f0', gs)
      set(px, mouthY + 1, cx + Math.floor(w * 0.5), '#e8e8f0', gs)
      set(px, mouthY + 2, cx + Math.floor(w * 0.5), '#e8e8f0', gs)
    }
  } else {
    set(px, mouthY, cx, '#2a1a3e', gs)
    set(px, mouthY, cx + 1, '#2a1a3e', gs)
  }

  // Cheek blush (warm creatures)
  if (traits.warmth > 0.55 && stage !== 'hatchling') {
    const blushR = Math.max(1, Math.floor(bw * 0.12))
    const blushY = eyeY + eyeR + 2
    const blushSpread = Math.floor(bw * 0.55)
    for (const side of [-1, 1])
      fillCircle(px, blushY, cx + side * blushSpread, blushR, c({ r: 240, g: 100, b: 120 }, (traits.warmth - 0.5) * 1.2), gs)
  }

  // ── LEGS / FEET ──────────────────────────────────────
  if (stage !== 'hatchling') {
    const legCount = traits.complexity > 0.7 && stage !== 'juvenile' ? 4 : 2
    const footY = bodyBot + 1
    const legSpacing = legCount === 4 ? bw * 0.7 / 3 : bw * 0.4
    for (let l = 0; l < legCount; l++) {
      const lx = legCount === 2
        ? cx + (l === 0 ? -1 : 1) * Math.floor(legSpacing)
        : cx + Math.floor(-bw * 0.35 + l * legSpacing)
      // Leg
      const legH = Math.floor(1 + traits.energy * 2)
      for (let i = 0; i < legH; i++) set(px, footY + i, lx, c(outline), gs)
      // Foot
      set(px, footY + legH, lx, c(outline), gs)
      set(px, footY + legH, lx + 1, c(outline), gs)
      set(px, footY + legH, lx - 1, c(outline), gs)
    }
  }

  // ── TAIL ─────────────────────────────────────────────
  if (stage !== 'hatchling') {
    const tailLen = Math.floor(2 + traits.energy * (stage === 'elder' ? 7 : 4))
    const tailX = cx + Math.floor(bw * 0.85)
    const tailY = cy + Math.floor(bh * 0.2)
    for (let i = 0; i < tailLen; i++) {
      const wave = Math.sin(i * 0.7 + frame * 0.2) * (1 + traits.energy)
      const tx = tailX + i
      const ty = tailY + Math.round(wave)
      const thick = stage === 'elder' ? 2 : 1
      for (let t = 0; t < thick; t++) set(px, ty + t, tx, c(body), gs)
      if (i === tailLen - 1) {
        // Tail tip
        fillCircle(px, ty, tx, stage === 'elder' ? 2 : 1, c(accent), gs)
      }
    }
  }

  // ── BODY PATTERNS ────────────────────────────────────
  if (traits.complexity > 0.25 && stage !== 'hatchling') {
    if (traits.stability > 0.6) {
      // Stripes
      const count = Math.floor(1 + traits.complexity * 4)
      const spacing = Math.max(2, Math.floor(bh * 2 / (count + 1)))
      for (let i = 1; i <= count; i++) {
        const sy = bodyTop + i * spacing
        for (let x = 0; x < gs; x++) {
          const val = get(px, sy, x, gs)
          if (val === c(body) || val === c(belly)) set(px, sy, x, c(accent, 0.45), gs)
        }
      }
    } else if (traits.stability > 0.3) {
      // Spots
      const count = Math.floor(3 + traits.complexity * 6)
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + traits.warmth * 2
        const r = bw * 0.45
        const sx = Math.floor(cx + Math.cos(a) * r)
        const sy = Math.floor(cy + Math.sin(a) * bh * 0.45)
        const dotR = Math.floor(1 + traits.complexity)
        for (let dy = -dotR; dy <= dotR; dy++) for (let dx = -dotR; dx <= dotR; dx++) {
          if (dx * dx + dy * dy <= dotR * dotR) {
            const val = get(px, sy + dy, sx + dx, gs)
            if (val && val !== c(outline) && !val.startsWith('#')) // not eyes
              set(px, sy + dy, sx + dx, c(accent, 0.5), gs)
          }
        }
      }
    } else {
      // Chaotic splotches for very unstable
      const count = Math.floor(2 + traits.complexity * 4)
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + 1.3
        const sx = Math.floor(cx + Math.cos(a) * bw * 0.4)
        const sy = Math.floor(cy + Math.sin(a) * bh * 0.4)
        fillCircle(px, sy, sx, Math.floor(1 + traits.complexity * 2), c(accent, 0.6), gs)
      }
    }
  }

  // ── INTENSITY GLOW ───────────────────────────────────
  if (traits.intensity > 0.4) {
    const ga = (traits.intensity - 0.4) * 1.3
    const gc = traits.warmth > 0.6 ? { r: 255, g: 170, b: 60 } : traits.warmth < 0.3 ? { r: 80, g: 150, b: 255 } : { r: 190, g: 140, b: 240 }
    for (let ring = 0; ring < (traits.intensity > 0.7 ? 2 : 1); ring++) {
      const snapshot = px.map(r => [...r])
      for (let y = 0; y < gs; y++) for (let x = 0; x < gs; x++) {
        if (!snapshot[y][x]) {
          if ([[y-1,x],[y+1,x],[y,x-1],[y,x+1]].some(([ny, nx]) => {
            const v = (ny >= 0 && ny < gs && nx >= 0 && nx < gs) ? snapshot[ny][nx] : null
            return v && v !== c(gc, ga * (ring === 0 ? 0.3 : 0.1))
          }))
            set(px, y, x, c(gc, ga * (ring === 0 ? 0.3 : 0.1)), gs)
        }
      }
    }
  }

  // ── ANIMATION ────────────────────────────────────────
  if (traits.energy > 0.4 && frame % 4 < 2) {
    const shift = traits.energy > 0.7 ? 2 : 1
    const shifted: (string | null)[][] = Array.from({ length: gs }, () => Array(gs).fill(null))
    for (let y = shift; y < gs; y++) for (let x = 0; x < gs; x++) shifted[y - shift][x] = px[y][x]
    return { pixels: shifted, size: gs }
  }

  return { pixels: px, size: gs }
}
