import type { EngineRenderArgs, RenderPrimitive, RenderResult } from '@/types'
import {
  averageLumaInCell,
  resolveBackground,
  resolveInkColor,
} from '@/engines/common/sampling'
import { mulberry32 } from '@/lib/utils/cn'

/**
 * Halftone engine.
 *
 * For each cell of a rotated grid we compute the average luma of the
 * underlying image and emit one geometric primitive (circle, square,
 * diamond, line, cross, hexagon) whose size is inversely proportional
 * to the luma — dark areas → big marks, light areas → small or no marks.
 *
 * Output: an array of RenderPrimitives. The SVG and Canvas renderers
 * consume those without caring how they were generated. This means the
 * SVG export and the realtime preview are the same drawing, byte-for-byte.
 */
export function renderHalftone({
  imageData,
  width,
  height,
  project,
}: EngineRenderArgs): RenderResult {
  const params = project.halftone
  const color = project.color
  const cell = Math.max(2, params.cellSize)
  const angle = (params.angle * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const maxR = (cell / 2) * params.dotScale

  // Grid centered on the canvas to keep rotation visually balanced
  const cx0 = width / 2
  const cy0 = height / 2

  // Cover the rotated rectangle — diagonal is the worst case
  const diag = Math.ceil(Math.hypot(width, height) / cell) + 2
  const half = Math.floor(diag / 2)

  const rand = mulberry32(1337)
  const primitives: RenderPrimitive[] = []

  // Background as the first primitive — keeps the SVG self-contained
  // and lets exports honor "transparent background" via opacity 0.

  for (let j = -half; j <= half; j++) {
    for (let i = -half; i <= half; i++) {
      // Grid → rotated world coords
      const gx = i * cell
      const gy = j * cell
      const wx = cx0 + gx * cos - gy * sin
      const wy = cy0 + gx * sin + gy * cos

      // Jitter — break the perfect grid
      const jx = params.jitter > 0 ? (rand() - 0.5) * cell * params.jitter : 0
      const jy = params.jitter > 0 ? (rand() - 0.5) * cell * params.jitter : 0
      const x = wx + jx
      const y = wy + jy

      // Skip cells outside the image (with a small margin so edges feel full)
      if (x < -cell || y < -cell || x > width + cell || y > height + cell) continue

      // Sample luma
      const luma = averageLumaInCell(imageData.data, width, height, x, y, cell)
      const intensity = 1 - luma // dark → high intensity
      if (intensity <= 0.02) continue // nothing meaningful to draw

      const radius = maxR * intensity
      if (radius < 0.3) continue

      const fill = resolveInkColor(color, intensity)

      // Per-shape emission
      switch (params.shape) {
        case 'circle':
          primitives.push({ type: 'circle', cx: x, cy: y, r: radius, fill })
          break

        case 'square':
          primitives.push({
            type: 'rect',
            x: x - radius,
            y: y - radius,
            w: radius * 2,
            h: radius * 2,
            fill,
            rotate: params.shapeRotation,
          })
          break

        case 'diamond':
          primitives.push({
            type: 'rect',
            x: x - radius,
            y: y - radius,
            w: radius * 2,
            h: radius * 2,
            fill,
            rotate: 45 + params.shapeRotation,
          })
          break

        case 'line': {
          const len = radius * 2
          const a = ((params.angle + params.shapeRotation + 90) * Math.PI) / 180
          const dx = (Math.cos(a) * len) / 2
          const dy = (Math.sin(a) * len) / 2
          primitives.push({
            type: 'line',
            x1: x - dx,
            y1: y - dy,
            x2: x + dx,
            y2: y + dy,
            stroke: fill,
            strokeWidth: Math.max(0.5, radius * 0.6),
          })
          break
        }

        case 'cross': {
          const sw = Math.max(0.5, radius * 0.4)
          primitives.push({
            type: 'rect',
            x: x - radius,
            y: y - sw / 2,
            w: radius * 2,
            h: sw,
            fill,
            rotate: params.shapeRotation,
          })
          primitives.push({
            type: 'rect',
            x: x - sw / 2,
            y: y - radius,
            w: sw,
            h: radius * 2,
            fill,
            rotate: params.shapeRotation,
          })
          break
        }

        case 'hex': {
          const r = radius
          // Pointy-top hexagon path centered on (x,y)
          const pts: string[] = []
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k - Math.PI / 2
            const px = x + r * Math.cos(a)
            const py = y + r * Math.sin(a)
            pts.push(`${px.toFixed(2)},${py.toFixed(2)}`)
          }
          primitives.push({
            type: 'path',
            d: `M${pts.join('L')}Z`,
            fill,
          })
          break
        }
      }
    }
  }

  return {
    primitives,
    bounds: { width, height },
    background: resolveBackground(color),
  }
}
