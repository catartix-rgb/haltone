import type { EngineRenderArgs, RenderMode, RenderResult } from '@/types'
import { renderHalftone } from '@/engines/halftone/halftone'
import { renderAscii } from '@/engines/ascii/ascii'
import { renderDither } from '@/engines/dither/dither'

/**
 * Engine registry — single source of dispatch.
 *
 * Adding a new render mode means: add a type to RenderMode, add the
 * engine function, register it here. Nothing else in the app changes.
 */
const engines: Record<RenderMode, (args: EngineRenderArgs) => RenderResult> = {
  halftone: renderHalftone,
  ascii: renderAscii,
  dither: renderDither,
  dotgrid: renderHalftone, // alias — same engine, different default params
}

export function runEngine(args: EngineRenderArgs): RenderResult {
  const fn = engines[args.project.mode]
  return fn(args)
}
