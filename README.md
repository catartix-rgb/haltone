# Halftone Studio

A creative tool for generating editable halftone, ASCII and dither artwork from images. Built for designers who care about vector-perfect output and need files that open cleanly in Illustrator, Photoshop and print workflows.

```
  ●    ●●●●●●●    ●●●
   ●●●●●●●●●●●●●●●●●●●●●
  ●●●●●●●●●●●●●●●●●●●●●●●●
   ●●●●●●●●●●●●●●●●●●●●●●●
    ●●●●●●●●●●●●●●●●●●●●●
       ●●●●●●●●●●●●●●●
            ●●●●●
```

## What it does

- **Halftone** — Convert any image into a grid of dots/squares/lines/diamonds/crosses/hexagons. Control cell size, angle, jitter, dot scale and shape rotation.
- **ASCII** — Render images as glyph-density art. Pick from curated charsets (classic, blocks, lines, bullets) or write your own. Real `<text>` elements in the SVG output — fonts and characters stay editable.
- **Dither** — Floyd–Steinberg, Atkinson, and 2×2 / 4×4 / 8×8 Bayer matrices. Adjustable palette depth and pixel scale.
- **Color systems** — Solid, duotone, tritone, multi-stop gradient. Curated palette presets.
- **Pro export** — Layered SVG (one `<g>` per shape type, named for Illustrator), PNG at HD / 2K / 4K / 8K, optional transparent background.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** with custom design tokens for the Liquid Glass aesthetic
- **Radix UI** primitives for accessible controls
- **Framer Motion** for fluid motion
- **Zustand** for state (small, fast, ergonomic)
- **Canvas API** for live preview, **SVG** for export
- **`react-dropzone`** for upload UX
- **`comlink`** wired up for future Web Worker offloading

## Architecture

```
src/
├── app/                     # Next.js routes (lean — one client island)
├── components/
│   ├── glass/               # GlassPanel — the foundational surface
│   ├── ui/                  # Slider, Button, Toggle, ColorField, Segmented, Section
│   ├── panels/              # Image / Halftone / ASCII / Dither / Color / Export
│   ├── canvas/              # PreviewCanvas, DropZone
│   ├── Sidebar.tsx
│   ├── TopBar.tsx
│   └── Studio.tsx           # the workspace composition
├── engines/
│   ├── common/              # registry + sampling utilities
│   ├── halftone/
│   ├── ascii/
│   └── dither/
├── hooks/
│   ├── use-app-store.ts     # Zustand store
│   └── use-render-pipeline.ts
├── lib/
│   ├── image/               # bitmap store + adjustment pipeline
│   ├── color/               # color math + presets
│   ├── export/              # SVG renderer, Canvas renderer, file download
│   └── utils/
├── styles/
│   └── globals.css          # design tokens + glass primitives
└── types/                   # the domain language
```

### Engine contract

Every engine is a pure function that takes pre-processed `ImageData` and returns `RenderPrimitive[]`:

```ts
runEngine({ imageData, width, height, project })
  → { primitives, bounds, background }
```

The same primitive array is consumed by:
- the **Canvas renderer** (`paintToCanvas`) — fast live preview
- the **SVG renderer** (`renderToSvg`) — vector export

This is the key architectural choice. **Preview and export are the same drawing.** No SVG-to-canvas rasterization, no canvas-to-SVG approximation. Add a new render mode by writing one function and registering it.

### Performance

- Preview operates on the image downsampled to 1024px on the longest edge.
- Heavy ops (blur) use the browser's native Canvas filter (C++ implementation).
- `requestAnimationFrame` coalesces slider drags.
- Sequence numbers cancel stale renders mid-flight.
- Dither output is run-length-coalesced before SVG emission (typically 5× fewer nodes).
- `ImageBitmap`s live outside React state in a module-scoped store, keyed by id, so React diffing stays cheap.

## Local development

```bash
git clone <your-repo-url>
cd halftone-studio
npm install
npm run dev
```

Visit `http://localhost:3000`.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript without emitting |
| `npm run format` | Prettier with Tailwind plugin |

### Environment variables

None required for the base experience. See `.env.example` for placeholders that future integrations (AI styling, cloud sync) will use.

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or click the **Import Project** button in the Vercel dashboard and point it at this repo. No build configuration needed — Vercel auto-detects Next.js.

The `next.config.mjs` includes `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` headers so the app is ready for `SharedArrayBuffer`, threads, and future WebGPU work.

## Canvas vs SVG — the design choice

| | Canvas | SVG |
|---|---|---|
| Render time for 20,000 dots | ~3 ms | 200–1000 ms |
| File size | PNG (raster, fixed res) | tens of KB, vector |
| Editable in Illustrator | no | yes |
| Best for | live preview, PNG export | final export, print |

We use both, deliberately. The user iterates against Canvas; the moment they hit "Export SVG" we emit the vector file.

## Keeping outputs editable in Illustrator

- Group primitives by shape type. Each `<g>` gets an `inkscape:label` and `id` matching the type (`circles`, `rects`, `glyphs`, ...). Illustrator's Layers panel shows them as named layers.
- Inline all attributes. No `<style>` blocks or `<defs>` so the file survives copy/paste between apps.
- Numbers rounded to 2 decimals — enough precision for 4K print, half the file size.
- ASCII glyphs are real `<text>` elements with `font-family` — designers can swap fonts in Illustrator without recreating the geometry.
- Background sits in its own labelled layer so it's easy to delete or replace.

## Roadmap

Planned, in rough priority order:

- [ ] Web Worker offloading via Comlink (the pipeline is already structured for it)
- [ ] Preset saving — name and recall full project state
- [ ] Editable layers — pick a single shape and tweak it post-render
- [ ] Animation — keyframe parameters, export to MP4/WebM
- [ ] Video halftone — process a `<video>` source frame-by-frame
- [ ] Audio-reactive visuals via `AudioWorklet`
- [ ] WebGPU compute path for very large images (16K+)
- [ ] AI image stylization (text-to-style transfer of the source before halftoning)
- [ ] Mobile / touch refinement

## License

MIT
