'use client'

import { useEffect, useRef, useState } from 'react'
import type { ProjectState, RenderResult, SourceImage } from '@/types'
import { getBitmap } from '@/lib/image/bitmap-store'
import {
  applyAdjustments,
  bitmapToImageData,
  blurImageData,
} from '@/lib/image/processing'
import { runEngine } from '@/engines/common/registry'

/**
 * useRenderPipeline
 *
 * Watches (source, project) and produces a RenderResult.
 * Heavy work is debounced (frame-level) and runs through
 * requestIdleCallback when available so dragging a slider stays buttery.
 *
 * In a future iteration the engine call moves into a Web Worker via
 * Comlink — the public API of this hook doesn't change.
 */
const PREVIEW_MAX_SIZE = 1024 // px on the longest edge — keeps preview fast

export function useRenderPipeline(
  source: SourceImage | null,
  project: ProjectState,
  onComputingChange?: (v: boolean) => void,
): RenderResult | null {
  const [result, setResult] = useState<RenderResult | null>(null)
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

    // Bump sequence — any in-flight job becomes stale
    const seq = ++seqRef.current
    onComputingChange?.(true)

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      // Decode the source bitmap → ImageData at preview size
      const { imageData, width, height } = bitmapToImageData(bmp, PREVIEW_MAX_SIZE)

      // Apply blur first (Canvas filter), then per-pixel ops
      const blurred =
        project.adjustments.blur > 0
          ? blurImageData(imageData, project.adjustments.blur)
          : imageData
      const adjusted = applyAdjustments(blurred, project.adjustments)

      const out = runEngine({
        imageData: adjusted,
        width,
        height,
        project,
      })

      // Discard if a newer job started while we worked
      if (seq !== seqRef.current) return
      setResult(out)
      onComputingChange?.(false)
    })

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [source, project, onComputingChange])

  return result
}
