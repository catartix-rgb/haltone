import type { BlendMode, CompositeResult, RenderResult } from '@/types'

/**
 * Canvas rendering + layer compositing.
 *
 * `paintPrimitives` draws one layer's primitives onto a context already
 * scaled to the desired pixel ratio. `compositeToCanvas` orchestrates
 * the full stack: it fills the document background, then renders each
 * visible layer to its own offscreen buffer and draws it back with the
 * layer's opacity + blend mode.
 *
 * The SAME primitives feed the SVG exporter, so preview === export.
 */

const blendToComposite: Record<BlendMode, GlobalCompositeOperation> = {
  normal: 'source-over',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  'soft-light': 'soft-light',
  difference: 'difference',
  'color-dodge': 'color-dodge',
}

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement | OffscreenCanvas; ctx: Ctx } {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(w, h)
    return { canvas, ctx: canvas.getContext('2d')! }
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d')! }
}

export function paintPrimitives(ctx: Ctx, result: RenderResult) {
  for (const p of result.primitives) {
    switch (p.type) {
      case 'circle':
        ctx.beginPath()
        ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2)
        if (p.fill && p.fill !== 'none') {
          ctx.fillStyle = p.fill
          ctx.fill()
        }
        if (p.stroke) {
          ctx.strokeStyle = p.stroke
          ctx.lineWidth = p.strokeWidth ?? 1
          ctx.stroke()
        }
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

      case 'path': {
        const path = new Path2D(p.d)
        if (p.fill && p.fill !== 'none') {
          ctx.fillStyle = p.fill
          ctx.fill(path)
        }
        if (p.stroke) {
          ctx.strokeStyle = p.stroke
          ctx.lineWidth = p.strokeWidth ?? 1
          ctx.stroke(path)
        }
        break
      }

      case 'text':
        ctx.save()
        ctx.fillStyle = p.fill
        ctx.font = `${p.fontWeight} ${p.fontSize}px ${p.fontFamily}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'alphabetic'
        if (p.rotate) {
          ctx.translate(p.x, p.y)
          ctx.rotate((p.rotate * Math.PI) / 180)
          ctx.fillText(p.content, 0, 0)
        } else {
          ctx.fillText(p.content, p.x, p.y)
        }
        ctx.restore()
        break
    }
  }
}

/**
 * Composite a full layer stack onto `ctx`.
 * @param pixelScale device pixel ratio (preview) or export scale factor.
 */
export function compositeToCanvas(
  ctx: Ctx,
  composite: CompositeResult,
  opts: { transparent?: boolean; pixelScale?: number } = {},
) {
  const scale = opts.pixelScale ?? 1
  const W = composite.bounds.width
  const H = composite.bounds.height
  const dw = Math.round(W * scale)
  const dh = Math.round(H * scale)

  ctx.clearRect(0, 0, dw, dh)
  if (!opts.transparent && composite.background && composite.background !== 'transparent') {
    ctx.fillStyle = composite.background
    ctx.fillRect(0, 0, dw, dh)
  }

  for (const layer of composite.layers) {
    if (!layer.visible) continue
    const { ctx: octx, canvas: off } = makeCanvas(dw, dh)
    octx.scale(scale, scale)
    paintPrimitives(octx, layer.result)

    ctx.save()
    ctx.globalAlpha = layer.opacity
    ctx.globalCompositeOperation = blendToComposite[layer.blendMode]
    ctx.drawImage(off as CanvasImageSource, 0, 0)
    ctx.restore()
  }
}
