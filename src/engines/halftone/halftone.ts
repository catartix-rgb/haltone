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
 * For each cell of a rotated grid we read the average luma of the image
 * and emit one geometric primitive whose size tracks the inverse luma
 * (dark → big mark). The "gamma" param reshapes that mapping (the dot
 * growth curve) and "contour" switches to stroke-only vector outlines.
 *
 * Shapes: circle, square, diamond, triangle, line, cross, hexagon, plus
 * a user-uploaded custom SVG path.
 */
export function renderHalftone({
  imageData,
  width,
  height,
  layer,
}: EngineRenderArgs): RenderResult {
  const p = layer.halftone
  const color = layer.color
  const cell = Math.max(2, p.cellSize)
  const angle = (p.angle * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const maxR = (cell / 2) * p.dotScale
  const gamma = Math.max(0.05, p.gamma)
  const contour = p.contour

  const cx0 = width / 2
  const cy0 = height / 2
  const diag = Math.ceil(Math.hypot(width, height) / cell) + 2
  const half = Math.floor(diag / 2)

  const rand = mulberry32(1337)
  const primitives: RenderPrimitive[] = []

  for (let j = -half; j <= half; j++) {
    for (let i = -half; i <= half; i++) {
      const gx = i * cell
      const gy = j * cell
      const wx = cx0 + gx * cos - gy * sin
      const wy = cy0 + gx * sin + gy * cos

      const jx = p.jitter > 0 ? (rand() - 0.5) * cell * p.jitter : 0
      const jy = p.jitter > 0 ? (rand() - 0.5) * cell * p.jitter : 0
      const x = wx + jx
      const y = wy + jy

      if (x < -cell || y < -cell || x > width + cell || y > height + cell) continue

      const luma = averageLumaInCell(imageData.data, width, height, x, y, cell)
      // Dot growth curve: remap intensity through gamma
      const intensity = Math.pow(1 - luma, gamma)
      if (intensity <= 0.02) continue

      const radius = maxR * intensity
      if (radius < 0.3) continue

      const fill = resolveInkColor(color, intensity)
      const stroke = contour ? fill : undefined
      const strokeWidth = contour ? Math.max(0.4, cell * 0.04) : undefined
      const drawFill = contour ? 'none' : fill

      switch (p.shape) {
        case 'circle':
          primitives.push({
            type: 'circle',
            cx: x,
            cy: y,
            r: radius,
            fill: drawFill,
            stroke,
            strokeWidth,
          })
          break

        case 'square':
          primitives.push({
            type: 'rect',
            x: x - radius,
            y: y - radius,
            w: radius * 2,
            h: radius * 2,
            fill: drawFill === 'none' ? fill : drawFill,
            rotate: p.shapeRotation,
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
            rotate: 45 + p.shapeRotation,
          })
          break

        case 'triangle': {
          const r = radius * 1.2
          const a0 = (-90 + p.shapeRotation) * (Math.PI / 180)
          const pts: string[] = []
          for (let k = 0; k < 3; k++) {
            const a = a0 + (k * 2 * Math.PI) / 3
            pts.push(`${(x + r * Math.cos(a)).toFixed(2)},${(y + r * Math.sin(a)).toFixed(2)}`)
          }
          primitives.push({
            type: 'path',
            d: `M${pts.join('L')}Z`,
            fill: drawFill,
            stroke,
            strokeWidth,
          })
          break
        }

        case 'line': {
          const len = radius * 2
          const a = ((p.angle + p.shapeRotation + 90) * Math.PI) / 180
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
          primitives.push({ type: 'rect', x: x - radius, y: y - sw / 2, w: radius * 2, h: sw, fill, rotate: p.shapeRotation })
          primitives.push({ type: 'rect', x: x - sw / 2, y: y - radius, w: sw, h: radius * 2, fill, rotate: p.shapeRotation })
          break
        }

        case 'hex': {
          const r = radius
          const pts: string[] = []
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k - Math.PI / 2
            pts.push(`${(x + r * Math.cos(a)).toFixed(2)},${(y + r * Math.sin(a)).toFixed(2)}`)
          }
          primitives.push({ type: 'path', d: `M${pts.join('L')}Z`, fill: drawFill, stroke, strokeWidth })
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
