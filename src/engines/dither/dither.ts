import type { EngineRenderArgs, RenderPrimitive, RenderResult } from '@/types'
import { hexToRgb, lerpRgb, rgbToCss, type RGB } from '@/lib/color/color'
import { resolveBackground } from '@/engines/common/sampling'

/**
 * Dither engine.
 *
 * Output is a grid of rectangular pixels. We support:
 *   - Error-diffusion: Floyd–Steinberg, Atkinson (great for print)
 *   - Ordered: 2×2 / 4×4 / 8×8 Bayer matrices (great for screens / NES vibe)
 *
 * Color is mapped through the project's ColorMode by treating the
 * quantized grey level as an "intensity" and sampling the palette.
 *
 * Note: emitting one rect per pixel can explode the SVG. We coalesce
 * horizontally adjacent same-color cells into wider rects — a 5×
 * reduction in node count is typical.
 */

const BAYER_2 = [
  [0, 2],
  [3, 1],
] as const

const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
] as const

// 8x8 generated programmatically
const BAYER_8 = (() => {
  const m: number[][] = Array.from({ length: 8 }, () => Array(8).fill(0))
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const v =
        ((x ^ y) << 4) +
        (x & 1) * 32 +
        (y & 1) * 16 +
        ((x >> 1) & 1) * 8 +
        ((y >> 1) & 1) * 4 +
        ((x >> 2) & 1) * 2 +
        ((y >> 2) & 1)
      m[y][x] = v % 64
    }
  }
  return m
})()

function resolveDitherColor(
  color: EngineRenderArgs['project']['color'],
  intensity: number,
): string {
  // For dither we want a CRISP look — solid swatches, not gradients
  switch (color.kind) {
    case 'solid':
      return intensity >= 0.5 ? color.foreground : color.background
    case 'duotone': {
      const a = hexToRgb(color.highlight)
      const b = hexToRgb(color.shadow)
      return rgbToCss(lerpRgb(a, b, intensity))
    }
    case 'tritone': {
      const a = hexToRgb(color.highlight)
      const m = hexToRgb(color.mid)
      const b = hexToRgb(color.shadow)
      const c: RGB =
        intensity < 0.5
          ? lerpRgb(a, m, intensity * 2)
          : lerpRgb(m, b, (intensity - 0.5) * 2)
      return rgbToCss(c)
    }
    case 'gradient': {
      // Same as halftone — but with steppy quantization built in
      const stops = color.stops.map((s) => ({ offset: s.offset, color: hexToRgb(s.color) }))
      if (stops.length === 0) return '#000'
      for (let i = 0; i < stops.length - 1; i++) {
        if (intensity >= stops[i].offset && intensity <= stops[i + 1].offset) {
          const t = (intensity - stops[i].offset) / (stops[i + 1].offset - stops[i].offset)
          return rgbToCss(lerpRgb(stops[i].color, stops[i + 1].color, t))
        }
      }
      return rgbToCss(stops[stops.length - 1].color)
    }
  }
}

