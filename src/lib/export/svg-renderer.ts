import type { BlendMode, CompositeResult, RenderResult } from '@/types'

/**
 * SVG renderer — Illustrator / Figma / Affinity-friendly markup.
 *
 * Structure:
 *   <svg>
 *     <rect background />
 *     <g id="layer:Name" style="mix-blend-mode:multiply" opacity="0.8">
 *        <g id="circles"> … </g>     ← grouped by shape type
 *     </g>
 *     …
 *   </svg>
 *
 * Each layer becomes a named top-level group with its blend mode and
 * opacity; within it, primitives are grouped by shape type so a designer
 * can select "all circles in the Magenta layer" in one click.
 *
 * Numbers rounded to 2dp (enough for 8K print, half the bytes). All
 * attributes inline — no <style>/<defs> — so the file survives copy/paste
 * between apps.
 */

const blendCss: Record<BlendMode, string> = {
  normal: 'normal',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  'soft-light': 'soft-light',
  difference: 'difference',
  'color-dodge': 'color-dodge',
}

const r2 = (n: number) => +n.toFixed(2)

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}
function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
function sanitizeId(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]/g, '-')
}

/** Emit one layer's primitives, grouped by shape type. */
function layerBody(result: RenderResult): string {
  const groups = new Map<string, string[]>()
  const push = (k: string, body: string) => {
    const arr = groups.get(k) ?? []
    arr.push(body)
    groups.set(k, arr)
  }

  for (const p of result.primitives) {
    switch (p.type) {
      case 'circle': {
        const stroke = p.stroke
          ? ` stroke="${escapeAttr(p.stroke)}" stroke-width="${r2(p.strokeWidth ?? 1)}"`
          : ''
        push(
          'circles',
          `<circle cx="${r2(p.cx)}" cy="${r2(p.cy)}" r="${r2(p.r)}" fill="${escapeAttr(p.fill)}"${stroke}/>`,
        )
        break
      }
      case 'rect': {
        const tf = p.rotate
          ? ` transform="rotate(${r2(p.rotate)} ${r2(p.x + p.w / 2)} ${r2(p.y + p.h / 2)})"`
          : ''
        push(
          'rects',
          `<rect x="${r2(p.x)}" y="${r2(p.y)}" width="${r2(p.w)}" height="${r2(p.h)}" fill="${escapeAttr(p.fill)}"${tf}/>`,
        )
        break
      }
      case 'line':
        push(
          'lines',
          `<line x1="${r2(p.x1)}" y1="${r2(p.y1)}" x2="${r2(p.x2)}" y2="${r2(p.y2)}" stroke="${escapeAttr(p.stroke)}" stroke-width="${r2(p.strokeWidth)}" stroke-linecap="round"/>`,
        )
        break
      case 'path': {
        const stroke = p.stroke
          ? ` stroke="${escapeAttr(p.stroke)}" stroke-width="${r2(p.strokeWidth ?? 1)}"`
          : ''
        push('paths', `<path d="${p.d}" fill="${escapeAttr(p.fill)}"${stroke}/>`)
        break
      }
      case 'text': {
        const tf = p.rotate ? ` transform="rotate(${r2(p.rotate)} ${r2(p.x)} ${r2(p.y)})"` : ''
        push(
          'glyphs',
          `<text x="${r2(p.x)}" y="${r2(p.y)}" font-family="${escapeAttr(p.fontFamily)}" font-size="${r2(p.fontSize)}" font-weight="${p.fontWeight}" fill="${escapeAttr(p.fill)}" text-anchor="middle"${tf}>${escapeXml(p.content)}</text>`,
        )
        break
      }
    }
  }

  const blocks: string[] = []
  for (const [name, items] of groups) {
    blocks.push(`    <g id="${name}">\n      ${items.join('\n      ')}\n    </g>`)
  }
  return blocks.join('\n')
}

export function renderToSvg(
  composite: CompositeResult,
  opts: { transparent?: boolean; outputWidth?: number; outputHeight?: number; title?: string } = {},
): string {
  const W = composite.bounds.width
  const H = composite.bounds.height
  const outW = opts.outputWidth ?? W
  const outH = opts.outputHeight ?? H

  const bg =
    !opts.transparent && composite.background && composite.background !== 'transparent'
      ? `  <rect id="background" x="0" y="0" width="${r2(W)}" height="${r2(H)}" fill="${escapeAttr(composite.background)}"/>\n`
      : ''

  const layerGroups = composite.layers
    .filter((l) => l.visible)
    .map((l) => {
      const blend = blendCss[l.blendMode]
      const style = blend !== 'normal' ? ` style="mix-blend-mode:${blend}"` : ''
      const op = l.opacity < 1 ? ` opacity="${r2(l.opacity)}"` : ''
      return `  <g id="layer-${sanitizeId(l.name)}" data-name="${escapeAttr(l.name)}"${style}${op}>\n${layerBody(l.result)}\n  </g>`
    })
    .join('\n')

  const title = opts.title ? `  <title>${escapeXml(opts.title)}</title>\n` : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(W)} ${r2(H)}" width="${r2(outW)}" height="${r2(outH)}" shape-rendering="geometricPrecision">
${title}${bg}${layerGroups}
</svg>`
}
