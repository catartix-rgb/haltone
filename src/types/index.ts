/**
 * Core domain types for Halftone Studio.
 *
 * The app is built around a LAYER MODEL: a Document holds an ordered
 * stack of Layers, each with its own engine, parameters, color, blend
 * mode and opacity. Layers composite top-to-bottom — exactly like
 * Photoshop / Illustrator. This is what turns the tool from a "filter"
 * into a real creative instrument.
 *
 * Every parameter is a serializable value (string / number / enum) so
 * the whole document can be snapshotted into a preset with zero loss.
 */

// ────────────────────────────────────────────────────────────────
//  Engine / layer kinds
// ────────────────────────────────────────────────────────────────

export type LayerType = 'halftone' | 'ascii' | 'dither'

export type DotShape =
  | 'circle'
  | 'square'
  | 'diamond'
  | 'triangle'
  | 'line'
  | 'cross'
  | 'hex'

export type DitherAlgorithm =
  | 'floyd-steinberg'
  | 'atkinson'
  | 'jarvis'
  | 'stucki'
  | 'sierra'
  | 'bayer-2x2'
  | 'bayer-4x4'
  | 'bayer-8x8'

/** Names map 1:1 to Canvas globalCompositeOperation & CSS mix-blend-mode */
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'difference'
  | 'color-dodge'

// ────────────────────────────────────────────────────────────────
//  Image pre-processing (document-global)
// ────────────────────────────────────────────────────────────────

export interface ImageAdjustments {
  brightness: number  // -100 .. 100
  contrast: number    // -100 .. 100
  threshold: number   // 0 .. 255 (0 = off)
  blur: number        // 0 .. 20 (px)
  noise: number       // 0 .. 1
  invert: boolean
}

// ────────────────────────────────────────────────────────────────
//  Color system
// ────────────────────────────────────────────────────────────────

export type ColorMode =
  | { kind: 'solid'; foreground: string; background: string }
  | { kind: 'duotone'; shadow: string; highlight: string; background: string }
  | { kind: 'tritone'; shadow: string; mid: string; highlight: string; background: string }
  | {
      kind: 'gradient'
      stops: Array<{ offset: number; color: string }>
      angle: number
      background: string
    }

// ────────────────────────────────────────────────────────────────
//  Per-engine parameters
// ────────────────────────────────────────────────────────────────

export interface HalftoneParams {
  cellSize: number       // px — dot grid spacing (3 .. 60)
  dotScale: number       // 0.2 .. 1.5 — multiplier on max dot radius
  angle: number          // degrees — grid rotation
  shape: DotShape
  jitter: number         // 0..1 — random position offset
  shapeRotation: number  // degrees — per-shape rotation
  gamma: number          // 0.2 .. 3 — dot growth curve (1 = linear)
  contour: boolean       // vector contour mode (stroke, no fill)
  /** Optional uploaded custom SVG path data, used when shape === 'custom' */
  customPath?: string
}

export interface AsciiParams {
  cellSize: number       // px per character cell
  charset: string        // " .:-=+*#%@" sorted dark→light
  fontFamily: string
  fontWeight: number
  randomness: number     // 0..1
  charRotation: number   // degrees — rotate each glyph
  charScale: number      // 0.5 .. 1.5 — glyph scale within its cell
}

export interface DitherParams {
  algorithm: DitherAlgorithm
  levels: number         // 2 .. 16
  scale: number          // 1 .. 10 (output pixel size)
  serpentine: boolean
  noise: number          // 0..1 — pre-dither noise injection
  edgeEnhance: number    // 0..1 — sharpen pass before quantization
  distortion: number     // 0..1 — organic sample displacement
}

// ────────────────────────────────────────────────────────────────
//  Layer + Document
// ────────────────────────────────────────────────────────────────

export interface Layer {
  id: string
  name: string
  type: LayerType
  visible: boolean
  locked: boolean
  opacity: number        // 0..1
  blendMode: BlendMode
  color: ColorMode
  halftone: HalftoneParams
  ascii: AsciiParams
  dither: DitherParams
}

export interface SourceImage {
  name: string
  width: number
  height: number
  bitmapId: string
}

export interface OutputSettings {
  width: number
  height: number          // 0 = auto (preserve aspect)
  backgroundTransparent: boolean
  dpi: number             // 72 / 150 / 300 / 600
  jpgQuality: number      // 0..1
}

export interface DocumentState {
  adjustments: ImageAdjustments
  layers: Layer[]         // index 0 = BOTTOM of the stack
  selectedLayerId: string
  output: OutputSettings
}

// ────────────────────────────────────────────────────────────────
//  Engine contract
// ────────────────────────────────────────────────────────────────

export interface EngineRenderArgs {
  imageData: ImageData
  width: number
  height: number
  layer: Layer
}

export type RenderPrimitive =
  | { type: 'circle'; cx: number; cy: number; r: number; fill: string; stroke?: string; strokeWidth?: number }
  | { type: 'rect'; x: number; y: number; w: number; h: number; fill: string; rotate?: number }
  | { type: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth: number }
  | { type: 'path'; d: string; fill: string; stroke?: string; strokeWidth?: number }
  | {
      type: 'text'
      x: number
      y: number
      content: string
      fill: string
      fontFamily: string
      fontSize: number
      fontWeight: number
      rotate?: number
    }

export interface RenderResult {
  primitives: RenderPrimitive[]
  bounds: { width: number; height: number }
  background: string
}

/** Output of the full pipeline — one RenderResult per layer, plus metadata */
export interface CompositeResult {
  bounds: { width: number; height: number }
  background: string
  layers: Array<{
    id: string
    name: string
    type: LayerType
    visible: boolean
    opacity: number
    blendMode: BlendMode
    result: RenderResult
  }>
}
