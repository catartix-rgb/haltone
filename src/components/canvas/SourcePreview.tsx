'use client'

import { useEffect, useRef } from 'react'
import { getBitmap } from '@/lib/image/bitmap-store'

/** Draws the raw source bitmap — used by the Before/After comparison. */
export function SourcePreview({ bitmapId, className }: { bitmapId: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const bmp = getBitmap(bitmapId)
    if (!canvas || !bmp) return
    canvas.width = bmp.width
    canvas.height = bmp.height
    canvas.style.aspectRatio = `${bmp.width} / ${bmp.height}`
    canvas.getContext('2d')!.drawImage(bmp, 0, 0)
  }, [bitmapId])
  return <canvas ref={ref} className={className} style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain' }} />
}
