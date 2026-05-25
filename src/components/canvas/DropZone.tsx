'use client'

import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { ImagePlus } from 'lucide-react'
import { useAppStore } from '@/hooks/use-app-store'
import { loadImageBitmap } from '@/lib/image/processing'
import { storeBitmap } from '@/lib/image/bitmap-store'
import { cn } from '@/lib/utils/cn'

export function DropZone({ compact = false }: { compact?: boolean }) {
  const setSource = useAppStore((s) => s.setSource)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/gif': [],
    },
    multiple: false,
    onDrop: async (files) => {
      const file = files[0]
      if (!file) return
      const bmp = await loadImageBitmap(file)
      const id = storeBitmap(bmp)
      setSource({
        name: file.name,
        width: bmp.width,
        height: bmp.height,
        bitmapId: id,
      })
    },
  })

  if (compact) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          'glass-faint cursor-pointer rounded-full px-4 py-2',
          'flex items-center gap-2 text-xs font-medium text-ink-800',
          'transition-all hover:glass',
          isDragActive && 'iridescent-ring',
        )}
      >
        <input {...getInputProps()} />
        <ImagePlus className="h-3.5 w-3.5" />
        Replace image
      </div>
    )
  }

  return (
    <motion.div
      {...(getRootProps() as any)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'glass relative cursor-pointer overflow-hidden rounded-3xl',
        'flex aspect-[4/3] flex-col items-center justify-center gap-4',
        'p-12 transition-all duration-300',
        isDragActive && 'iridescent-ring scale-[1.02]',
      )}
    >
      <input {...getInputProps()} />

      {/* Floating orb */}
      <motion.div
        animate={{
          y: [0, -12, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        <div className="relative h-20 w-20">
          <div
            className="absolute inset-0 animate-breathe rounded-full"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, oklch(94% 0.08 200), oklch(80% 0.15 180) 60%, oklch(70% 0.18 160))',
              boxShadow:
                '0 12px 32px -8px oklch(70% 0.15 200 / 0.5), inset 0 2px 6px rgba(255,255,255,0.8)',
            }}
          />
          <div className="absolute inset-3 rounded-full bg-white/40 blur-md" />
          <ImagePlus
            className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-white"
            strokeWidth={1.5}
          />
        </div>
      </motion.div>

      <div className="text-center">
        <h3 className="text-display text-2xl text-ink-900">
          {isDragActive ? 'Release to begin' : 'Drop an image to begin'}
        </h3>
        <p className="mt-2 text-sm text-ink-800/70">
          JPG · PNG · WEBP · GIF — up to 20 MB
        </p>
      </div>

      <div className="mt-2 flex gap-2 text-[10px] uppercase tracking-[0.18em] text-ink-800/50">
        <span>Halftone</span>
        <span>·</span>
        <span>ASCII</span>
        <span>·</span>
        <span>Dither</span>
      </div>
    </motion.div>
  )
}
