'use client'

import { create } from 'zustand'
import type {
  AsciiParams,
  BlendMode,
  ColorMode,
  DitherParams,
  DocumentState,
  HalftoneParams,
  ImageAdjustments,
  Layer,
  LayerType,
  OutputSettings,
  SourceImage,
} from '@/types'
import {
  createCmykLayers,
  createDefaultDocument,
  createLayer,
  nextLayerId,
} from '@/lib/project-defaults'
import { freeBitmap } from '@/lib/image/bitmap-store'

interface AppStore {
  source: SourceImage | null
  doc: DocumentState
  computing: boolean

  // ── source ────────────────────────────────
  setSource: (s: SourceImage | null) => void
  setComputing: (v: boolean) => void

  // ── document-level ────────────────────────
  patchAdjustments: (p: Partial<ImageAdjustments>) => void
  patchOutput: (p: Partial<OutputSettings>) => void
  loadDocument: (d: DocumentState) => void
  reset: () => void

  // ── layer stack ───────────────────────────
  addLayer: (type: LayerType) => void
  addCmyk: () => void
  removeLayer: (id: string) => void
  duplicateLayer: (id: string) => void
  selectLayer: (id: string) => void
  reorderLayer: (id: string, dir: 'up' | 'down') => void
  renameLayer: (id: string, name: string) => void
  toggleVisible: (id: string) => void
  toggleLock: (id: string) => void
  setLayerOpacity: (id: string, opacity: number) => void
  setLayerBlend: (id: string, blend: BlendMode) => void
  setLayerType: (id: string, type: LayerType) => void

  // ── selected-layer params ─────────────────
  patchColor: (c: ColorMode) => void
  patchHalftone: (p: Partial<HalftoneParams>) => void
  patchAscii: (p: Partial<AsciiParams>) => void
  patchDither: (p: Partial<DitherParams>) => void
}

/** Immutably map over layers, replacing the one matching id. */
function mapLayer(layers: Layer[], id: string, fn: (l: Layer) => Layer): Layer[] {
  return layers.map((l) => (l.id === id ? fn(l) : l))
}

export const useAppStore = create<AppStore>((set, get) => ({
  source: null,
  doc: createDefaultDocument(),
  computing: false,

  setSource: (s) => {
    const prev = get().source
    if (prev && prev.bitmapId !== s?.bitmapId) freeBitmap(prev.bitmapId)
    set({ source: s })
  },

  setComputing: (v) => set({ computing: v }),

  patchAdjustments: (p) =>
    set((st) => ({ doc: { ...st.doc, adjustments: { ...st.doc.adjustments, ...p } } })),

  patchOutput: (p) =>
    set((st) => ({ doc: { ...st.doc, output: { ...st.doc.output, ...p } } })),

  loadDocument: (d) => set({ doc: d }),

  reset: () => {
    const prev = get().source
    if (prev) freeBitmap(prev.bitmapId)
    set({ source: null, doc: createDefaultDocument() })
  },

  // ── layer stack ───────────────────────────
  addLayer: (type) =>
    set((st) => {
      const layer = createLayer(type)
      return {
        doc: {
          ...st.doc,
          layers: [...st.doc.layers, layer], // pushed on top
          selectedLayerId: layer.id,
        },
      }
    }),

  addCmyk: () =>
    set((st) => {
      const layers = createCmykLayers()
      return {
        doc: {
          ...st.doc,
          layers: [...st.doc.layers, ...layers],
          selectedLayerId: layers[layers.length - 1].id,
        },
      }
    }),

  removeLayer: (id) =>
    set((st) => {
      if (st.doc.layers.length <= 1) return st // never empty
      const layers = st.doc.layers.filter((l) => l.id !== id)
      const selectedLayerId =
        st.doc.selectedLayerId === id ? layers[layers.length - 1].id : st.doc.selectedLayerId
      return { doc: { ...st.doc, layers, selectedLayerId } }
    }),

  duplicateLayer: (id) =>
    set((st) => {
      const src = st.doc.layers.find((l) => l.id === id)
      if (!src) return st
      const copy: Layer = { ...structuredClone(src), id: nextLayerId(), name: `${src.name} copy` }
      const idx = st.doc.layers.findIndex((l) => l.id === id)
      const layers = [...st.doc.layers]
      layers.splice(idx + 1, 0, copy)
      return { doc: { ...st.doc, layers, selectedLayerId: copy.id } }
    }),

  selectLayer: (id) => set((st) => ({ doc: { ...st.doc, selectedLayerId: id } })),

  reorderLayer: (id, dir) =>
    set((st) => {
      const idx = st.doc.layers.findIndex((l) => l.id === id)
      if (idx === -1) return st
      const target = dir === 'up' ? idx + 1 : idx - 1
      if (target < 0 || target >= st.doc.layers.length) return st
      const layers = [...st.doc.layers]
      ;[layers[idx], layers[target]] = [layers[target], layers[idx]]
      return { doc: { ...st.doc, layers } }
    }),

  renameLayer: (id, name) =>
    set((st) => ({ doc: { ...st.doc, layers: mapLayer(st.doc.layers, id, (l) => ({ ...l, name })) } })),

  toggleVisible: (id) =>
    set((st) => ({
      doc: { ...st.doc, layers: mapLayer(st.doc.layers, id, (l) => ({ ...l, visible: !l.visible })) },
    })),

  toggleLock: (id) =>
    set((st) => ({
      doc: { ...st.doc, layers: mapLayer(st.doc.layers, id, (l) => ({ ...l, locked: !l.locked })) },
    })),

  setLayerOpacity: (id, opacity) =>
    set((st) => ({ doc: { ...st.doc, layers: mapLayer(st.doc.layers, id, (l) => ({ ...l, opacity })) } })),

  setLayerBlend: (id, blendMode) =>
    set((st) => ({ doc: { ...st.doc, layers: mapLayer(st.doc.layers, id, (l) => ({ ...l, blendMode })) } })),

  setLayerType: (id, type) =>
    set((st) => ({ doc: { ...st.doc, layers: mapLayer(st.doc.layers, id, (l) => ({ ...l, type })) } })),

  // ── selected-layer params ─────────────────
  patchColor: (c) =>
    set((st) => ({
      doc: {
        ...st.doc,
        layers: mapLayer(st.doc.layers, st.doc.selectedLayerId, (l) => ({ ...l, color: c })),
      },
    })),

  patchHalftone: (p) =>
    set((st) => ({
      doc: {
        ...st.doc,
        layers: mapLayer(st.doc.layers, st.doc.selectedLayerId, (l) => ({
          ...l,
          halftone: { ...l.halftone, ...p },
        })),
      },
    })),

  patchAscii: (p) =>
    set((st) => ({
      doc: {
        ...st.doc,
        layers: mapLayer(st.doc.layers, st.doc.selectedLayerId, (l) => ({
          ...l,
          ascii: { ...l.ascii, ...p },
        })),
      },
    })),

  patchDither: (p) =>
    set((st) => ({
      doc: {
        ...st.doc,
        layers: mapLayer(st.doc.layers, st.doc.selectedLayerId, (l) => ({
          ...l,
          dither: { ...l.dither, ...p },
        })),
      },
    })),
}))

/** Selector helper: the currently-selected layer (or the first). */
export function selectActiveLayer(st: AppStore): Layer {
  return st.doc.layers.find((l) => l.id === st.doc.selectedLayerId) ?? st.doc.layers[0]
}
