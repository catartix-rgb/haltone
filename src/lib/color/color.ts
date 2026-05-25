/**
 * Color utilities.
 *
 * Internally we work with RGB tuples (0-255) because that's what ImageData
 * gives us and what SVG/Canvas consume. We expose a few helpers to convert
 * to/from hex, and to interpolate between colors — the basis of duotone,
 * tritone and gradient mapping.
 */

export type RGB = readonly [number, number, number]

// ────────────────────────────────────────────────────────────────
//  Parsing / formatting
// ────────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): RGB {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('')
  }
  const n = parseInt(h, 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

export function rgbToHex([r, g, b]: RGB): string {
  const toHex = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function rgbToCss([r, g, b]: RGB, a = 1): string {
  if (a < 1) return `rgba(${r | 0},${g | 0},${b | 0},${a})`
  return `rgb(${r | 0},${g | 0},${b | 0})`
}

// ────────────────────────────────────────────────────────────────
//  Interpolation
// ────────────────────────────────────────────────────────────────

export function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  const k = Math.max(0, Math.min(1, t))
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

/**
 * Sample a multi-stop gradient at position t (0..1).
 * Stops are expected to be sorted by offset.
 */
export function sampleGradient(
  stops: ReadonlyArray<{ offset: number; color: RGB }>,
  t: number,
): RGB {
  if (stops.length === 0) return [0, 0, 0]
  if (stops.length === 1) return stops[0].color
  if (t <= stops[0].offset) return stops[0].color
  if (t >= stops[stops.length - 1].offset) return stops[stops.length - 1].color
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (t >= a.offset && t <= b.offset) {
      const k = (t - a.offset) / (b.offset - a.offset)
      return lerpRgb(a.color, b.color, k)
    }
  }
  return stops[stops.length - 1].color
}

// ────────────────────────────────────────────────────────────────
//  Luminance
// ────────────────────────────────────────────────────────────────

/** Rec.709 luma — perceptually weighted */
export function luma([r, g, b]: RGB): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Curated palette presets — these establish the visual language.
 * Designers can pick one to seed their composition.
 */
export const PALETTE_PRESETS = [
  { name: 'Ink',          fg: '#0a0e1a', bg: '#f4f1ea' },
  { name: 'Risograph',    fg: '#ff4f4f', bg: '#fdf6e3' },
  { name: 'Aqua',         fg: '#0c4a6e', bg: '#e0f2fe' },
  { name: 'Cyber',        fg: '#00ff9d', bg: '#0a0a0a' },
  { name: 'Newsprint',    fg: '#1a1a1a', bg: '#e8e1d4' },
  { name: 'Iridescent',   fg: '#5b21b6', bg: '#f0fdfa' },
  { name: 'Plasma',       fg: '#fb7185', bg: '#1e1b4b' },
  { name: 'Sage',         fg: '#14532d', bg: '#ecfccb' },
] as const

export const DUOTONE_PRESETS = [
  { name: 'Mint',     shadow: '#0f766e', highlight: '#fef9c3', bg: '#ecfccb' },
  { name: 'Plum',     shadow: '#581c87', highlight: '#fce7f3', bg: '#fdf4ff' },
  { name: 'Ocean',    shadow: '#082f49', highlight: '#a5f3fc', bg: '#f0f9ff' },
  { name: 'Mono',     shadow: '#171717', highlight: '#fafafa', bg: '#ffffff' },
  { name: 'Sunset',   shadow: '#7c2d12', highlight: '#fed7aa', bg: '#fff7ed' },
] as const
