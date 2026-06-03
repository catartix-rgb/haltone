'use client'

import { Section } from '@/components/ui/Section'
import { Slider } from '@/components/ui/Slider'
import { Toggle } from '@/components/ui/Toggle'
import { useAppStore } from '@/hooks/use-app-store'

export function ImagePanel() {
  const adj = useAppStore((s) => s.doc.adjustments)
  const patch = useAppStore((s) => s.patchAdjustments)

  return (
    <Section title="Image" subtitle="global pre-process">
      <Slider label="Brightness" value={adj.brightness} onChange={(v) => patch({ brightness: v })} min={-100} max={100} />
      <Slider label="Contrast" value={adj.contrast} onChange={(v) => patch({ contrast: v })} min={-100} max={100} />
      <Slider label="Threshold" value={adj.threshold} onChange={(v) => patch({ threshold: v })} min={0} max={255} format={(v) => (v === 0 ? 'off' : v.toString())} />
      <Slider label="Blur" value={adj.blur} onChange={(v) => patch({ blur: v })} min={0} max={20} step={0.5} unit="px" />
      <Slider label="Noise" value={adj.noise} onChange={(v) => patch({ noise: v })} min={0} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />
      <Toggle label="Invert" checked={adj.invert} onChange={(v) => patch({ invert: v })} />
    </Section>
  )
}
