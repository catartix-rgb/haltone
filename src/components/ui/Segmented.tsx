'use client'

import { cn } from '@/lib/utils/cn'

interface SegmentedProps<T extends string> {
  label?: string
  value: T
  onChange: (v: T) => void
  options: ReadonlyArray<{ value: T; label: string; icon?: React.ReactNode }>
  className?: string
}

/**
 * Segmented — a pill-shaped selector that feels physical.
 *
 * Active segment gets the iridescent ring + a subtle inner glow.
 * Better than a <select> for short option lists because the choices
 * stay visible, which matters for things like dot shape where the
 * preview helps decision-making.
 */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: SegmentedProps<T>) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && <span className="label-eyebrow">{label}</span>}
      <div className="glass-faint flex gap-0.5 rounded-full p-0.5">
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                'relative flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-all',
                'flex items-center justify-center gap-1.5',
                active
                  ? 'glass-strong text-ink-900 shadow-glass-sm'
                  : 'text-ink-800/70 hover:text-ink-900',
              )}
            >
              {opt.icon && <span className="flex h-3 w-3 items-center justify-center">{opt.icon}</span>}
              <span className="truncate">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
