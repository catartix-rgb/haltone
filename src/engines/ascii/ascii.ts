import type { EngineRenderArgs, RenderPrimitive, RenderResult } from '@/types'
import {
  averageLumaInCell,
  resolveBackground,
  resolveInkColor,
} from '@/engines/common/sampling'
import { mulberry32 } from '@/lib/utils/cn'

/**
 * ASCII engine — text-as-image.
 *
 * Picks a glyph from the user's charset whose visual density matches the
 * cell luma, then emits a `text` primitive. These survive SVG export as
 * real, editable glyphs (font swappable in Illustrator/Figma). Supports
 * per-glyph rotation and scale for modular/abstract grids.
 */
export function renderAscii({
  imageData,
  width,
  height,
  layer,
}: EngineRenderArgs): RenderResult {
  const p = layer.ascii
  const color = layer.color
  const cell = Math.max(4, p.cellSize)
  const cellW = cell * 0.6
  const cellH = cell

  const charset = p.charset.length > 0 ? p.charset : ' .:-=+*#%@'
  const n = charset.length
  const cols = Math.floor(width / cellW)
  const rows = Math.floor(height / cellH)

  const rand = mulberry32(7777)
  const primitives: RenderPrimitive[] = []

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = i * cellW + cellW / 2
      const y = j * cellH + cellH / 2
      const luma = averageLumaInCell(imageData.data, width, height, x, y, Math.max(cellW, cellH))

      let idx = Math.min(n - 1, Math.max(0, Math.round((1 - luma) * (n - 1))))
      if (p.randomness > 0 && rand() < p.randomness) {
        idx = Math.min(n - 1, Math.max(0, idx + (rand() < 0.5 ? -1 : 1)))
      }

      const ch = charset[idx]
      if (ch === ' ' || ch === '\u00A0') continue

      const intensity = 1 - luma
      primitives.push({
        type: 'text',
        x,
        y: y + cellH * 0.32,
        content: ch,
        fill: resolveInkColor(color, intensity),
        fontFamily: p.fontFamily,
        fontSize: cellH * p.charScale,
        fontWeight: p.fontWeight,
        rotate: p.charRotation || undefined,
      })
    }
  }

  return {
    primitives,
    bounds: { width, height },
    background: resolveBackground(color),
  }
}
