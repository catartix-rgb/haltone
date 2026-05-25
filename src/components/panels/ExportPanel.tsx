'use client'

import { Download, FileImage } from 'lucide-react'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { useAppStore } from '@/hooks/use-app-store'
import { exportPng, exportSvg, PNG_PRESETS } from '@/lib/export/export'
import type { RenderResult } from '@/types'

interface ExportPanelProps {
  result: RenderResult | null
}

export function ExportPanel({ result }: ExportPanelProps) {
  const output = useAppStore((s) => s.project.output)
  const patch = useAppStore((s) => s.patchOutput)

  const disabled = !result

  return (
    <Section title="Export" subtitle="output">
      <Toggle
        label="Transparent BG"
        checked={output.backgroundTransparent}
        onChange={(v) => patch({ backgroundTransparent: v })}
      />

      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Vector</span>
        <Button
          disabled={disabled}
          onClick={() =>
            result &&
            exportSvg(result, {
              transparent: output.backgroundTransparent,
              filename: `halftone-studio-${Date.now()}.svg`,
            })
          }
          icon={<Download className="h-4 w-4" />}
          variant="glass"
          className="w-full justify-center"
        >
          Export SVG
        </Button>
        <p className="text-[10px] leading-relaxed text-ink-700/60">
          Editable vectors — each shape becomes a layer in Illustrator.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="label-eyebrow">Raster</span>
        <div className="grid grid-cols-2 gap-1.5">
          {PNG_PRESETS.map((p) => (
            <Button
              key={p.label}
              disabled={disabled}
              onClick={() =>
                result &&
                exportPng(result, {
                  width: p.width,
                  transparent: output.backgroundTransparent,
                  filename: `halftone-studio-${p.label}-${Date.now()}.png`,
                })
              }
              variant="glass"
              size="sm"
              icon={<FileImage className="h-3.5 w-3.5" />}
            >
              <span className="text-mono-tight">{p.label}</span>
              <span className="text-[10px] text-ink-700/60">{p.width}px</span>
            </Button>
          ))}
        </div>
      </div>
    </Section>
  )
}
