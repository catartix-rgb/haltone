import type {
  AsciiParams,
  ColorMode,
  DitherParams,
  DocumentState,
  HalftoneParams,
  ImageAdjustments,
  Layer,
  LayerType,
} from '@/types'

let layerCounter = 0
export function nextLayerId(): string {
  return `layer_${Date.now().toString(36)}_${(layerCounter++).toString(36)}`
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 10,
  threshold: 0,
  blur: 0,
  noise: 0,
  invert: false,
}

export const DEFAULT_HALFTONE: HalftoneParams = {
  cellSize: 12,
  dotScale: 1.0,
  angle: 45,
  shape: 'circle',
  jitter: 0,
  shapeRotation: 0,
  gamma: 1,
  contour: false,
}

export const DEFAULT_ASCII: AsciiParams = {
  cellSize: 14,
  charset: ' .:-=+*#%@',
  fontFamily: 'JetBrains Mono, ui-monospace, monospace',
  fontWeight: 600,
  randomness: 0,
  charRotation: 0,
  charScale: 1,
}

export const DEFAULT_DITHER: DitherParams = {
  algorithm: 'floyd-steinberg',
  levels: 2,
  scale: 3,
  serpentine: true,
  noise: 0,
  edgeEnhance: 0,
  distortion: 0,
}

const DUOTONE: ColorMode = {
  kind: 'duotone',
  shadow: '#0a0e1a',
  highlight: '#e0f2fe',
  background: '#f4f1ea',
}

/** Build a fresh layer of a given type with sensible defaults. */
export function createLayer(type: LayerType, name?: string): Layer {
  return {
    id: nextLayerId(),
    name: name ?? `${type[0].toUpperCase()}${type.slice(1)}`,
    type,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'normal',
    color: { ...DUOTONE },
    halftone: { ...DEFAULT_HALFTONE },
    ascii: { ...DEFAULT_ASCII },
    dither: { ...DEFAULT_DITHER },
  }
}

export function createDefaultDocument(): DocumentState {
  const base = createLayer('halftone', 'Halftone')
  return {
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    layers: [base],
    selectedLayerId: base.id,
    output: {
      width: 3840,
      height: 0,
      backgroundTransparent: false,
      dpi: 300,
      jpgQuality: 0.92,
    },
  }
}

/**
 * CMYK split — generates four angled halftone layers (the classic
 * screen-print angles) in cyan/magenta/yellow/black, blended with
 * multiply. This is "CMYK simulation" + "screen printing simulation"
 * expressed purely through the layer system.
 */
export function createCmykLayers(): Layer[] {
  const channels: Array<{ name: string; ink: string; angle: number }> = [
    { name: 'Cyan', ink: '#00aeef', angle: 15 },
    { name: 'Magenta', ink: '#ec008c', angle: 75 },
    { name: 'Yellow', ink: '#fff200', angle: 0 },
    { name: 'Black', ink: '#1a1a1a', angle: 45 },
  ]
  return channels.map((c, i) => {
    const layer = createLayer('halftone', c.name)
    layer.blendMode = 'multiply'
    layer.color = {
      kind: 'duotone',
      shadow: c.ink,
      highlight: '#ffffff',
      background: i === 0 ? '#ffffff' : '#ffffff',
    }
    layer.halftone = { ...DEFAULT_HALFTONE, angle: c.angle, cellSize: 8, dotScale: 1.1 }
    return layer
  })
}
