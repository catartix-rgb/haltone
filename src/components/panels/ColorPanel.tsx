'use client'

import { Section } from '@/components/ui/Section'
import { Segmented } from '@/components/ui/Segmented'
import { ColorField } from '@/components/ui/ColorField'
import { useAppStore } from '@/hooks/use-app-store'
import type { ColorMode } from '@/types'
import { DUOTONE_PRESETS, PALETTE_PRESETS } from '@/lib/color/color'

type Kind = ColorMode['kind']

const KINDS: ReadonlyArray<{ value: Kind; label: string }> = [
  { value: 'solid', label: 'Solid' },
  { value: 'duotone', label: 'Duo' },
  { value: 'tritone', label: 'Tri' },
  { value: 'gradient', label: 'Grad' },
]

export function ColorPanel() {
  const color = useAppStore((s) => s.project.color)
  const patch = useAppStore((s) => s.patchColor)

  const setKind = (kind: Kind) => {
    if (kind === color.kind) return
    if (kind === 'solid') {
      patch({ kind: 'solid', foreground: '#0a0e1a', background: '#f4f1ea' })
    } else if (kind === 'duotone') {
      patch({ kind: 'duotone', shadow: '#0a0e1a', highlight: '#e0f2fe', background: '#f4f1ea' })
    } else if (kind === 'tritone') {
      patch({
        kind: 'tritone',
        shadow: '#1e1b4b',
        mid: '#7c3aed',
        highlight: '#fce7f3',
        background: '#fdf4ff',
      })
    } else if (kind === 'gradient') {
      patch({
        kind: 'gradient',
        stops: [
          { offset: 0, color: '#e0f2fe' },
          { offset: 0.5, color: '#06b6d4' },
          { offset: 1, color: '#0c4a6e' },
        ],
        angle: 0,
        background: '#f4f1ea',
      })
    }
  }

  return (
    <Section title="Color" subtitle="palette">
      <Segmented value={color.kind} onChange={setKind} options={KINDS} />

      {/* Presets row — quick way to seed a look */}
      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Presets</span>
        <div className="flex flex-wrap gap-1.5">
          {(color.kind === 'duotone' ? DUOTONE_PRESETS : PALETTE_PRESETS).map((p) => (
            <button
              key={p.name}
              onClick={() => {
                if (color.kind === 'duotone' && 'shadow' in p) {
                  patch({
                    kind: 'duotone',
                    shadow: p.shadow,
                    highlight: p.highlight,
                    background: p.bg,
                  })
                } else if ('fg' in p) {
                  if (color.kind === 'solid') {
                    patch({ kind: 'solid', foreground: p.fg, background: p.bg })
                  } else {
                    patch({ ...color, background: p.bg } as ColorMode)
                  }
                }
              }}
              className="glass-faint rounded-full px-2.5 py-1 text-[11px] font-medium text-ink-800 transition-all hover:glass"
            >
              <span className="mr-1.5 inline-flex gap-0.5 align-middle">
                {'shadow' in p ? (
                  <>
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.shadow }} />
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.highlight }} />
                  </>
                ) : (
                  <>
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.fg }} />
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.bg }} />
                  </>
                )}
              </span>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Fields per kind */}
      {color.kind === 'solid' && (
        <>
          <ColorField
            label="Foreground"
            value={color.foreground}
            onChange={(v) => patch({ ...color, foreground: v })}
          />
          <ColorField
            label="Background"
            value={color.background}
            onChange={(v) => patch({ ...color, background: v })}
          />
        </>
      )}

      {color.kind === 'duotone' && (
        <>
          <ColorField label="Shadow" value={color.shadow} onChange={(v) => patch({ ...color, shadow: v })} />
          <ColorField
            label="Highlight"
            value={color.highlight}
            onChange={(v) => patch({ ...color, highlight: v })}
          />
          <ColorField
            label="Background"
            value={color.background}
            onChange={(v) => patch({ ...color, background: v })}
          />
        </>
      )}

      {color.kind === 'tritone' && (
        <>
          <ColorField label="Shadow" value={color.shadow} onChange={(v) => patch({ ...color, shadow: v })} />
          <ColorField label="Mid" value={color.mid} onChange={(v) => patch({ ...color, mid: v })} />
          <ColorField
            label="Highlight"
            value={color.highlight}
            onChange={(v) => patch({ ...color, highlight: v })}
          />
          <ColorField
            label="Background"
            value={color.background}
            onChange={(v) => patch({ ...color, background: v })}
          />
        </>
      )}

      {color.kind === 'gradient' && (
        <>
          {color.stops.map((stop, i) => (
            <ColorField
              key={i}
              label={`Stop ${i + 1}`}
              value={stop.color}
              onChange={(v) => {
                const stops = color.stops.map((s, j) => (j === i ? { ...s, color: v } : s))
                patch({ ...color, stops })
              }}
            />
          ))}
          <ColorField
            label="Background"
            value={color.background}
            onChange={(v) => patch({ ...color, background: v })}
          />
        </>
      )}
    </Section>
  )
}
