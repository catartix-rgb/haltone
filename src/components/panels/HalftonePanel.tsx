'use client'

import { Section } from '@/components/ui/Section'
import { Slider } from '@/components/ui/Slider'
import { Segmented } from '@/components/ui/Segmented'
import { useAppStore } from '@/hooks/use-app-store'
import type { DotShape } from '@/types'

const SHAPES: ReadonlyArray<{ value: DotShape; label: string }> = [
  { value: 'circle', label: '●' },
  { value: 'square', label: '■' },
  { value: 'diamond', label: '◆' },
  { value: 'line', label: '╱' },
  { value: 'cross', label: '✚' },
  { value: 'hex', label: '⬢' },
]

export function HalftonePanel() {
  const h = useAppStore((s) => s.project.halftone)
  const patch = useAppStore((s) => s.patchHalftone)

  return (
    <Section title="Halftone" subtitle="dot matrix">
      <Slider
        label="Cell size"
        value={h.cellSize}
        onChange={(v) => patch({ cellSize: v })}
        min={3}
        max={60}
        unit="px"
      />
      <Slider
        label="Dot scale"
        value={h.dotScale}
        onChange={(v) => patch({ dotScale: v })}
        min={0.2}
        max={1.5}
        step={0.02}
        format={(v) => `${v.toFixed(2)}×`}
      />
      <Slider
        label="Angle"
        value={h.angle}
        onChange={(v) => patch({ angle: v })}
        min={0}
        max={180}
        unit="°"
      />
      <Slider
        label="Jitter"
        value={h.jitter}
        onChange={(v) => patch({ jitter: v })}
        min={0}
        max={1}
        step={0.01}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <Segmented
        label="Shape"
        value={h.shape}
        onChange={(v) => patch({ shape: v })}
        options={SHAPES}
      />
      {(h.shape === 'square' || h.shape === 'line' || h.shape === 'cross' || h.shape === 'diamond') && (
        <Slider
          label="Shape rotation"
          value={h.shapeRotation}
          onChange={(v) => patch({ shapeRotation: v })}
          min={0}
          max={180}
          unit="°"
        />
      )}
    </Section>
  )
}
