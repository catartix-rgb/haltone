'use client'

import { useEffect, useState } from 'react'
import { Bookmark, Download, Trash2 } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/hooks/use-app-store'
import { deletePreset, exportPresetJson, listPresets, savePreset, type Preset } from '@/lib/presets'

export function PresetsPanel() {
  const doc = useAppStore((s) => s.doc)
  const loadDocument = useAppStore((s) => s.loadDocument)
  const [presets, setPresets] = useState<Preset[]>([])
  const [name, setName] = useState('')

  useEffect(() => { setPresets(listPresets()) }, [])

  const refresh = () => setPresets(listPresets())

  return (
    <Section title="Presets" subtitle="saved looks">
      <div className="flex items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Preset name"
          className="glass-faint w-full rounded-full px-3 py-1.5 text-xs text-ink-800 outline-none placeholder:text-ink-700/40" />
        <Button size="sm" variant="glass" icon={<Bookmark className="h-3.5 w-3.5" />}
          onClick={() => { if (!name.trim()) return; savePreset(name.trim(), doc); setName(''); refresh() }}>
          Save
        </Button>
      </div>

      {presets.length === 0 ? (
        <p className="text-[10px] leading-relaxed text-ink-700/50">No presets yet. Save the current layer stack to recall it on any image.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {presets.map((p) => (
            <div key={p.id} className="glass-faint group flex items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all hover:glass">
              <button onClick={() => loadDocument(p.doc)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-xs font-medium text-ink-800">{p.name}</div>
                <div className="text-mono-tight text-[9px] text-ink-700/50">{p.doc.layers.length} layers</div>
              </button>
              <button onClick={() => exportPresetJson(p)} title="Export JSON" className="text-ink-800/50 opacity-0 transition-opacity hover:text-ink-900 group-hover:opacity-100"><Download className="h-3 w-3" /></button>
              <button onClick={() => { deletePreset(p.id); refresh() }} title="Delete" className="text-ink-800/50 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}
