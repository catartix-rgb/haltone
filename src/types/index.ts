/**
 * Core domain types for Halftone Studio.
 *
 * Design principle: every parameter the user can tweak is a serializable
 * value — strings, numbers, enums. This lets us snapshot, share, and
 * preset the entire creative state with zero ambiguity.
 */

// ────────────────────────────────────────────────────────────────
//  Rendering modes
// ────────────────────────────────────────────────────────────────

export type RenderMode = 'halftone' | 'ascii' | 'dither' | 'dotgrid'

export type DotShape = 'circle' | 'square' | 'diamond' | 'line' | 'cross' | 'hex'

export type DitherAlgorithm =
  | 'floyd-steinberg'
  | 'atkinson'
  | 'bayer-2x2'
  | 'bayer-4x4'
  | 'bayer-8x8'
  | 'ordered'

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'difference'
  | 'exclusion'

// ────────────────────────────────────────────────────────────────
//  Image pre-processing
// ────────────────────────────────────────────────────────────────

export interface ImageAdjustments {
  brightness: number  // -100 .. 100
  contrast: number    // -100 .. 100
  threshold: number   // 0 .. 255
  blur: number        // 0 .. 20 (px)
  noise: number       // 0 .. 1
  invert: boolean
}

// ────────────────────────────────────────────────────────────────
//  Color system
// ────────────────────────────────────────────────────────────────

/** Tagged union — flat colors vs gradients vs duotone */
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
//  Halftone parameters
// ────────────────────────────────────────────────────────────────

export interface HalftoneParams {
  cellSize: number       // px — dot grid spacing (4 .. 60)
  dotScale: number       // 0..1.5 — multiplier on the maximum dot radius
  angle: number          // degrees — grid rotation
  shape: DotShape
  jitter: number         // 0..1 — randomness of dot position
  shapeRotation: number  // degrees — rotation applied to each shape (for line/square)
}

// ────────────────────────────────────────────────────────────────
//  ASCII parameters
// ────────────────────────────────────────────────────────────────

export interface AsciiParams {
  cellSize: number       // px per character cell
  charset: string        // e.g. " .:-=+*#%@" — sorted dark→light
  fontFamily: string
  fontWeight: number
  randomness: number     // 0..1 — chance of swapping for a similar-brightness char
  monospace: boolean
}

// ────────────────────────────────────────────────────────────────
//  Dither parameters
// ────────────────────────────────────────────────────────────────

export interface DitherParams {
  algorithm: DitherAlgorithm
  levels: number         // 2 .. 16 (palette depth)
  scale: number          // 1 .. 8 (output pixel size — chunkier when higher)
  serpentine: boolean    // serpentine scanning for error diffusion
}

// ────────────────────────────────────────────────────────────────
//  Project state — the full snapshot
// ────────────────────────────────────────────────────────────────

export interface SourceImage {
  /** Original file name */
  name: string
  /** Dimensions of the loaded image */
  width: number
  height: number
  /** A bitmap of the source — kept off the React tree, referenced by id */
  bitmapId: string
}

export interface ProjectState {
  mode: RenderMode
  adjustments: ImageAdjustments
  color: ColorMode
  blendMode: BlendMode
  halftone: HalftoneParams
  ascii: AsciiParams
  dither: DitherParams
  /** Output dimensions for export — independent from preview */
  output: {
    width: number
    height: number
    backgroundTransparent: boolean
  }
}

// ────────────────────────────────────────────────────────────────
//  Engine contract — every renderer implements this shape
// ────────────────────────────────────────────────────────────────

export interface EngineRenderArgs {
  imageData: ImageData
  width: number
  height: number
  project: ProjectState
}

/**
 * A primitive geometric instruction the SVG/Canvas renderers consume.
 * Keeping this intermediate representation lets us swap output targets
 * (SVG, Canvas, future PDF) without rewriting engines.
 */
export type RenderPrimitive =
  | {
      type: 'circle'
      cx: number
      cy: number
      r: number
      fill: string
      rotate?: number
    }
  | {
      type: 'rect'
      x: number
      y: number
      w: number
      h: number
      fill: string
      rotate?: number
    }
  | {
      type: 'line'
      x1: number
      y1: number
      x2: number
      y2: number
      stroke: string
      strokeWidth: number
    }
  | {
      type: 'path'
      d: string
      fill: string
    }
  | {
      type: 'text'
      x: number
      y: number
      content: string
      fill: string
      fontFamily: string
      fontSize: number
      fontWeight: number
    }

export interface RenderResult {
  primitives: RenderPrimitive[]
  /** Tight bounding box used for SVG viewBox */
  bounds: { width: number; height: number }
  /** Background color or 'transparent' */
  background: string
}
