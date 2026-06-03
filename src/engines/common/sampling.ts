import type { ColorMode } from '@/types'
import { hexToRgb, lerpRgb, rgbToCss, sampleGradient, type RGB } from '@/lib/color/color'

/**
 * Given the project's ColorMode and a normalized "ink intensity"
 * (0 = no mark, 1 = max mark — for halftone this is the dot's relative
 * size / coverage; for ASCII it's the inverse luma), return the CSS
 * color string to paint with.
 *
 * Centralizing this means every engine speaks the same color language —
 * we only have to teach the color system once.
 */
export function resolveInkColor(color: ColorMode, intensity: number): string {
  const t = Math.max(0, Math.min(1, intensity))

  switch (color.kind) {
    case 'solid':
      return color.foreground

    case 'duotone': {
      const a = hexToRgb(color.highlight)
      const b = hexToRgb(color.shadow)
      // t=0 means weakest ink → closer to highlight; t=1 = shadow
      return rgbToCss(lerpRgb(a, b, t))
    }

    case 'tritone': {
      const a = hexToRgb(color.highlight)
      const m = hexToRgb(color.mid)
      const b = hexToRgb(color.shadow)
      const c: RGB =
        t < 0.5 ? lerpRgb(a, m, t * 2) : lerpRgb(m, b, (t - 0.5) * 2)
      return rgbToCss(c)
    }

    case 'gradient': {
      const stops = color.stops.map((s) => ({
        offset: s.offset,
        color: hexToRgb(s.color),
      }))
      return rgbToCss(sampleGradient(stops, t))
    }
  }
}

export function resolveBackground(color: ColorMode): string {
  return color.background
}

/** Rec.709 luma from an ImageData index */
export function sampleLuma(data: Uint8ClampedArray, idx: number): number {
  return (0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2]) / 255
}

/** Average luma over a rectangular cell — used by halftone & ASCII */
export function averageLumaInCell(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  cellSize: number,
): number {
  const half = cellSize / 2
  const x0 = Math.max(0, Math.floor(cx - half))
  const y0 = Math.max(0, Math.floor(cy - half))
  const x1 = Math.min(width, Math.ceil(cx + half))
  const y1 = Math.min(height, Math.ceil(cy + half))
  let total = 0
  let count = 0
  // Skip stride for big cells — sample sparsely to stay quick
  const step = cellSize > 12 ? 2 : 1
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * width + x) * 4
      total += sampleLuma(data, i)
      count++
    }
  }
  return count === 0 ? 1 : total / count
}
