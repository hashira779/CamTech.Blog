import { open } from "node:fs/promises";
import path from "node:path";
import { readImageSize } from "./image-size";

const cache = new Map<string, number | null>();
const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * Usable width in pixels of a project image under `/public` (e.g. `/images/places/x.jpg`) — its
 * width, capped at 1.5× its height so very wide panoramas do not pass as large — or null for
 * remote URLs, missing files and formats we do not parse. Reads only the first 64 KB of the file
 * and caches the answer for the life of the server process.
 */
export async function localImageWidth(src?: string | null): Promise<number | null> {
  if (!src || !src.startsWith("/") || src.startsWith("//")) return null;
  if (cache.has(src)) return cache.get(src) ?? null;

  const clean = src.split("?")[0];
  const file = path.normalize(path.join(PUBLIC_DIR, clean));
  // Never read outside /public, whatever the database says.
  if (!file.startsWith(PUBLIC_DIR + path.sep)) {
    cache.set(src, null);
    return null;
  }

  let width: number | null = null;
  try {
    const handle = await open(file, "r");
    try {
      const buf = new Uint8Array(65536);
      const { bytesRead } = await handle.read(buf, 0, buf.length, 0);
      const size = readImageSize(buf.subarray(0, bytesRead));
      // The width that survives a ~3:2 crop: a 1200×319 panorama is only ~480px wide once a
      // landscape tile crops it to height, so it must not count as a large photograph.
      width = size ? Math.min(size.width, Math.round(size.height * 1.5)) : null;
    } finally {
      await handle.close();
    }
  } catch {
    width = null;
  }
  cache.set(src, width);
  return width;
}

/**
 * `{ "/images/…": width }` for every JPEG/PNG under `public/images` (one level of folders). The
 * directory's photographs all live there, so this also covers rows fetched later by the client.
 */
export async function publicImageWidths(): Promise<Record<string, number>> {
  const { readdir } = await import("node:fs/promises");
  const root = path.join(PUBLIC_DIR, "images");
  const srcs: string[] = [];
  try {
    for (const dir of await readdir(root, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      for (const f of await readdir(path.join(root, dir.name))) {
        if (/\.(jpe?g|png)$/i.test(f)) srcs.push(`/images/${dir.name}/${f}`);
      }
    }
  } catch {
    return {};
  }
  return imageWidths(srcs);
}

/** `{ [src]: width }` for every distinct local image in the list. */
export async function imageWidths(srcs: (string | null | undefined)[]): Promise<Record<string, number>> {
  const unique = Array.from(new Set(srcs.filter((s): s is string => Boolean(s))));
  const entries = await Promise.all(unique.map(async (s) => [s, await localImageWidth(s)] as const));
  return Object.fromEntries(entries.filter((e): e is readonly [string, number] => typeof e[1] === "number"));
}
