'use client'

import { Section } from '@/components/ui/Section'
import { Slider } from '@/components/ui/Slider'
import { useAppStore } from '@/hooks/use-app-store'

const CHARSETS = [
  { label: 'Classic', value: ' .:-=+*#%@' },
  { label: 'Dense', value: ' .`,:;i1tfLCG08@' },
  { label: 'Blocks', value: ' ░▒▓█' },
  { label: 'Lines', value: ' ─│┼╳▩■' },
  { label: 'Bullets', value: ' ·•●○◐◑◯' },
]

export function AsciiPanel() {
  const a = useAppStore((s) => s.project.ascii)
  const patch = useAppStore((s) => s.patchAscii)

  return (
    <Section title="ASCII" subtitle="glyph density">
      <Slider
        label="Cell size"
        value={a.cellSize}
        onChange={(v) => patch({ cellSize: v })}
        min={4}
        max={40}
        unit="px"
      />
      <Slider
        label="Randomness"
        value={a.randomness}
        onChange={(v) => patch({ randomness: v })}
        min={0}
        max={1}
        step={0.01}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <Slider
        label="Weight"
        value={a.fontWeight}
        onChange={(v) => patch({ fontWeight: v })}
        min={100}
        max={900}
        step={100}
      />

      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Charset</span>
        <div className="glass-faint flex flex-col gap-0.5 rounded-2xl p-1">
          {CHARSETS.map((c) => (
            <button
              key={c.label}
              onClick={() => patch({ charset: c.value })}
              className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left transition-all ${
                a.charset === c.value ? 'glass-strong shadow-glass-sm' : 'hover:bg-white/20'
              }`}
            >
              <span className="text-xs font-medium text-ink-800">{c.label}</span>
              <span className="text-mono-tight text-[11px] text-ink-700/70">{c.value}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Custom charset (dark → light)</span>
        <input
          type="text"
          value={a.charset}
          onChange={(e) => patch({ charset: e.target.value })}
          className="glass-faint text-mono-tight w-full rounded-full px-3 py-2 text-xs text-ink-800 outline-none"
          spellCheck={false}
        />
      </div>
    </Section>
  )
}
