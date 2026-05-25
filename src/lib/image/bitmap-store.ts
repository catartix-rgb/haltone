/**
 * Bitmap store.
 *
 * React state should hold descriptions, not megabytes of pixel data.
 * We keep loaded ImageBitmaps in a module-scoped Map keyed by an id, and
 * the project state only carries that id. This lets us:
 *
 *   1. Diff React state cheaply (small JSON snapshots → fast)
 *   2. Re-run engines without forcing React to re-serialize bitmaps
 *   3. Free memory deterministically when an image is replaced
 */

const bitmaps = new Map<string, ImageBitmap>()

let counter = 0

export function storeBitmap(bmp: ImageBitmap): string {
  const id = `bmp_${Date.now().toString(36)}_${(counter++).toString(36)}`
  bitmaps.set(id, bmp)
  return id
}

export function getBitmap(id: string): ImageBitmap | undefined {
  return bitmaps.get(id)
}

export function freeBitmap(id: string): void {
  const b = bitmaps.get(id)
  if (b) {
    b.close?.()
    bitmaps.delete(id)
  }
}

export function freeAllBitmaps(): void {
  for (const [, b] of bitmaps) b.close?.()
  bitmaps.clear()
}
