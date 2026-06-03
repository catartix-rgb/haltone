# Architecture decisions

This document explains the *why* behind the structure. If you join this project, read this first.

## 1. RenderPrimitive as the universal intermediate representation

Every engine outputs an array of `RenderPrimitive`s — typed shapes (`circle`, `rect`, `line`, `path`, `text`). The Canvas renderer and the SVG renderer both consume this array.

**Why it matters:**

- Preview (Canvas) and export (SVG) are always pixel-identical. There is no "approximate" — they walk the same data.
- Adding a new render mode means writing one engine that emits primitives. The output story is solved.
- A future PDF, EPS, or G-code renderer just adds one more consumer of the same array.
- We can transform primitives — filter, scale, group — without re-running engines.

The alternative — engines emitting SVG strings directly, with a separate path for preview — couples each engine to two targets and makes preview/export drift over time. Asking for trouble.

## 2. ImageBitmaps stored outside React state

React state is for *descriptions*. A 12MP `ImageBitmap` is not a description — it's a megabyte of pixels.

`src/lib/image/bitmap-store.ts` is a module-scoped `Map<string, ImageBitmap>`. The project state holds the *id*, not the bitmap. Benefits:

- React diffing stays cheap. Every slider tick re-evaluates a few hundred bytes of JSON, not 12 MB.
- We free bitmaps deterministically (`bitmap.close()`) when the user replaces the image.
- Future Web Worker move: transfer the bitmap to the worker once, keep the id, never re-serialize.

## 3. Canvas for preview, SVG for export

Empirically: drawing 20,000 SVG `<circle>` elements via React takes 200–1000 ms and pins the main thread. The same scene through `ctx.arc()` takes ~3 ms. So:

- **Canvas** during the iterative phase — when the user is dragging sliders, watching the artwork change in real time.
- **SVG** only when the user clicks Export.

Both consume the same primitives, so there's no infidelity.

## 4. The engine contract — pure, deterministic, testable

```ts
type EngineFn = (args: EngineRenderArgs) => RenderResult
```

Engines:
- Take `ImageData` (already pre-processed for brightness/contrast/blur).
- Take a `ProjectState` snapshot.
- Return primitives.
- **No side effects.** No DOM access. No React.

This is what makes the future Web Worker move trivial. The function ships as-is. It's also what makes the engine testable: feed it a known `ImageData`, assert on the primitives.

## 5. ColorMode as a tagged union

```ts
type ColorMode =
  | { kind: 'solid'; ... }
  | { kind: 'duotone'; ... }
  | { kind: 'tritone'; ... }
  | { kind: 'gradient'; ... }
```

The shape of the color config changes per mode (duotone needs 2 colors, gradient needs N stops). TypeScript's discriminated unions enforce that the right fields exist for the right kind. Engines call `resolveInkColor(color, intensity)` and don't care which kind they have — the function dispatches internally.

## 6. Pre-processing pipeline as a chain of pure functions

```
ImageBitmap
  → bitmapToImageData(maxSize)      // downsample for preview
  → blurImageData(radius)            // native Canvas filter (fast)
  → applyAdjustments(adjustments)    // brightness/contrast/threshold/noise/invert
  → engine(...)                      // halftone | ascii | dither
  → primitives
  → canvasRenderer | svgRenderer
```

Each step is replaceable. Each step is testable. Each step has one job.

## 7. Run-length coalescing for dither output

A 4K dither with `scale=3` would emit ~1.4M `<rect>` elements at one-pixel granularity. That's 60–100 MB of SVG, unusable in Illustrator.

`renderDither()` coalesces horizontally adjacent same-color cells into wider rects. Typical reduction is 5–10×. We could go further (2D rectangle covering) — but at the cost of complexity, and 5× is enough to ship a usable file.

## 8. Sequence numbers for stale-render cancellation

`useRenderPipeline` increments a ref counter every time the inputs change. Inside the `requestAnimationFrame`, it captures the seq value; before committing the result to React state, it checks the current seq. If they differ, a newer render is already in flight — discard.

Without this, dragging a slider during a slow render would either:
- Block on the in-flight render (stutter), or
- Apply old results over new ones (visual jitter).

## 9. Glass design system in CSS, not JS

The Liquid Glass aesthetic — translucent surfaces, layered blur, iridescent edges — is implemented in `globals.css` as `.glass`, `.glass-faint`, `.glass-strong`, `.iridescent-ring`. Components compose these via `cn()`.

Why CSS:
- `backdrop-filter` is a GPU-accelerated property. JS-driven blur (canvas filters, SVG) would be slower and less faithful.
- Designers can tweak the design tokens in one file without touching React code.
- The CSS layer caches in the browser — no runtime cost on re-render.

## 10. Type-only `RenderMode` registry

`engines/common/registry.ts` is a `Record<RenderMode, EngineFn>`. Adding a render mode:

1. Add the string to the `RenderMode` union in `types/index.ts`.
2. Write the engine function.
3. Register it in the record.

TypeScript will scream until you do step 3 — exhaustiveness is enforced by the compiler.
