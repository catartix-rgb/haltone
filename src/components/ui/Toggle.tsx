'use client'

import * as RadixSwitch from '@radix-ui/react-switch'
import { cn } from '@/lib/utils/cn'

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  className?: string
}

export function Toggle({ label, checked, onChange, className }: ToggleProps) {
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <span className="label-eyebrow">{label}</span>
      <RadixSwitch.Root
        checked={checked}
        onCheckedChange={onChange}
        className={cn(
          'relative h-5 w-9 rounded-full transition-all',
          'glass-faint',
          checked && 'iridescent-ring bg-gradient-to-r from-aqua-300 to-aqua-500',
        )}
      >
        <RadixSwitch.Thumb
          className={cn(
            'block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-glass-sm',
            'transition-transform duration-200 ease-out',
            'data-[state=checked]:translate-x-[18px]',
          )}
        />
      </RadixSwitch.Root>
    </div>
  )
}
