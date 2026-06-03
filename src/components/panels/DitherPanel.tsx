'use client'

import { Section } from '@/components/ui/Section'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'
import { useAppStore } from '@/hooks/use-app-store'
import { useActiveLayer } from '@/hooks/use-active-layer'
import type { DitherAlgorithm } from '@/types'

const ALGOS: ReadonlyArray<{ value: DitherAlgorithm; label: string }> = [
  { value: 'floyd-steinberg', label: 'Floyd–Steinberg' },
  { value: 'atkinson', label: 'Atkinson' },
  { value: 'jarvis', label: 'Jarvis' },
  { value: 'stucki', label: 'Stucki' },
  { value: 'sierra', label: 'Sierra' },
  { value: 'bayer-2x2', label: 'Bayer 2×2' },
  { value: 'bayer-4x4', label: 'Bayer 4×4' },
  { value: 'bayer-8x8', label: 'Bayer 8×8' },
]

export function DitherPanel() {
  const d = useActiveLayer().dither
  const patch = useAppStore((s) => s.patchDither)
  const isDiffusion = !d.algorithm.startsWith('bayer')

  return (
    <Section title="Dither" subtitle="error diffusion">
      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Algorithm</span>
        <div className="glass-faint grid grid-cols-2 gap-0.5 rounded-2xl p-1">
          {ALGOS.map((a) => (
            <button key={a.value} onClick={() => patch({ algorithm: a.value })}
              className={`rounded-xl px-2 py-1.5 text-[11px] font-medium transition-all ${d.algorithm === a.value ? 'glass-strong text-ink-900 shadow-glass-sm' : 'text-ink-800/70 hover:text-ink-900'}`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <Slider label="Levels" value={d.levels} onChange={(v) => patch({ levels: v })} min={2} max={16} />
      <Slider label="Pixel scale" value={d.scale} onChange={(v) => patch({ scale: v })} min={1} max={10} unit="px" />
      <Slider label="Noise" value={d.noise} onChange={(v) => patch({ noise: v })} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
      <Slider label="Edge enhance" value={d.edgeEnhance} onChange={(v) => patch({ edgeEnhance: v })} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
      <Slider label="Distortion" value={d.distortion} onChange={(v) => patch({ distortion: v })} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
      {isDiffusion && <Toggle label="Serpentine" checked={d.serpentine} onChange={(v) => patch({ serpentine: v })} />}
    </Section>
  )
}
