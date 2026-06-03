'use client'

import { useAppStore } from '@/hooks/use-app-store'
import type { Layer } from '@/types'

/** Reactively returns the currently-selected layer. */
export function useActiveLayer(): Layer {
  return useAppStore((s) => s.doc.layers.find((l) => l.id === s.doc.selectedLayerId) ?? s.doc.layers[0])
}
