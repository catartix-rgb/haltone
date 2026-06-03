'use client'

import { useState } from 'react'
import { Download, FileImage, FileType } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Slider } from '@/components/ui/Slider'
import { useAppStore } from '@/hooks/use-app-store'
import { exportRaster, exportSvg, PNG_PRESETS } from '@/lib/export/export'
import type { CompositeResult } from '@/types'

export function ExportPanel({ result }: { result: CompositeResult | null }) {
  const output = useAppStore((s) => s.doc.output)
  const patch = useAppStore((s) => s.patchOutput)
  const [customW, setCustomW] = useState(output.width)
  const disabled = !result

  const stamp = () => Date.now()

  return (
    <Section title="Export" subtitle="output">
      <Toggle label="Transparent BG" checked={output.backgroundTransparent} onChange={(v) => patch({ backgroundTransparent: v })} />

      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Vector</span>
        <Button disabled={disabled}
          onClick={() => result && exportSvg(result, { transparent: output.backgroundTransparent, filename: `halftone-studio-${stamp()}.svg` })}
          icon={<Download className="h-4 w-4" />} variant="glass" className="w-full justify-center">
          Export SVG
        </Button>
        <p className="text-[10px] leading-relaxed text-ink-700/60">Layered, editable in Illustrator · Figma · Affinity.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">PNG raster</span>
        <div className="grid grid-cols-2 gap-1.5">
          {PNG_PRESETS.map((p) => (
            <Button key={p.label} disabled={disabled}
              onClick={() => result && exportRaster(result, { format: 'png', width: p.width, transparent: output.backgroundTransparent, filename: `halftone-${p.label}-${stamp()}.png` })}
              variant="glass" size="sm" icon={<FileImage className="h-3.5 w-3.5" />}>
              <span className="text-mono-tight">{p.label}</span>
              <span className="text-[10px] text-ink-700/60">{p.width}px</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Custom size</span>
        <div className="flex items-center gap-2">
          <input type="number" value={customW} min={64} max={16384}
            onChange={(e) => setCustomW(Math.max(64, Math.min(16384, +e.target.value || 0)))}
            className="glass-faint text-mono-tight w-full rounded-full px-3 py-1.5 text-xs text-ink-800 outline-none" />
          <span className="text-mono-tight text-[10px] text-ink-700/60">px wide</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Button disabled={disabled} onClick={() => result && exportRaster(result, { format: 'png', width: customW, transparent: output.backgroundTransparent, filename: `halftone-${customW}px-${stamp()}.png` })} variant="glass" size="sm">PNG</Button>
          <Button disabled={disabled} onClick={() => result && exportRaster(result, { format: 'jpeg', width: customW, quality: output.jpgQuality, filename: `halftone-${customW}px-${stamp()}.jpg` })} variant="glass" size="sm" icon={<FileType className="h-3.5 w-3.5" />}>JPG</Button>
        </div>
      </div>

      <Slider label="JPG quality" value={output.jpgQuality} onChange={(v) => patch({ jpgQuality: v })} min={0.4} max={1} step={0.01} format={(v) => `${Math.round(v * 100)}%`} />

      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Print DPI</span>
        <div className="glass-faint flex gap-0.5 rounded-full p-0.5">
          {[72, 150, 300, 600].map((d) => (
            <button key={d} onClick={() => patch({ dpi: d })}
              className={`flex-1 rounded-full px-2 py-1 text-[11px] font-medium transition-all ${output.dpi === d ? 'glass-strong text-ink-900 shadow-glass-sm' : 'text-ink-800/70 hover:text-ink-900'}`}>
              {d}
            </button>
          ))}
        </div>
        <p className="text-[10px] leading-relaxed text-ink-700/60">
          At {output.dpi} DPI, a {PNG_PRESETS[2].width}px export ≈ {(PNG_PRESETS[2].width / output.dpi).toFixed(1)}″ wide.
        </p>
      </div>
    </Section>
  )
}
