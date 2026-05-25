'use client'

import { create } from 'zustand'
import type {
  AsciiParams,
  ColorMode,
  DitherParams,
  HalftoneParams,
  ImageAdjustments,
  ProjectState,
  RenderMode,
  SourceImage,
} from '@/types'
import { DEFAULT_PROJECT } from '@/lib/project-defaults'
import { freeBitmap } from '@/lib/image/bitmap-store'

interface AppStore {
  source: SourceImage | null
  project: ProjectState
  // Coarse "is computing" flag for the canvas — drives a subtle shimmer
  computing: boolean

  setSource: (s: SourceImage | null) => void
  setMode: (m: RenderMode) => void
  patchAdjustments: (p: Partial<ImageAdjustments>) => void
  patchColor: (c: ColorMode) => void
  patchHalftone: (p: Partial<HalftoneParams>) => void
  patchAscii: (p: Partial<AsciiParams>) => void
  patchDither: (p: Partial<DitherParams>) => void
  patchOutput: (p: Partial<ProjectState['output']>) => void
  setComputing: (v: boolean) => void
  reset: () => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  source: null,
  project: DEFAULT_PROJECT,
  computing: false,

  setSource: (s) => {
    const prev = get().source
    if (prev && prev.bitmapId !== s?.bitmapId) freeBitmap(prev.bitmapId)
    set({ source: s })
  },

  setMode: (m) =>
    set((state) => ({
      project: { ...state.project, mode: m },
    })),

  patchAdjustments: (p) =>
    set((state) => ({
      project: { ...state.project, adjustments: { ...state.project.adjustments, ...p } },
    })),

  patchColor: (c) =>
    set((state) => ({
      project: { ...state.project, color: c },
    })),

  patchHalftone: (p) =>
    set((state) => ({
      project: { ...state.project, halftone: { ...state.project.halftone, ...p } },
    })),

  patchAscii: (p) =>
    set((state) => ({
      project: { ...state.project, ascii: { ...state.project.ascii, ...p } },
    })),

  patchDither: (p) =>
    set((state) => ({
      project: { ...state.project, dither: { ...state.project.dither, ...p } },
    })),

  patchOutput: (p) =>
    set((state) => ({
      project: { ...state.project, output: { ...state.project.output, ...p } },
    })),

  setComputing: (v) => set({ computing: v }),

  reset: () => set({ source: null, project: DEFAULT_PROJECT }),
}))
