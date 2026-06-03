'use client'

import { motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import { PreviewCanvas } from '@/components/canvas/PreviewCanvas'
import { SourcePreview } from '@/components/canvas/SourcePreview'
import { DropZone } from '@/components/canvas/DropZone'
import { Sidebar } from '@/components/Sidebar'
import { LayersDock } from '@/components/LayersDock'
import { TopBar } from '@/components/TopBar'
import { useAppStore } from '@/hooks/use-app-store'
import { useRenderPipeline } from '@/hooks/use-render-pipeline'

/**
 * Studio — the workspace.
 *   · TopBar (top) — brand, before/after, source
 *   · LayersDock (left) — the layer stack
 *   · Sidebar (right) — inspector for the active layer + export
 *   · Center stage — the live composite, with breathing room
 */
export function Studio() {
  const source = useAppStore((s) => s.source)
  const doc = useAppStore((s) => s.doc)
  const computing = useAppStore((s) => s.computing)
  const setComputing = useAppStore((s) => s.setComputing)
  const [showSource, setShowSource] = useState(false)

  const onComputingChange = useCallback((v: boolean) => setComputing(v), [setComputing])
  const result = useRenderPipeline(source, doc, onComputingChange)
  const transparent = doc.output.backgroundTransparent

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <div className="atmosphere" />

      <TopBar showSource={showSource} onToggleSource={setShowSource} />

      <div className="flex min-h-screen items-center justify-center px-6 pl-[296px] pr-[360px] pt-24 pb-8">
        <div className="relative w-full max-w-[1000px]">
          {!source ? (
            <DropZone />
          ) : (
            <motion.div key="canvas-stage" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="relative">
              <div className={`glass-faint relative overflow-hidden rounded-3xl p-4 transition-all duration-700 ${computing ? 'iridescent-ring' : ''}`}>
                {transparent && !showSource && <div className="absolute inset-4 rounded-2xl checkered-bg" />}
                <div className="relative flex items-center justify-center">
                  {showSource ? (
                    <SourcePreview bitmapId={source.bitmapId} className="rounded-2xl shadow-glass-md" />
                  ) : (
                    <PreviewCanvas result={result} showTransparency={transparent} className="rounded-2xl shadow-glass-md" />
                  )}
                </div>
              </div>

              {result && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
                  className="glass-faint mx-auto mt-4 flex w-fit items-center gap-4 rounded-full px-4 py-2">
                  <span className="label-eyebrow">Layers</span>
                  <span className="text-mono-tight text-xs text-ink-800 tabular-nums">{result.layers.filter((l) => l.visible).length}/{result.layers.length}</span>
                  <span className="h-3 w-px bg-white/30" />
                  <span className="label-eyebrow">Primitives</span>
                  <span className="text-mono-tight text-xs text-ink-800 tabular-nums">
                    {result.layers.reduce((n, l) => n + (l.visible ? l.result.primitives.length : 0), 0).toLocaleString()}
                  </span>
                  <span className="h-3 w-px bg-white/30" />
                  <span className="label-eyebrow">Canvas</span>
                  <span className="text-mono-tight text-xs text-ink-800 tabular-nums">{result.bounds.width} × {result.bounds.height}</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {source && <LayersDock />}
      <Sidebar result={result} />
    </main>
  )
}
