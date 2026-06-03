'use client'

import type { DocumentState } from '@/types'

/**
 * Presets — full document snapshots persisted to localStorage.
 *
 * A preset stores only parameters (layers, adjustments, output) — never
 * the source image — so presets are tiny and portable across images.
 * This is the seed of the future "Presets Marketplace": the same JSON
 * shape can be shared, imported, or synced to a backend.
 */

const KEY = 'halftone-studio:presets:v1'

export interface Preset {
  id: string
  name: string
  createdAt: number
  doc: DocumentState
}

export function listPresets(): Preset[] {
  if (typeof localStorage === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Preset[]
  } catch {
    return []
  }
}

export function savePreset(name: string, doc: DocumentState): Preset {
  const preset: Preset = {
    id: `preset_${Date.now().toString(36)}`,
    name,
    createdAt: Date.now(),
    doc: structuredClone(doc),
  }
  const all = [preset, ...listPresets()]
  localStorage.setItem(KEY, JSON.stringify(all))
  return preset
}

export function deletePreset(id: string) {
  localStorage.setItem(KEY, JSON.stringify(listPresets().filter((p) => p.id !== id)))
}

/** Export a preset as a downloadable .json file (shareable). */
export function exportPresetJson(preset: Preset) {
  const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${preset.name.replace(/\s+/g, '-').toLowerCase()}.hstudio.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
