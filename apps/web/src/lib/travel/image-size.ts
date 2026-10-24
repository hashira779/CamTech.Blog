/**
 * Pixel dimensions from the first bytes of a JPEG or PNG file. Import-free so it runs under
 * `node --test`; the server-side reader that opens files lives in `image-meta.ts`.
 *
 * Used to keep large editorial slots honest: most directory photographs are ~330px wide, and a
 * 330px picture stretched across a feature slot reads as a broken site. Only images that are
 * actually large get the large slots.
 */
export function readImageSize(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 24) return null;

  // PNG: signature, then the IHDR chunk with big-endian width/height at offsets 16 and 20.
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return { width: dv.getUint32(16), height: dv.getUint32(20) };
  }

  // JPEG: walk the segments to the first start-of-frame marker.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      // Fill bytes and standalone markers carry no length.
      if (marker === 0xff) {
        i++;
        continue;
      }
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      const len = (buf[i + 2] << 8) | buf[i + 3];
      const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isSOF) {
        const height = (buf[i + 5] << 8) | buf[i + 6];
        const width = (buf[i + 7] << 8) | buf[i + 8];
        return width && height ? { width, height } : null;
      }
      if (len < 2) return null;
      i += 2 + len;
    }
  }
  return null;
}

/** Slots wider than ~450 CSS px need a photograph at least this wide to stay sharp. */
export const LARGE_IMAGE_MIN_WIDTH = 900;

export function isLargeImage(widths: Record<string, number>, src?: string | null): boolean {
  return Boolean(src && (widths[src] ?? 0) >= LARGE_IMAGE_MIN_WIDTH);
}
