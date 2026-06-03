'use client'

import { Section } from '@/components/ui/Section'
import { Slider } from '@/components/ui/Slider'
import { Segmented } from '@/components/ui/Segmented'
import { Toggle } from '@/components/ui/Toggle'
import { useAppStore } from '@/hooks/use-app-store'
import { useActiveLayer } from '@/hooks/use-active-layer'
import type { DotShape } from '@/types'

const SHAPES: ReadonlyArray<{ value: DotShape; label: string }> = [
  { value: 'circle', label: '●' },
  { value: 'square', label: '■' },
  { value: 'diamond', label: '◆' },
  { value: 'triangle', label: '▲' },
  { value: 'line', label: '╱' },
  { value: 'cross', label: '✚' },
  { value: 'hex', label: '⬢' },
]

export function HalftonePanel() {
  const h = useActiveLayer().halftone
  const patch = useAppStore((s) => s.patchHalftone)

  return (
    <Section title="Halftone" subtitle="dot matrix">
      <Slider label="Cell size" value={h.cellSize} onChange={(v) => patch({ cellSize: v })} min={3} max={60} unit="px" />
      <Slider label="Dot scale" value={h.dotScale} onChange={(v) => patch({ dotScale: v })} min={0.2} max={1.5} step={0.02} format={(v) => `${v.toFixed(2)}×`} />
      <Slider label="Angle" value={h.angle} onChange={(v) => patch({ angle: v })} min={0} max={180} unit="°" />
      <Slider label="Growth curve" value={h.gamma} onChange={(v) => patch({ gamma: v })} min={0.2} max={3} step={0.05} format={(v) => `γ${v.toFixed(2)}`} />
      <Slider label="Jitter" value={h.jitter} onChange={(v) => patch({ jitter: v })} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
      <Segmented label="Shape" value={h.shape} onChange={(v) => patch({ shape: v })} options={SHAPES} />
      {h.shape !== 'circle' && h.shape !== 'hex' && (
        <Slider label="Shape rotation" value={h.shapeRotation} onChange={(v) => patch({ shapeRotation: v })} min={0} max={180} unit="°" />
      )}
      <Toggle label="Vector contour" checked={h.contour} onChange={(v) => patch({ contour: v })} />
    </Section>
  )
}
