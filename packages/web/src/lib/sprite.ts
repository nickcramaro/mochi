/**
 * Procedural pixel art generator for Mochi creatures v6.
 * Hand-drawn 16x16 base templates + procedural recoloring and feature swaps.
 *
 * Palette indices in templates:
 *   0 = transparent, 1 = outline, 2 = body, 3 = highlight, 4 = accent, 5 = belly
 *   6 = eye white, 7 = pupil, 8 = eye shine, 9 = mouth
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

function getPal(w: number, i: number, e: number, s: number): Color[] {
  if (w < 0.25) return i > 0.6 ? PALETTES.storm : s > 0.6 ? PALETTES.slate : PALETTES.ice
  if (w < 0.45) return e > 0.5 ? PALETTES.moss : PALETTES.teal
  if (w < 0.6) return i > 0.4 ? PALETTES.rose : PALETTES.lavender
  if (w < 0.8) return e > 0.6 ? PALETTES.sunset : PALETTES.peach
  return i > 0.6 ? PALETTES.crimson : e > 0.6 ? PALETTES.fire : PALETTES.solar
}

function cc(col: Color, a = 1): string {
  return a >= 1 ? `rgb(${col.r},${col.g},${col.b})` : `rgba(${col.r},${col.g},${col.b},${a})`
}

// ── BASE TEMPLATES (16x16, palette-indexed) ────────────
// 0=transparent 1=outline 2=body 3=highlight 4=accent 5=belly
// 6=eye white 7=pupil 8=shine 9=mouth

// p() parses compact row strings: each char is a palette index, '.' = 0
function p(s: string): number[] { return s.split('').map(c => c === '.' ? 0 : parseInt(c)) }

const TEMPLATES: Record<string, number[][]> = {
  // Jellyfish — dome top with dangling tentacles
  jellyfish: [
    p('....11111111....'),
    p('..113333333311..'),
    p('.12333333333321.'),
    p('1233333333333221'),
    p('1222266266222221'),
    p('1222277277222221'),
    p('1222282282222221'),
    p('.12222992222221.'),
    p('..112222222211..'),
    p('..1.12.12.12.1..'),
    p('.1..12.12.12..1.'),
    p('.1..12.12.12..1.'),
    p('....12..2.12....'),
    p('....1...2..1....'),
    p('....1......1....'),
    p('................'),
  ],
  // Fox — tall narrow, standing upright, big bushy tail
  fox: [
    p('..14......41....'),
    p('..141....141....'),
    p('..12211112211...'),
    p('..12266266221...'),
    p('..12277277221...'),
    p('..12282282221...'),
    p('...1229922.1....'),
    p('...12555521.....'),
    p('...122222211111.'),
    p('...122222233331.'),
    p('...12222223333.1'),
    p('...1222221.3331.'),
    p('...121.121..11..'),
    p('...11...11......'),
    p('................'),
    p('................'),
  ],
  // Ghost — floaty, no legs, wavy bottom
  ghost: [
    p('....11111111....'),
    p('...1333333331...'),
    p('..133333333331..'),
    p('.1233333333332..'),
    p('.1226623662221..'),
    p('.1227723772221..'),
    p('.1228223822221..'),
    p('12222222222222221'),
    p('12255229922552221'),
    p('12255555555552221'),
    p('12225555555522221'),
    p('.122222222222221.'),
    p('.122222222222221.'),
    p('.1.12221.12221.1'),
    p('1..1221...1221..1'),
    p('....11.....11...'),
  ],
  // Bat — wide wingspan, tiny body center
  bat: [
    p('................'),
    p('44.............44'),
    p('414...1111...414'),
    p('4214.133321.4124'),
    p('42214166621.4124'),
    p('.22141776214124.'),
    p('.221418821.4124.'),
    p('..2219921..412..'),
    p('..2255521..42...'),
    p('...12221..42....'),
    p('....1221.42.....'),
    p('....1111.4......'),
    p('................'),
    p('................'),
    p('................'),
    p('................'),
  ],
  // Slime — amorphous, blobby, sits on ground
  slime: [
    p('................'),
    p('................'),
    p('....111111......'),
    p('...1333333311...'),
    p('..133333333331..'),
    p('.1233366366321..'),
    p('.1233377377321..'),
    p('12233282283221..'),
    p('12255222222521..'),
    p('12555529925521..'),
    p('12555555555521..'),
    p('12555555555521..'),
    p('125555555555521.'),
    p('1222222222222221'),
    p('1111111111111111'),
    p('................'),
  ],
  // Cyclops — one huge eye dominates, small round body
  cyclops: [
    p('................'),
    p('....111111......'),
    p('...1666666611...'),
    p('..166666666661..'),
    p('.1666677776661..'),
    p('.1666677776661..'),
    p('.1666688776661..'),
    p('..166666666661..'),
    p('...1666666611...'),
    p('...112222211....'),
    p('...125555521....'),
    p('...129922221....'),
    p('...122222221....'),
    p('...12.1..121....'),
    p('....1.1..1.1....'),
    p('................'),
  ],
  // Turtle — big shell dome, tiny head poking out
  turtle: [
    p('................'),
    p('................'),
    p('11..44444444....'),
    p('1214444444441...'),
    p('1271444244441...'),
    p('.181442442441...'),
    p('.19.444444441...'),
    p('....44444444....'),
    p('...1111111111...'),
    p('..155555555551..'),
    p('..122222222221..'),
    p('..122222222221..'),
    p('..111111111111..'),
    p('..12..1..1..21..'),
    p('..11..1..1..11..'),
    p('................'),
  ],
  // Crab — wide, pincers, legs
  crab: [
    p('41..........14..'),
    p('441........144..'),
    p('.441......144...'),
    p('..4411111144....'),
    p('..12333333321...'),
    p('.1233366366321..'),
    p('.1233377377321..'),
    p('.1233282283321..'),
    p('.1225222222521..'),
    p('12255229922552.1'),
    p('12555555555552.1'),
    p('.1222222222221..'),
    p('.121.1221.121...'),
    p('.11..1111..11...'),
    p('................'),
    p('................'),
  ],
  // Mushroom — cap on top, small body
  mushroom: [
    p('...44444444.....'),
    p('..4444444444....'),
    p('.44244244244....'),
    p('.44444444444....'),
    p('.44444444444....'),
    p('..44444444......'),
    p('...11111111.....'),
    p('...12233321.....'),
    p('...12266221.....'),
    p('...12277221.....'),
    p('...12282221.....'),
    p('...15299521.....'),
    p('...15555521.....'),
    p('...12222221.....'),
    p('..1111..1111....'),
    p('................'),
  ],
  // Serpent — long horizontal snakey body
  serpent: [
    p('................'),
    p('................'),
    p('................'),
    p('..11111.........'),
    p('.13332211.......'),
    p('1336732211......'),
    p('1337732222111...'),
    p('1382222255521...'),
    p('.19225555221111.'),
    p('.122222221133321'),
    p('..1111111..12221'),
    p('...........12221'),
    p('............1221'),
    p('.............111'),
    p('................'),
    p('................'),
  ],
}

type TemplateKey = keyof typeof TEMPLATES

function pickTemplate(t: Traits): TemplateKey {
  const { energy: e, stability: s, complexity: c, curiosity: cu, warmth: w, intensity: i } = t

  // Each template has a distinct trait signature — ordered by specificity
  if (c > 0.7 && s < 0.3) return 'serpent'     // complex + chaotic = snake
  if (cu > 0.75 && c < 0.4) return 'cyclops'    // very curious but simple = one big eye
  if (e > 0.65 && i > 0.5) return 'bat'         // energetic + intense = bat
  if (w < 0.25 && c > 0.5) return 'crab'        // cold + complex = crab
  if (e < 0.3 && s < 0.4) return 'slime'        // low energy + unstable = slime
  if (s > 0.7 && e < 0.4) return 'turtle'       // very stable + low energy = turtle
  if (w < 0.35 && e < 0.55) return 'ghost'      // cold + calm = ghost
  if (w > 0.55 && e > 0.5 && s > 0.4) return 'fox'  // warm + energetic + stable = fox
  if (c > 0.5 && e < 0.5) return 'mushroom'     // complex + sedentary = mushroom
  if (e < 0.4 && cu > 0.5) return 'jellyfish'   // calm + curious = jellyfish
  return 'jellyfish' // default fallback
}

export function generateSprite(traits: Traits, stage: Stage, frame = 0): {
  pixels: (string | null)[][]
  size: number
} {
  const gs = 16
  const pal = getPal(traits.warmth, traits.intensity, traits.energy, traits.stability)
  const [bodyC, outlineC, highlightC, accentC, bellyC] = pal

  const colorMap: Record<number, string> = {
    0: '',  // transparent
    1: cc(outlineC),
    2: cc(bodyC),
    3: cc(highlightC),
    4: cc(accentC),
    5: cc(bellyC),
    6: '#e8e8f0',
    7: '#1a1a2e',
    8: '#ffffff',
    9: '#2a1a3e',
  }

  // Egg is always the same shape
  if (stage === 'egg') {
    const egg: number[][] = [
      p('................'),
      p('................'),
      p('................'),
      p('.....11111......'),
      p('....13333311....'),
      p('...1333333321...'),
      p('...1222222221...'),
      p('...1222222221...'),
      p('...1255555521...'),
      p('...1255555521...'),
      p('...1222222221...'),
      p('....12222221....'),
      p('.....111111.....'),
      p('................'),
      p('................'),
      p('................'),
    ]
    // Wobble on even frames
    const shift = frame % 4 < 2 ? 0 : 1
    const px: (string | null)[][] = Array.from({ length: gs }, () => Array(gs).fill(null))
    for (let y = 0; y < gs; y++)
      for (let x = 0; x < gs; x++) {
        const idx = egg[y]?.[x] || 0
        if (idx > 0) px[y][Math.min(gs - 1, Math.max(0, x + shift))] = colorMap[idx]
      }
    return { pixels: px, size: gs }
  }

  // Pick template
  const templateKey = stage === 'hatchling' ? 'jellyfish' : pickTemplate(traits)
  const template = TEMPLATES[templateKey]

  // Render template to pixel grid with palette
  const px: (string | null)[][] = Array.from({ length: gs }, () => Array(gs).fill(null))
  for (let y = 0; y < gs; y++)
    for (let x = 0; x < gs; x++) {
      const idx = template[y]?.[x] || 0
      if (idx > 0) px[y][x] = colorMap[idx]
    }

  // ── PROCEDURAL MODIFICATIONS ─────────────────────────

  // Intensity glow
  if (traits.intensity > 0.4 && stage !== 'hatchling') {
    const ga = (traits.intensity - 0.4) * 1.3
    const gc = traits.warmth > 0.6 ? { r: 255, g: 170, b: 60 } : traits.warmth < 0.3 ? { r: 80, g: 150, b: 255 } : { r: 190, g: 140, b: 240 }
    const snap = px.map(r => [...r])
    for (let y = 0; y < gs; y++) for (let x = 0; x < gs; x++) {
      if (!snap[y][x]) {
        if ([[y-1,x],[y+1,x],[y,x-1],[y,x+1]].some(([ny, nx]) =>
          ny >= 0 && ny < gs && nx >= 0 && nx < gs && snap[ny][nx] && snap[ny][nx] !== cc(gc, ga * 0.35)
        ))
          px[y][x] = cc(gc, ga * 0.35)
      }
    }
  }

  // Complexity patterns — add accent dots on body pixels
  if (traits.complexity > 0.4 && stage !== 'hatchling') {
    const patternDensity = traits.complexity * 0.15
    for (let y = 0; y < gs; y++) for (let x = 0; x < gs; x++) {
      if (px[y][x] === cc(bodyC) || px[y][x] === cc(bellyC)) {
        const hash = Math.sin(x * 12.9898 + y * 78.233 + traits.stability * 43.1) * 43758.5453
        if ((hash - Math.floor(hash)) < patternDensity) {
          px[y][x] = cc(accentC, 0.6)
        }
      }
    }
  }

  // Warmth mouth modification — make it bigger smile or add fangs
  if (traits.warmth < 0.2) {
    // Add fang pixels below mouth
    for (let y = 0; y < gs; y++) for (let x = 0; x < gs; x++) {
      if (px[y][x] === colorMap[9] && y + 1 < gs && px[y + 1][x] !== colorMap[1]) {
        px[y + 1][x] = '#e8e8f0' // fang
      }
    }
  }

  // Elder decorations
  if (stage === 'elder') {
    // Add a small crown/gem above the top
    let topY = gs
    for (let y = 0; y < gs; y++) for (let x = 0; x < gs; x++)
      if (px[y][x] && y < topY) topY = y
    // Find center X at top
    let topCx = 0, topCount = 0
    for (let x = 0; x < gs; x++) if (px[topY]?.[x]) { topCx += x; topCount++ }
    topCx = topCount > 0 ? Math.floor(topCx / topCount) : Math.floor(gs / 2)
    // Crown: 3 points
    if (topY >= 3) {
      px[topY - 1][topCx] = cc(accentC)
      px[topY - 2][topCx] = cc(accentC)
      px[topY - 3][topCx] = cc(highlightC)
      if (topCx > 1 && topCx < gs - 2) {
        px[topY - 1][topCx - 2] = cc(accentC)
        px[topY - 2][topCx - 2] = cc(highlightC)
        px[topY - 1][topCx + 2] = cc(accentC)
        px[topY - 2][topCx + 2] = cc(highlightC)
      }
    }
  }

  // Bounce animation
  if (traits.energy > 0.4 && frame % 4 < 2) {
    const shifted: (string | null)[][] = Array.from({ length: gs }, () => Array(gs).fill(null))
    for (let y = 1; y < gs; y++) for (let x = 0; x < gs; x++) shifted[y - 1][x] = px[y][x]
    return { pixels: shifted, size: gs }
  }

  return { pixels: px, size: gs }
}
