import type { ProjectState } from '@/types'

export const DEFAULT_PROJECT: ProjectState = {
  mode: 'halftone',
  adjustments: {
    brightness: 0,
    contrast: 10,
    threshold: 0,
    blur: 0,
    noise: 0,
    invert: false,
  },
  color: {
    kind: 'duotone',
    shadow: '#0a0e1a',
    highlight: '#e0f2fe',
    background: '#f4f1ea',
  },
  blendMode: 'normal',
  halftone: {
    cellSize: 12,
    dotScale: 1.0,
    angle: 45,
    shape: 'circle',
    jitter: 0,
    shapeRotation: 0,
  },
  ascii: {
    cellSize: 14,
    charset: ' .:-=+*#%@',
    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
    fontWeight: 600,
    randomness: 0,
    monospace: true,
  },
  dither: {
    algorithm: 'floyd-steinberg',
    levels: 2,
    scale: 3,
    serpentine: true,
  },
  output: {
    width: 3840,
    height: 0, // 0 means "auto / preserve aspect ratio"
    backgroundTransparent: false,
  },
}
