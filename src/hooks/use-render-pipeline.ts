'use client'

import { useEffect, useRef, useState } from 'react'
import type { CompositeResult, DocumentState, SourceImage } from '@/types'
import { getBitmap } from '@/lib/image/bitmap-store'
import { applyAdjustments, bitmapToImageData, blurImageData } from '@/lib/image/processing'
import { runEngine } from '@/engines/common/registry'

/**
 * useRenderPipeline
 *
 * (source, document) → CompositeResult (one RenderResult per layer).
 *
 *   1. Decode bitmap → ImageData at preview resolution
 *   2. Apply document-global adjustments (blur, brightness, …) ONCE
 *   3. Run every visible layer's engine against that shared ImageData
 *   4. Return the per-layer results for the compositor to blend
 *
 * Debounced to animation frames; stale jobs are dropped via a sequence
 * counter so dragging a slider never commits an outdated frame.
 */
const PREVIEW_MAX_SIZE = 1024

export function useRenderPipeline(
  source: SourceImage | null,
  doc: DocumentState,
  onComputingChange?: (v: boolean) => void,
): CompositeResult | null {
  const [result, setResult] = useState<CompositeResult | null>(null)
  const rafRef = useRef<number | null>(null)
  const seqRef = useRef(0)

  useEffect(() => {
    if (!source) {
      setResult(null)
      return
    }
    const bmp = getBitmap(source.bitmapId)
    if (!bmp) {
      setResult(null)
      return
    }

    const seq = ++seqRef.current
    onComputingChange?.(true)
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      const { imageData, width, height } = bitmapToImageData(bmp, PREVIEW_MAX_SIZE)
      const blurred =
        doc.adjustments.blur > 0 ? blurImageData(imageData, doc.adjustments.blur) : imageData
      const adjusted = applyAdjustments(blurred, doc.adjustments)

      // Background = the bottom-most visible layer's resolved background
      let background = '#ffffff'
      const layers = doc.layers.map((layer) => {
        const res = runEngine({ imageData: adjusted, width, height, layer })
        return {
          id: layer.id,
          name: layer.name,
          type: layer.type,
          visible: layer.visible,
          opacity: layer.opacity,
          blendMode: layer.blendMode,
          result: res,
        }
      })
      const bottomVisible = layers.find((l) => l.visible)
      if (bottomVisible) background = bottomVisible.result.background

      if (seq !== seqRef.current) return
      setResult({ bounds: { width, height }, background, layers })
      onComputingChange?.(false)
    })

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [source, doc, onComputingChange])

  return result
}
