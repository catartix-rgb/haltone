'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface SectionProps {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export function Section({ title, subtitle, children, className }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn('space-y-3', className)}
    >
      <header className="flex items-baseline justify-between border-b border-white/30 pb-2">
        <h3 className="text-display text-base text-ink-900">{title}</h3>
        {subtitle && <span className="text-mono-tight text-[10px] text-ink-700/60">{subtitle}</span>}
      </header>
      <div className="space-y-3">{children}</div>
    </motion.section>
  )
}
