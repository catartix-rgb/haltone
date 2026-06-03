'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual depth — controls blur intensity and opacity */
  variant?: 'faint' | 'default' | 'strong'
  /** Show iridescent edge ring (active state) */
  ringed?: boolean
}

/**
 * GlassPanel — the foundational surface of the whole UI.
 *
 * Every floating control, every side panel, every modal sits on top of
 * one of these. The variants tune the backdrop blur and opacity to
 * suggest depth: faint surfaces feel further away, strong ones float
 * closer to the eye.
 */
export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ variant = 'default', ringed = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl',
          variant === 'faint' && 'glass-faint',
          variant === 'default' && 'glass',
          variant === 'strong' && 'glass-strong',
          ringed && 'iridescent-ring',
          className,
        )}
        {...props}
      />
    )
  },
)

GlassPanel.displayName = 'GlassPanel'
