'use client'

import { motion } from 'framer-motion'
import { useCallback } from 'react'
import { PreviewCanvas } from '@/components/canvas/PreviewCanvas'
import { DropZone } from '@/components/canvas/DropZone'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { useAppStore } from '@/hooks/use-app-store'
import { useRenderPipeline } from '@/hooks/use-render-pipeline'

/**
 * Studio — the working surface.
 *
 * Composition:
 *   - TopBar fixed at the top (brand + mode + source info)
 *   - Sidebar fixed at the right (all parameter panels)
 *   - The center stage: either the DropZone (empty state) or the
 *     PreviewCanvas (working state) — surrounded by generous negative
 *     space so the artwork breathes
 */
export function Studio() {
  const source = useAppStore((s) => s.source)
  const project = useAppStore((s) => s.project)
  const computing = useAppStore((s) => s.computing)
  const setComputing = useAppStore((s) => s.setComputing)

  const onComputingChange = useCallback(
    (v: boolean) => setComputing(v),
    [setComputing],
  )

  const result = useRenderPipeline(source, project, onComputingChange)

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <div className="atmosphere" />

      <TopBar />

      {/* Stage — leaves room for sidebar on the right */}
      <div className="flex min-h-screen items-center justify-center px-6 pl-6 pr-[360px] pt-24 pb-8">
        <div className="relative w-full max-w-[1100px]">
          {!source ? (
            <DropZone />
          ) : (
            <motion.div
              key="canvas-stage"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* Frame — a faint glass plate behind the artwork */}
              <div
                className={`glass-faint relative overflow-hidden rounded-3xl p-4 transition-all duration-700 ${
                  computing ? 'iridescent-ring' : ''
                }`}
              >
                {project.output.backgroundTransparent && (
                  <div className="absolute inset-4 rounded-2xl checkered-bg" />
                )}
                <div className="relative flex items-center justify-center">
                  <PreviewCanvas
                    result={result}
                    showTransparency={project.output.backgroundTransparent}
                    className="rounded-2xl shadow-glass-md"
                  />
                </div>
              </div>

              {/* Stats strip */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="glass-faint mx-auto mt-4 flex w-fit items-center gap-4 rounded-full px-4 py-2"
                >
                  <span className="label-eyebrow">Primitives</span>
                  <span className="text-mono-tight text-xs text-ink-800 tabular-nums">
                    {result.primitives.length.toLocaleString()}
                  </span>
                  <span className="h-3 w-px bg-white/30" />
                  <span className="label-eyebrow">Canvas</span>
                  <span className="text-mono-tight text-xs text-ink-800 tabular-nums">
                    {result.bounds.width} × {result.bounds.height}
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <Sidebar result={result} />
    </main>
  )
}
