import type { EngineRenderArgs, RenderPrimitive, RenderResult } from '@/types'
import { averageLumaInCell, resolveBackground, resolveInkColor } from '@/engines/common/sampling'
import { mulberry32 } from '@/lib/utils/cn'

/**
 * ASCII engine — text-as-image.
 *
 * Same idea as halftone, but instead of geometric primitives we pick a
 * character from the user's charset whose visual density matches the
 * underlying luma. We emit one `text` primitive per cell — these survive
 * SVG export as real, editable, selectable glyphs in Illustrator.
 */
export function renderAscii({
  imageData,
  width,
  height,
  project,
}: EngineRenderArgs): RenderResult {
  const p = project.ascii
  const color = project.color
  const cell = Math.max(4, p.cellSize)
  // ASCII characters are taller than wide — keep cells rectangular
  const cellW = cell * 0.6
  const cellH = cell

  // Charset must be sorted dark-to-light. Empty/whitespace = no ink.
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
      const luma = averageLumaInCell(
        imageData.data,
        width,
        height,
        x,
        y,
        Math.max(cellW, cellH),
      )

      // Map luma → index (dark luma → late in charset = denser char)
      let idx = Math.min(n - 1, Math.max(0, Math.round((1 - luma) * (n - 1))))

      // Randomness — swap to an adjacent char of similar density
      if (p.randomness > 0 && rand() < p.randomness) {
        const delta = rand() < 0.5 ? -1 : 1
        idx = Math.min(n - 1, Math.max(0, idx + delta))
      }

      const ch = charset[idx]
      if (ch === ' ' || ch === '\u00A0') continue // skip whitespace

      const intensity = 1 - luma
      primitives.push({
        type: 'text',
        x,
        y: y + cellH * 0.32, // baseline tweak — text x/y is baseline, we want visual center
        content: ch,
        fill: resolveInkColor(color, intensity),
        fontFamily: p.fontFamily,
        fontSize: cellH,
        fontWeight: p.fontWeight,
      })
    }
  }

  return {
    primitives,
    bounds: { width, height },
    background: resolveBackground(color),
  }
}
