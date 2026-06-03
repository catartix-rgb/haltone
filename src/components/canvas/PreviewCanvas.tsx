'use client'

import { useEffect, useRef } from 'react'
import type { CompositeResult } from '@/types'
import { compositeToCanvas } from '@/lib/export/canvas-renderer'

interface PreviewCanvasProps {
  result: CompositeResult | null
  showTransparency?: boolean
  className?: string
}

/**
 * PreviewCanvas — composites the layer stack into a Canvas every time the
 * result changes. Canvas (not SVG) keeps tens of thousands of marks
 * rendering in milliseconds. The exported SVG uses the same primitives.
 */
export function PreviewCanvas({ result, showTransparency, className }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !result) return

    const { width: W, height: H } = result.bounds
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    canvas.style.aspectRatio = `${W} / ${H}`

    const ctx = canvas.getContext('2d')!
    compositeToCanvas(ctx, result, { transparent: showTransparency, pixelScale: dpr })
  }, [result, showTransparency])

  if (!result) return null

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }}
    />
  )
}
