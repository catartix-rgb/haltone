'use client'

import { Section } from '@/components/ui/Section'
import { Slider } from '@/components/ui/Slider'
import { useAppStore } from '@/hooks/use-app-store'
import { useActiveLayer } from '@/hooks/use-active-layer'

const CHARSETS = [
  { label: 'Classic', value: ' .:-=+*#%@' },
  { label: 'Dense', value: ' .`,:;i1tfLCG08@' },
  { label: 'Blocks', value: ' ░▒▓█' },
  { label: 'Lines', value: ' ─│┼╳▩■' },
  { label: 'Bullets', value: ' ·•●○◐◑◯' },
]

const FONTS = [
  { label: 'Mono', value: 'JetBrains Mono, ui-monospace, monospace' },
  { label: 'Sans', value: 'Geist, system-ui, sans-serif' },
  { label: 'Serif', value: 'Instrument Serif, serif' },
]

export function AsciiPanel() {
  const a = useActiveLayer().ascii
  const patch = useAppStore((s) => s.patchAscii)

  return (
    <Section title="ASCII" subtitle="glyph density">
      <Slider label="Cell size" value={a.cellSize} onChange={(v) => patch({ cellSize: v })} min={4} max={40} unit="px" />
      <Slider label="Randomness" value={a.randomness} onChange={(v) => patch({ randomness: v })} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
      <Slider label="Char rotation" value={a.charRotation} onChange={(v) => patch({ charRotation: v })} min={0} max={360} unit="°" />
      <Slider label="Char scale" value={a.charScale} onChange={(v) => patch({ charScale: v })} min={0.5} max={1.5} step={0.02} format={(v) => `${v.toFixed(2)}×`} />
      <Slider label="Weight" value={a.fontWeight} onChange={(v) => patch({ fontWeight: v })} min={100} max={900} step={100} />

      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Font</span>
        <div className="glass-faint flex gap-0.5 rounded-full p-0.5">
          {FONTS.map((f) => (
            <button key={f.label} onClick={() => patch({ fontFamily: f.value })}
              className={`flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-all ${a.fontFamily === f.value ? 'glass-strong text-ink-900 shadow-glass-sm' : 'text-ink-800/70 hover:text-ink-900'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Charset</span>
        <div className="glass-faint flex flex-col gap-0.5 rounded-2xl p-1">
          {CHARSETS.map((c) => (
            <button key={c.label} onClick={() => patch({ charset: c.value })}
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left transition-all ${a.charset === c.value ? 'glass-strong shadow-glass-sm' : 'hover:bg-white/20'}`}>
              <span className="text-xs font-medium text-ink-800">{c.label}</span>
              <span className="text-mono-tight text-[11px] text-ink-700/70">{c.value}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Custom charset (dark → light)</span>
        <input type="text" value={a.charset} onChange={(e) => patch({ charset: e.target.value })}
          className="glass-faint text-mono-tight w-full rounded-full px-3 py-2 text-xs text-ink-800 outline-none" spellCheck={false} />
      </div>
    </Section>
  )
}
