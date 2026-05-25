import type { RenderResult } from '@/types'

/**
 * Canvas renderer — used for the live preview.
 *
 * Why Canvas for the preview and SVG for export?
 *   - Canvas: orders of magnitude faster at drawing tens of thousands
 *     of primitives. Re-draws in a few milliseconds, no DOM thrash.
 *   - SVG: vector, infinitely zoomable, editable in Illustrator.
 *     Slower to mount but it's a one-shot at export time.
 *
 * Both renderers walk the SAME RenderPrimitive[] array — so previews
 * and exports are pixel-identical (within rounding).
 */
export function paintToCanvas(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  result: RenderResult,
  opts: { transparent?: boolean } = {},
) {
  const { bounds, background, primitives } = result
  const W = bounds.width
  const H = bounds.height

  // Clear + background
  ctx.save()
  ctx.clearRect(0, 0, W, H)
  if (!opts.transparent && background && background !== 'transparent') {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, W, H)
  }

  for (const p of primitives) {
    switch (p.type) {
      case 'circle':
        ctx.beginPath()
        ctx.fillStyle = p.fill
        ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'rect':
        ctx.save()
        ctx.fillStyle = p.fill
        if (p.rotate) {
          const cx = p.x + p.w / 2
          const cy = p.y + p.h / 2
          ctx.translate(cx, cy)
          ctx.rotate((p.rotate * Math.PI) / 180)
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        } else {
          ctx.fillRect(p.x, p.y, p.w, p.h)
        }
        ctx.restore()
        break

      case 'line':
        ctx.beginPath()
        ctx.strokeStyle = p.stroke
        ctx.lineWidth = p.strokeWidth
        ctx.lineCap = 'round'
        ctx.moveTo(p.x1, p.y1)
        ctx.lineTo(p.x2, p.y2)
        ctx.stroke()
        break

      case 'path':
        ctx.fillStyle = p.fill
        ctx.fill(new Path2D(p.d))
        break

      case 'text':
        ctx.fillStyle = p.fill
        ctx.font = `${p.fontWeight} ${p.fontSize}px ${p.fontFamily}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(p.content, p.x, p.y)
        break
    }
  }

  ctx.restore()
}
