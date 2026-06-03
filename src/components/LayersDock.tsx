'use client'

import { motion } from 'framer-motion'
import { GlassPanel } from '@/components/glass/GlassPanel'
import { LayersPanel } from '@/components/panels/LayersPanel'

/** Floating layers dock — left side, the creative-tool signature panel. */
export function LayersDock() {
  return (
    <motion.div
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
      className="fixed left-4 top-24 z-20 w-[264px]">
      <GlassPanel variant="strong" className="max-h-[calc(100vh-7rem)] overflow-y-auto p-4">
        <LayersPanel />
      </GlassPanel>
    </motion.div>
  )
}
