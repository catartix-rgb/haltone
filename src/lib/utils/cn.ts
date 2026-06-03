import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with Tailwind-aware merging.
 * Lets us pass conditional classes and override defaults predictably.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Clamp a value between min and max. */
export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

/** Linear interpolation */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Map a value from one range to another */
export const remap = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) => outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin)

/** Deterministic seeded random — keeps renders stable when "jitter" is on */
export function mulberry32(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
