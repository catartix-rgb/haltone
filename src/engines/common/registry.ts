import type { EngineRenderArgs, LayerType, RenderResult } from '@/types'
import { renderHalftone } from '@/engines/halftone/halftone'
import { renderAscii } from '@/engines/ascii/ascii'
import { renderDither } from '@/engines/dither/dither'

/**
 * Engine registry — dispatch by layer type. Adding a render mode means
 * adding a LayerType, writing the engine, and registering it here.
 */
const engines: Record<LayerType, (args: EngineRenderArgs) => RenderResult> = {
  halftone: renderHalftone,
  ascii: renderAscii,
  dither: renderDither,
}

export function runEngine(args: EngineRenderArgs): RenderResult {
  return engines[args.layer.type](args)
}
