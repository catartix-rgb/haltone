import type { RenderResult } from '@/types'

/**
 * SVG renderer — produces clean, editable, Illustrator-friendly markup.
 *
 * Decisions:
 *   - One <g> per shape type so designers can target a whole "layer"
 *     in Illustrator with a single click (object > select > same).
 *   - Numbers rounded to 2 decimals: enough precision for print at 4K,
 *     half the file size of unrounded floats.
 *   - No CSS-in-SVG, no <style> blocks — all attributes inline so the
 *     file survives copy/paste between apps.
 *   - <text> elements use real fontFamily so designers can swap fonts
 *     in Illustrator without recreating the geometry.
 *
 * The result IS the file you'd save — what you see in the preview is
 * what you get on disk.
 */
export function renderToSvg(
  result: RenderResult,
  opts: {
    transparent?: boolean
    /** Width/height attributes in the output. ViewBox is always bounds. */
    outputWidth?: number
    outputHeight?: number
    /** Optional metadata title */
    title?: string
  } = {},
): string {
  const { bounds, background, primitives } = result
  const W = bounds.width
  const H = bounds.height
  const outW = opts.outputWidth ?? W
  const outH = opts.outputHeight ?? H

  // Group primitives by type so the resulting <g> blocks become Illustrator layers
  const groups = new Map<string, string[]>()
  const push = (key: string, body: string) => {
    const arr = groups.get(key) ?? []
    arr.push(body)
    groups.set(key, arr)
  }

  const r2 = (n: number) => +n.toFixed(2)

  for (const p of primitives) {
    switch (p.type) {
      case 'circle':
        push(
          'circles',
          `<circle cx="${r2(p.cx)}" cy="${r2(p.cy)}" r="${r2(p.r)}" fill="${escapeAttr(p.fill)}"/>`,
        )
        break

      case 'rect': {
        const transform = p.rotate
          ? ` transform="rotate(${r2(p.rotate)} ${r2(p.x + p.w / 2)} ${r2(p.y + p.h / 2)})"`
          : ''
        push(
          'rects',
          `<rect x="${r2(p.x)}" y="${r2(p.y)}" width="${r2(p.w)}" height="${r2(p.h)}" fill="${escapeAttr(p.fill)}"${transform}/>`,
        )
        break
      }

      case 'line':
        push(
          'lines',
          `<line x1="${r2(p.x1)}" y1="${r2(p.y1)}" x2="${r2(p.x2)}" y2="${r2(p.y2)}" stroke="${escapeAttr(p.stroke)}" stroke-width="${r2(p.strokeWidth)}" stroke-linecap="round"/>`,
        )
        break

      case 'path':
        push('paths', `<path d="${p.d}" fill="${escapeAttr(p.fill)}"/>`)
        break

      case 'text':
        push(
          'glyphs',
          `<text x="${r2(p.x)}" y="${r2(p.y)}" font-family="${escapeAttr(p.fontFamily)}" font-size="${r2(p.fontSize)}" font-weight="${p.fontWeight}" fill="${escapeAttr(p.fill)}" text-anchor="middle">${escapeXml(p.content)}</text>`,
        )
        break
    }
  }

  const groupBlocks: string[] = []
  for (const [name, items] of groups) {
    groupBlocks.push(
      `<g id="${name}" inkscape:label="${name}" inkscape:groupmode="layer">\n  ${items.join('\n  ')}\n</g>`,
    )
  }

  const bgRect =
    !opts.transparent && background && background !== 'transparent'
      ? `<rect id="background" inkscape:label="background" inkscape:groupmode="layer" x="0" y="0" width="${r2(W)}" height="${r2(H)}" fill="${escapeAttr(background)}"/>\n`
      : ''

  const title = opts.title ? `<title>${escapeXml(opts.title)}</title>\n` : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     viewBox="0 0 ${r2(W)} ${r2(H)}"
     width="${r2(outW)}"
     height="${r2(outH)}"
     shape-rendering="geometricPrecision">
${title}${bgRect}${groupBlocks.join('\n')}
</svg>`
}

function escapeAttr(s: string) {
  return s.replace(/"/g, '&quot;').replace(/&/g, '&amp;')
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
