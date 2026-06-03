'use client'

import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { DropZone } from '@/components/canvas/DropZone'
import { useAppStore } from '@/hooks/use-app-store'

/**
 * TopBar — brand, before/after compare toggle, source info.
 * Mode is now chosen per-layer in the Layers dock, so the old global
 * mode switch is gone; the top bar focuses on document-level controls.
 */
export function TopBar({
  showSource,
  onToggleSource,
}: {
  showSource: boolean
  onToggleSource: (v: boolean) => void
}) {
  const source = useAppStore((s) => s.source)

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-4">
      <div className="glass pointer-events-auto flex w-full max-w-[1400px] items-center gap-4 rounded-full px-3 py-2 shadow-glass-md">
        <div className="flex items-center gap-2 pl-2">
          <div className="relative h-5 w-5">
            <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 0deg, oklch(80% 0.13 200), oklch(85% 0.10 160), oklch(80% 0.13 280), oklch(80% 0.13 200))' }} />
            <div className="absolute inset-1 rounded-full bg-white/80" />
            <div className="absolute inset-[5px] rounded-full" style={{ background: 'oklch(20% 0.03 240)' }} />
          </div>
          <div className="leading-tight">
            <div className="text-display text-sm text-ink-900">Halftone</div>
            <div className="text-mono-tight text-[8px] uppercase tracking-[0.2em] text-ink-700/60">studio · 0.2</div>
          </div>
        </div>

        <div className="flex-1" />

        {source && (
          <div className="flex items-center gap-3">
            {/* Before / After — hold to compare */}
            <button
              onMouseDown={() => onToggleSource(true)}
              onMouseUp={() => onToggleSource(false)}
              onMouseLeave={() => onToggleSource(false)}
              onTouchStart={() => onToggleSource(true)}
              onTouchEnd={() => onToggleSource(false)}
              className={`glass-faint flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium text-ink-800 transition-all hover:glass ${showSource ? 'iridescent-ring' : ''}`}>
              <Eye className="h-3.5 w-3.5" />
              {showSource ? 'Original' : 'Compare'}
            </button>

            <div className="hidden items-center gap-3 md:flex">
              <div className="text-mono-tight text-right text-[10px] leading-tight text-ink-700/70">
                <div className="font-medium text-ink-800">{source.name}</div>
                <div>{source.width} × {source.height}</div>
              </div>
              <DropZone compact />
            </div>
          </div>
        )}
      </div>
    </motion.header>
  )
}
