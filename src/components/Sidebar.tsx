'use client'

import { motion } from 'framer-motion'
import { GlassPanel } from '@/components/glass/GlassPanel'
import { ImagePanel } from '@/components/panels/ImagePanel'
import { HalftonePanel } from '@/components/panels/HalftonePanel'
import { AsciiPanel } from '@/components/panels/AsciiPanel'
import { DitherPanel } from '@/components/panels/DitherPanel'
import { ColorPanel } from '@/components/panels/ColorPanel'
import { ExportPanel } from '@/components/panels/ExportPanel'
import { useAppStore } from '@/hooks/use-app-store'
import type { RenderResult } from '@/types'

interface SidebarProps {
  result: RenderResult | null
}

export function Sidebar({ result }: SidebarProps) {
  const mode = useAppStore((s) => s.project.mode)

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="fixed right-4 top-24 bottom-4 z-20 w-[320px]"
    >
      <GlassPanel
        variant="strong"
        className="flex h-full flex-col overflow-hidden p-5"
      >
        <div className="-mx-2 flex-1 space-y-6 overflow-y-auto px-2">
          <ImagePanel />
          {mode === 'halftone' && <HalftonePanel />}
          {mode === 'ascii' && <AsciiPanel />}
          {mode === 'dither' && <DitherPanel />}
          <ColorPanel />
          <ExportPanel result={result} />
        </div>
      </GlassPanel>
    </motion.aside>
  )
}
