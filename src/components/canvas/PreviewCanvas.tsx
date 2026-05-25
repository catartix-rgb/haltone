'use client'

import { useEffect, useRef } from 'react'
import type { RenderResult } from '@/types'
import { paintToCanvas } from '@/lib/export/canvas-renderer'

interface PreviewCanvasProps {
  result: RenderResult | null
  /** When true, draws a transparency checkerboard behind */
  showTransparency?: boolean
  className?: string
}

/**
 * PreviewCanvas — paints a RenderResult into a Canvas.
 *
 * We use a Canvas (not SVG) for live previews because rendering
 * 20,000 dots through DOM nodes thrashes the page. The exported SVG
 * uses the SAME primitives, so what you see is what you save.
 */
export function PreviewCanvas({ result, showTransparency, className }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !result) return

    const { width: W, height: H } = result.bounds
    // Device pixel ratio for crisp rendering on retina
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.aspectRatio = `${W} / ${H}`

    const ctx = canvas.getContext('2d')!
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paintToCanvas(ctx, result, { transparent: showTransparency })
  }, [result, showTransparency])

  if (!result) return null

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
      }}
    />
  )
}
