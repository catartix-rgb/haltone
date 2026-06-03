'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronUp, ChevronDown, Copy, Eye, EyeOff, Lock, LockOpen, Plus, Trash2, Layers as LayersIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '@/hooks/use-app-store'
import { Slider } from '@/components/ui/Slider'
import type { BlendMode, LayerType } from '@/types'
import { cn } from '@/lib/utils/cn'

const TYPE_OPTIONS: ReadonlyArray<{ value: LayerType; label: string }> = [
  { value: 'halftone', label: 'Halftone' },
  { value: 'ascii', label: 'ASCII' },
  { value: 'dither', label: 'Dither' },
]

const BLEND_OPTIONS: ReadonlyArray<BlendMode> = [
  'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'difference', 'color-dodge',
]

export function LayersPanel() {
  const doc = useAppStore((s) => s.doc)
  const s = useAppStore()
  const [open, setOpen] = useState(true)

  // Render top-to-bottom (reverse of storage order, which is bottom-up)
  const ordered = [...doc.layers].reverse()
  const active = doc.layers.find((l) => l.id === doc.selectedLayerId) ?? doc.layers[0]

  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2">
          <LayersIcon className="h-3.5 w-3.5 text-ink-800/70" />
          <span className="text-display text-base text-ink-900">Layers</span>
          <span className="text-mono-tight text-[10px] text-ink-700/60">{doc.layers.length}</span>
        </button>
        <div className="flex gap-1">
          <button onClick={() => s.addLayer('halftone')} title="Add layer"
            className="glass-faint flex h-6 w-6 items-center justify-center rounded-full text-ink-800 transition-all hover:glass">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => s.addCmyk()} title="Add CMYK split (4 layers)"
            className="glass-faint flex h-6 items-center justify-center rounded-full px-2 text-[9px] font-semibold text-ink-800 transition-all hover:glass">
            CMYK
          </button>
        </div>
      </header>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
            <div className="flex flex-col gap-1">
              {ordered.map((layer) => {
                const isActive = layer.id === doc.selectedLayerId
                return (
                  <div key={layer.id}
                    onClick={() => s.selectLayer(layer.id)}
                    className={cn(
                      'group flex items-center gap-1.5 rounded-xl px-2 py-1.5 transition-all cursor-pointer',
                      isActive ? 'glass-strong shadow-glass-sm' : 'glass-faint hover:glass',
                    )}>
                    <button onClick={(e) => { e.stopPropagation(); s.toggleVisible(layer.id) }}
                      className="text-ink-800/70 hover:text-ink-900">
                      {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); s.toggleLock(layer.id) }}
                      className="text-ink-800/70 hover:text-ink-900">
                      {layer.locked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3 opacity-40" />}
                    </button>
                    <input value={layer.name} onClick={(e) => e.stopPropagation()}
                      onChange={(e) => s.renameLayer(layer.id, e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-xs font-medium text-ink-800 outline-none" />
                    <span className="text-mono-tight text-[9px] uppercase text-ink-700/50">{layer.type.slice(0, 4)}</span>
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={(e) => { e.stopPropagation(); s.reorderLayer(layer.id, 'up') }} className="text-ink-800/60 hover:text-ink-900"><ChevronUp className="h-3 w-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); s.reorderLayer(layer.id, 'down') }} className="text-ink-800/60 hover:text-ink-900"><ChevronDown className="h-3 w-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); s.duplicateLayer(layer.id) }} className="text-ink-800/60 hover:text-ink-900"><Copy className="h-3 w-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); s.removeLayer(layer.id) }} className="text-ink-800/60 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Active layer controls */}
            <div className="mt-3 space-y-2.5 border-t border-white/30 pt-3">
              <div className="flex flex-col gap-1.5">
                <span className="label-eyebrow">Type</span>
                <div className="glass-faint flex gap-0.5 rounded-full p-0.5">
                  {TYPE_OPTIONS.map((t) => (
                    <button key={t.value} onClick={() => s.setLayerType(active.id, t.value)}
                      className={cn('flex-1 rounded-full px-2 py-1 text-[11px] font-medium transition-all',
                        active.type === t.value ? 'glass-strong text-ink-900 shadow-glass-sm' : 'text-ink-800/70 hover:text-ink-900')}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="label-eyebrow">Blend mode</span>
                <select value={active.blendMode} onChange={(e) => s.setLayerBlend(active.id, e.target.value as BlendMode)}
                  className="glass-faint w-full rounded-full px-3 py-1.5 text-xs text-ink-800 outline-none">
                  {BLEND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <Slider label="Opacity" value={active.opacity} onChange={(v) => s.setLayerOpacity(active.id, v)}
                min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
