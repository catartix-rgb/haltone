import type { RenderResult } from '@/types'
import { paintToCanvas } from './canvas-renderer'
import { renderToSvg } from './svg-renderer'

/**
 * Download helpers — wrap the renderers in browser file-save plumbing.
 */

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke after the browser has had time to read the blob
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportSvg(
  result: RenderResult,
  opts: {
    filename?: string
    transparent?: boolean
    outputWidth?: number
    outputHeight?: number
  } = {},
) {
  const svg = renderToSvg(result, {
    transparent: opts.transparent,
    outputWidth: opts.outputWidth,
    outputHeight: opts.outputHeight,
    title: 'Halftone Studio export',
  })
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, opts.filename ?? `halftone-${Date.now()}.svg`)
}

/**
 * Rasterize the RenderResult to a PNG at an arbitrary resolution.
 *
 * We render straight to an OffscreenCanvas (or fall back to a real canvas)
 * at the requested pixel dimensions — no SVG round-trip, no quality loss
 * from scaling. The Canvas renderer just paints the same primitives at
 * the target scale.
 */
export async function exportPng(
  result: RenderResult,
  opts: {
    filename?: string
    transparent?: boolean
    width: number
    height?: number
  },
): Promise<void> {
  const baseW = result.bounds.width
  const baseH = result.bounds.height
  const outW = Math.round(opts.width)
  const outH = Math.round(opts.height ?? (opts.width / baseW) * baseH)
  const scale = outW / baseW

  let canvas: HTMLCanvasElement | OffscreenCanvas
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(outW, outH)
    ctx = canvas.getContext('2d')!
  } else {
    canvas = document.createElement('canvas')
    canvas.width = outW
    canvas.height = outH
    ctx = canvas.getContext('2d')!
  }

  ctx.scale(scale, scale)
  paintToCanvas(ctx, result, { transparent: opts.transparent })

  let blob: Blob
  if ('convertToBlob' in canvas) {
    blob = await canvas.convertToBlob({ type: 'image/png' })
  } else {
    blob = await new Promise<Blob>((resolve) =>
      (canvas as HTMLCanvasElement).toBlob((b) => resolve(b!), 'image/png'),
    )
  }

  downloadBlob(blob, opts.filename ?? `halftone-${outW}x${outH}.png`)
}

/** Preset PNG resolutions */
export const PNG_PRESETS = [
  { label: 'HD', width: 1920 },
  { label: '2K', width: 2560 },
  { label: '4K', width: 3840 },
  { label: '8K', width: 7680 },
] as const
