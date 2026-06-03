'use client'

import * as RadixSlider from '@radix-ui/react-slider'
import { useId } from 'react'
import { cn } from '@/lib/utils/cn'

interface SliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  /** Optional unit suffix shown in the value badge */
  unit?: string
  /** Format the display value */
  format?: (v: number) => string
  className?: string
}

/**
 * Slider — the most-used control in the app.
 *
 * The thumb feels tactile thanks to a tiny scale-on-press animation;
 * the track range is iridescent. We expose label + live numeric badge
 * so designers always see the exact value they're tweaking.
 */
export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  format,
  className,
}: SliderProps) {
  const id = useId()
  const display = format ? format(value) : `${value}${unit ?? ''}`

  return (
    <div className={cn('group flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="label-eyebrow">
          {label}
        </label>
        <span className="text-mono-tight text-xs text-ink-800 tabular-nums">{display}</span>
      </div>
      <RadixSlider.Root
        id={id}
        className="relative flex h-5 w-full touch-none select-none items-center"
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
      >
        <RadixSlider.Track className="slider-track relative h-1.5 w-full grow overflow-hidden rounded-full">
          <RadixSlider.Range className="slider-range absolute h-full rounded-full" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="slider-thumb block h-4 w-4 rounded-full focus-visible:outline-none"
          aria-label={label}
        />
      </RadixSlider.Root>
    </div>
  )
}
