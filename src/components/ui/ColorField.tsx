'use client'

import { useId, useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface ColorFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  className?: string
}

/**
 * ColorField — a swatch + hex input.
 *
 * Tap the swatch to open the native picker; type a hex directly for
 * precise color matching to a brand system.  We don't override the
 * native picker because OS-level pickers are universally familiar.
 */
export function ColorField({ label, value, onChange, className }: ColorFieldProps) {
  const id = useId()
  const [local, setLocal] = useState(value)

  const commit = (v: string) => {
    setLocal(v)
    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="label-eyebrow">
        {label}
      </label>
      <div className="glass-faint flex items-center gap-2 rounded-full p-1 pr-3">
        <label
          htmlFor={id}
          className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full shadow-glass-sm"
          style={{ background: value }}
        >
          <span
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 0 0 1px rgba(0,0,0,0.1)',
            }}
          />
          <input
            id={id}
            type="color"
            value={value}
            onChange={(e) => {
              setLocal(e.target.value)
              onChange(e.target.value)
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <input
          type="text"
          value={local}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setLocal(value)}
          className="text-mono-tight w-full bg-transparent text-xs text-ink-800 outline-none placeholder:text-ink-700/50"
          maxLength={7}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
