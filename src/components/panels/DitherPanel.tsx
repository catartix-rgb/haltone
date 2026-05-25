'use client'

import { Section } from '@/components/ui/Section'
import { Slider } from '@/components/ui/Slider'
import { Segmented } from '@/components/ui/Segmented'
import { Toggle } from '@/components/ui/Toggle'
import { useAppStore } from '@/hooks/use-app-store'
import type { DitherAlgorithm } from '@/types'

const ALGOS: ReadonlyArray<{ value: DitherAlgorithm; label: string }> = [
  { value: 'floyd-steinberg', label: 'FS' },
  { value: 'atkinson', label: 'Atk' },
  { value: 'bayer-2x2', label: '2×2' },
  { value: 'bayer-4x4', label: '4×4' },
  { value: 'bayer-8x8', label: '8×8' },
]

export function DitherPanel() {
  const d = useAppStore((s) => s.project.dither)
  const patch = useAppStore((s) => s.patchDither)

  return (
    <Section title="Dither" subtitle="error diffusion">
      <Segmented
        label="Algorithm"
        value={d.algorithm}
        onChange={(v) => patch({ algorithm: v })}
        options={ALGOS}
      />
      <Slider
        label="Levels"
        value={d.levels}
        onChange={(v) => patch({ levels: v })}
        min={2}
        max={16}
      />
      <Slider
        label="Pixel scale"
        value={d.scale}
        onChange={(v) => patch({ scale: v })}
        min={1}
        max={10}
        unit="px"
      />
      {(d.algorithm === 'floyd-steinberg' || d.algorithm === 'atkinson') && (
        <Toggle
          label="Serpentine"
          checked={d.serpentine}
          onChange={(v) => patch({ serpentine: v })}
        />
      )}
    </Section>
  )
}
