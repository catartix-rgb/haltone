import type { ColorMode, EngineRenderArgs, RenderPrimitive, RenderResult } from '@/types'
import { hexToRgb, lerpRgb, rgbToCss, type RGB } from '@/lib/color/color'
import { resolveBackground } from '@/engines/common/sampling'
import { mulberry32 } from '@/lib/utils/cn'

/**
 * Dither engine.
 *
 * Error-diffusion kernels (Floyd–Steinberg, Atkinson, Jarvis, Stucki,
 * Sierra) and ordered Bayer matrices (2×2 / 4×4 / 8×8). Each diffusion
 * kernel is declared as a list of {dx, dy, weight} taps over a shared
 * divisor — adding a new kernel is one array.
 *
 * Output rectangles are run-length-coalesced horizontally so a 4K dither
 * stays as a usable SVG instead of millions of 1px rects.
 */

type Tap = readonly [dx: number, dy: number, w: number]

const KERNELS: Record<string, { taps: Tap[]; div: number }> = {
  'floyd-steinberg': {
    div: 16,
    taps: [
      [1, 0, 7],
      [-1, 1, 3],
      [0, 1, 5],
      [1, 1, 1],
    ],
  },
  atkinson: {
    div: 8,
    taps: [
      [1, 0, 1],
      [2, 0, 1],
      [-1, 1, 1],
      [0, 1, 1],
      [1, 1, 1],
      [0, 2, 1],
    ],
  },
  jarvis: {
    div: 48,
    taps: [
      [1, 0, 7], [2, 0, 5],
      [-2, 1, 3], [-1, 1, 5], [0, 1, 7], [1, 1, 5], [2, 1, 3],
      [-2, 2, 1], [-1, 2, 3], [0, 2, 5], [1, 2, 3], [2, 2, 1],
    ],
  },
  stucki: {
    div: 42,
    taps: [
      [1, 0, 8], [2, 0, 4],
      [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2],
      [-2, 2, 1], [-1, 2, 2], [0, 2, 4], [1, 2, 2], [2, 2, 1],
    ],
  },
  sierra: {
    div: 32,
    taps: [
      [1, 0, 5], [2, 0, 3],
      [-2, 1, 2], [-1, 1, 4], [0, 1, 5], [1, 1, 4], [2, 1, 2],
      [-1, 2, 2], [0, 2, 3], [1, 2, 2],
    ],
  },
}

const BAYER_2 = [
  [0, 2],
  [3, 1],
]
const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]
const BAYER_8 = (() => {
  const m: number[][] = Array.from({ length: 8 }, () => Array(8).fill(0))
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      let v = 0
      let mask = 4
      let bit = 0
      for (let s = 0; s < 3; s++) {
        v += ((((y >> (2 - s)) & 1) ^ ((x >> (2 - s)) & 1)) << (bit++))
        v += (((x >> (2 - s)) & 1) << (bit++))
        void mask
      }
      m[y][x] = v
    }
  }
  return m
})()

function resolveDitherColor(color: ColorMode, intensity: number): string {
  switch (color.kind) {
    case 'solid':
      return intensity >= 0.5 ? color.foreground : color.background
    case 'duotone':
      return rgbToCss(lerpRgb(hexToRgb(color.highlight), hexToRgb(color.shadow), intensity))
    case 'tritone': {
      const a = hexToRgb(color.highlight)
      const m = hexToRgb(color.mid)
      const b = hexToRgb(color.shadow)
      const c: RGB = intensity < 0.5 ? lerpRgb(a, m, intensity * 2) : lerpRgb(m, b, (intensity - 0.5) * 2)
      return rgbToCss(c)
    }
    case 'gradient': {
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

export function renderDither({ imageData, width, height, layer }: EngineRenderArgs): RenderResult {
  const p = layer.dither
  const color = layer.color
  const scale = Math.max(1, Math.floor(p.scale))
  const levels = Math.max(2, Math.floor(p.levels))
  const step = 255 / (levels - 1)

  const w = Math.max(1, Math.floor(width / scale))
  const h = Math.max(1, Math.floor(height / scale))
  const rand = mulberry32(909)

  // Sample luma into a working buffer, with optional organic distortion + noise
  const grey = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sx = (x + 0.5) * scale
      let sy = (y + 0.5) * scale
      if (p.distortion > 0) {
        sx += Math.sin(y * 0.3) * p.distortion * scale * 2 + (rand() - 0.5) * p.distortion * scale
        sy += Math.cos(x * 0.3) * p.distortion * scale * 2
      }
      sx = Math.min(width - 1, Math.max(0, Math.floor(sx)))
      sy = Math.min(height - 1, Math.max(0, Math.floor(sy)))
      const i = (sy * width + sx) * 4
      let l =
        0.2126 * imageData.data[i] + 0.7152 * imageData.data[i + 1] + 0.0722 * imageData.data[i + 2]
      if (p.noise > 0) l += (rand() - 0.5) * p.noise * 120
      grey[y * w + x] = Math.min(255, Math.max(0, l))
    }
  }

  // Edge enhancement — light unsharp mask
  if (p.edgeEnhance > 0) {
    const src = grey.slice()
    const amt = p.edgeEnhance * 1.2
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        const lap =
          4 * src[i] - src[i - 1] - src[i + 1] - src[i - w] - src[i + w]
        grey[i] = Math.min(255, Math.max(0, src[i] + lap * amt))
      }
    }
  }

  const isBayer = p.algorithm.startsWith('bayer')
  if (isBayer) {
    const matrix = p.algorithm === 'bayer-2x2' ? BAYER_2 : p.algorithm === 'bayer-4x4' ? BAYER_4 : BAYER_8
    const div = matrix.length * matrix.length
    const size = matrix.length
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x
        const t = (matrix[y % size][x % size] / div - 0.5) * step
        grey[i] = Math.min(255, Math.max(0, Math.round((grey[i] + t) / step) * step))
      }
    }
  } else {
    applyDiffusion(grey, w, h, step, KERNELS[p.algorithm] ?? KERNELS['floyd-steinberg'], p.serpentine)
  }

  // Coalesce horizontal runs of equal quantized value into wider rects
  const primitives: RenderPrimitive[] = []
  for (let y = 0; y < h; y++) {
    let runStart = 0
    let runIntensity = -1
    for (let x = 0; x <= w; x++) {
      const v = x < w ? Math.round((1 - grey[y * w + x] / 255) * (levels - 1)) / (levels - 1) : -2
      if (v !== runIntensity) {
        if (runIntensity >= 0) {
          primitives.push({
            type: 'rect',
            x: runStart * scale,
            y: y * scale,
            w: (x - runStart) * scale,
            h: scale,
            fill: resolveDitherColor(color, runIntensity),
          })
        }
        runStart = x
        runIntensity = v
      }
    }
  }

  return { primitives, bounds: { width, height }, background: resolveBackground(color) }
}

function applyDiffusion(
  grey: Float32Array,
  w: number,
  h: number,
  step: number,
  kernel: { taps: Tap[]; div: number },
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
      for (const [dx, dy, wt] of kernel.taps) {
        const nx = x + dx * dir
        const ny = y + dy
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
        grey[ny * w + nx] += (err * wt) / kernel.div
      }
    }
  }
}
