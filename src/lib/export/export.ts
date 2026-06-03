import type { CompositeResult } from '@/types'
import { compositeToCanvas } from './canvas-renderer'
import { renderToSvg } from './svg-renderer'

/** Browser file-save plumbing. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportSvg(
  composite: CompositeResult,
  opts: { filename?: string; transparent?: boolean; outputWidth?: number; outputHeight?: number } = {},
) {
  const svg = renderToSvg(composite, {
    transparent: opts.transparent,
    outputWidth: opts.outputWidth,
    outputHeight: opts.outputHeight,
    title: 'Halftone Studio export',
  })
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), opts.filename ?? `halftone-${Date.now()}.svg`)
}

function makeExportCanvas(w: number, h: number) {
  if (typeof OffscreenCanvas !== 'undefined') {
    const c = new OffscreenCanvas(w, h)
    return { canvas: c, ctx: c.getContext('2d')! as OffscreenCanvasRenderingContext2D }
  }
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { canvas: c, ctx: c.getContext('2d')! as unknown as OffscreenCanvasRenderingContext2D }
}

async function canvasToBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  type: string,
  quality?: number,
): Promise<Blob> {
  if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality })
  return new Promise((resolve) =>
    (canvas as HTMLCanvasElement).toBlob((b) => resolve(b!), type, quality),
  )
}

/**
 * Rasterize the composite to PNG or JPG at any resolution. We re-paint
 * the vector primitives at the target scale (crisp), never upscale a
 * raster.
 */
export async function exportRaster(
  composite: CompositeResult,
  opts: {
    format: 'png' | 'jpeg'
    width: number
    height?: number
    transparent?: boolean
    quality?: number
    filename?: string
  },
): Promise<void> {
  const baseW = composite.bounds.width
  const baseH = composite.bounds.height
  const outW = Math.round(opts.width)
  const outH = Math.round(opts.height ?? (opts.width / baseW) * baseH)
  const scale = outW / baseW

  const { canvas, ctx } = makeExportCanvas(outW, outH)
  // JPEG has no alpha — force opaque
  const transparent = opts.format === 'png' ? opts.transparent : false
  compositeToCanvas(ctx, composite, { transparent, pixelScale: scale })

  const mime = opts.format === 'png' ? 'image/png' : 'image/jpeg'
  const blob = await canvasToBlob(canvas, mime, opts.quality)
  const ext = opts.format === 'png' ? 'png' : 'jpg'
  downloadBlob(blob, opts.filename ?? `halftone-${outW}x${outH}.${ext}`)
}

export const PNG_PRESETS = [
  { label: 'HD', width: 1920 },
  { label: '2K', width: 2560 },
  { label: '4K', width: 3840 },
  { label: '8K', width: 7680 },
] as const
