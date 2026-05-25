import type { ImageAdjustments } from '@/types'
import { clamp } from '@/lib/utils/cn'

/**
 * Load an image File into an ImageBitmap.
 * createImageBitmap() decodes off the main thread when supported.
 */
export async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return await createImageBitmap(file, {
    imageOrientation: 'from-image',
    premultiplyAlpha: 'default',
    colorSpaceConversion: 'default',
  })
}

/**
 * Draw a bitmap onto an offscreen canvas at a target resolution
 * (capped so we don't run engines on a 12MP image needlessly).
 */
export function bitmapToImageData(
  bmp: ImageBitmap,
  maxSize: number,
): { imageData: ImageData; width: number; height: number } {
  const ratio = bmp.width / bmp.height
  let w = bmp.width
  let h = bmp.height
  if (Math.max(w, h) > maxSize) {
    if (ratio >= 1) {
      w = maxSize
      h = Math.round(maxSize / ratio)
    } else {
      h = maxSize
      w = Math.round(maxSize * ratio)
    }
  }
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, w, h)
  return { imageData: ctx.getImageData(0, 0, w, h), width: w, height: h }
}

/**
 * Apply brightness / contrast / threshold / invert in-place on RGBA data.
 *
 * We deliberately keep this synchronous and tight — it runs on every
 * preview frame.  Blur is heavier so it runs through Canvas's native filter.
 */
export function applyAdjustments(src: ImageData, adj: ImageAdjustments): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height)
  const d = out.data

  // Pre-compute curves
  const b = adj.brightness // -100..100
  const c = adj.contrast    // -100..100
  const contrastFactor = (259 * (c + 255)) / (255 * (259 - c))
  const useThreshold = adj.threshold > 0 && adj.threshold < 255
  const thr = adj.threshold
  const inv = adj.invert
  const noiseAmp = adj.noise * 60

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i]
    let g = d[i + 1]
    let bl = d[i + 2]

    // Brightness
    r += b
    g += b
    bl += b

    // Contrast (around 128)
    r = contrastFactor * (r - 128) + 128
    g = contrastFactor * (g - 128) + 128
    bl = contrastFactor * (bl - 128) + 128

    // Noise — light film grain
    if (noiseAmp > 0) {
      const n = (Math.random() - 0.5) * noiseAmp
      r += n
      g += n
      bl += n
    }

    // Threshold — push everything to one of two values
    if (useThreshold) {
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * bl
      const v = luma >= thr ? 255 : 0
      r = g = bl = v
    }

    // Invert
    if (inv) {
      r = 255 - r
      g = 255 - g
      bl = 255 - bl
    }

    d[i] = clamp(r, 0, 255)
    d[i + 1] = clamp(g, 0, 255)
    d[i + 2] = clamp(bl, 0, 255)
  }

  return out
}

/**
 * Gaussian blur via Canvas filter.  Heavier than the inline ops above
 * but visually high-quality and offloaded to the browser's native code.
 */
export function blurImageData(src: ImageData, radius: number): ImageData {
  if (radius <= 0) return src
  const canvas = new OffscreenCanvas(src.width, src.height)
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(src, 0, 0)
  // Re-draw self through the filter
  const tmp = new OffscreenCanvas(src.width, src.height)
  const tctx = tmp.getContext('2d')!
  tctx.filter = `blur(${radius}px)`
  tctx.drawImage(canvas, 0, 0)
  return tctx.getImageData(0, 0, src.width, src.height)
}