export function renderDither({
  imageData,
  width,
  height,
  project,
}: EngineRenderArgs): RenderResult {
  const p = project.dither
  const color = project.color
  const scale = Math.max(1, Math.floor(p.scale))
  const levels = Math.max(2, Math.floor(p.levels))
  const step = 255 / (levels - 1)

  // Downsample by `scale` — work on a smaller grid for performance
  const w = Math.max(1, Math.floor(width / scale))
  const h = Math.max(1, Math.floor(height / scale))

  // Sample luma into a working buffer
  const grey = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.floor((x + 0.5) * scale)
      const sy = Math.floor((y + 0.5) * scale)
      const i = (sy * width + sx) * 4
      grey[y * w + x] =
        0.2126 * imageData.data[i] +
        0.7152 * imageData.data[i + 1] +
        0.0722 * imageData.data[i + 2]
    }
  }

  // Apply dithering — produces quantized values in `grey`
  if (p.algorithm === 'floyd-steinberg') {
    applyFloydSteinberg(grey, w, h, step, p.serpentine)
  } else if (p.algorithm === 'atkinson') {
    applyAtkinson(grey, w, h, step)
  } else if (p.algorithm === 'bayer-2x2') {
    applyBayer(grey, w, h, step, BAYER_2 as unknown as number[][], 4)
  } else if (p.algorithm === 'bayer-4x4') {
    applyBayer(grey, w, h, step, BAYER_4 as unknown as number[][], 16)
  } else if (p.algorithm === 'bayer-8x8') {
    applyBayer(grey, w, h, step, BAYER_8, 64)
  } else {
    // Plain quantization (no dither) — "ordered" fallback
    for (let i = 0; i < grey.length; i++) {
      grey[i] = Math.round(grey[i] / step) * step
    }
  }

  // Coalesce horizontal runs of equal color into wider rects
  const primitives: RenderPrimitive[] = []
  for (let y = 0; y < h; y++) {
    let runStart = 0
    let runIntensity = -1
    for (let x = 0; x <= w; x++) {
      const v =
        x < w ? Math.round((1 - grey[y * w + x] / 255) * (levels - 1)) / (levels - 1) : -2
      if (v !== runIntensity) {
        if (runIntensity >= 0) {
          const fill = resolveDitherColor(color, runIntensity)
          primitives.push({
            type: 'rect',
            x: runStart * scale,
            y: y * scale,
            w: (x - runStart) * scale,
            h: scale,
            fill,
          })
        }
        runStart = x
        runIntensity = v
      }
    }
  }

  return {
    primitives,
    bounds: { width, height },
    background: resolveBackground(color),
  }
}

// ────────────────────────────────────────────────────────────────
//  Dithering algorithms — operate on Float32Array of luma 0..255
// ────────────────────────────────────────────────────────────────

function applyFloydSteinberg(
  grey: Float32Array,
  w: number,
  h: number,
  step: number,
  serpentine: boolean,
) {
  for (let y = 0; y < h; y++) {
    const ltr = !serpentine || y % 2 === 0
    const xStart = ltr ? 0 : w - 1
    const xEnd = ltr ? w : -1
    const dir = ltr ? 1 : -1
    for (let x = xStart; x !== xEnd; x += dir) {
      const i = y * w + x
      const old = grey[i]
      const q = Math.round(old / step) * step
      grey[i] = q
      const err = old - q
      const next = dir
      // weights 7/16, 3/16, 5/16, 1/16
      if (x + next >= 0 && x + next < w) grey[i + next] += (err * 7) / 16
      if (y + 1 < h) {
        if (x - next >= 0 && x - next < w) grey[i + w - next] += (err * 3) / 16
        grey[i + w] += (err * 5) / 16
        if (x + next >= 0 && x + next < w) grey[i + w + next] += (err * 1) / 16
      }
    }
  }
}

function applyAtkinson(grey: Float32Array, w: number, h: number, step: number) {
  // Atkinson — spreads only 6/8 of the error; gives a lighter, vintage Mac look
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const old = grey[i]
      const q = Math.round(old / step) * step
      grey[i] = q
      const err = (old - q) / 8
      if (x + 1 < w) grey[i + 1] += err
      if (x + 2 < w) grey[i + 2] += err
      if (y + 1 < h) {
        if (x - 1 >= 0) grey[i + w - 1] += err
        grey[i + w] += err
        if (x + 1 < w) grey[i + w + 1] += err
      }
      if (y + 2 < h) grey[i + 2 * w] += err
    }
  }
}

function applyBayer(
  grey: Float32Array,
  w: number,
  h: number,
  step: number,
  matrix: number[][],
  divisor: number,
) {
  const size = matrix.length
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      const t = (matrix[y % size][x % size] / divisor - 0.5) * step
      const v = grey[i] + t
      grey[i] = Math.max(0, Math.min(255, Math.round(v / step) * step))
    }
  }
}
