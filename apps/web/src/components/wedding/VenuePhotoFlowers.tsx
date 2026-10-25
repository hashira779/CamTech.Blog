import React from "react";

/* Real flowers for the wedding hall: the CC0 photographs cut out in
   public/wedding/flowers (see SOURCES.txt), defined once each in the
   scene's <defs> and placed with <use>, so a wall of a hundred blooms
   costs six images. The white rose is also tinted blush and deep red
   with a colour filter, for the mix of a real Khmer wedding flower wall.

   Everything here is SVG with attribute styling only, so the planes it
   sits in can be flattened into images (see flattenLayers). Scatter comes
   from an integer hash: identical on the server and in every browser. */

const r2 = (v: number) => Math.round(v * 100) / 100;

/* Each photo normalised to 100 units wide, centred on the origin */
const PHOTOS = {
  rose: ["rose-white", 743, 900],
  orchid: ["orchid-white", 900, 812],
  plumeriaPink: ["plumeria-pink", 900, 739],
  plumeria: ["plumeria", 719, 900],
  jasmine: ["jasmine", 900, 588],
  spray: ["orchid-spray", 517, 900],
} as const;
type Photo = keyof typeof PHOTOS;

/** A bloom: which photo, and an optional tint */
export type Bloom = "rose" | "blush" | "red" | "orchid" | "plumeriaPink" | "plumeria" | "jasmine";
const BLOOM: Record<Bloom, [Photo, string?]> = {
  rose: ["rose"],
  blush: ["rose", "ve-tint-blush"],
  red: ["rose", "ve-tint-red"],
  orchid: ["orchid"],
  plumeriaPink: ["plumeriaPink"],
  plumeria: ["plumeria"],
  jasmine: ["jasmine"],
};

/** Mixes that read as one arrangement */
export const MIX = {
  wedding: ["blush", "rose", "blush", "orchid", "red", "rose", "plumeriaPink", "blush", "jasmine"],
  white: ["rose", "orchid", "rose", "jasmine", "plumeria", "orchid"],
  blush: ["blush", "blush", "rose", "plumeriaPink", "blush", "orchid"],
} as const satisfies Record<string, readonly Bloom[]>;

export function PhotoFlowerDefs() {
  return (
    <>
      {(Object.keys(PHOTOS) as Photo[]).map((k) => {
        const [file, w, h] = PHOTOS[k];
        const hh = (100 * h) / w;
        return <image key={k} id={`ve-fl-${k}`} href={`/wedding/flowers/${file}.webp`} x={-50} y={r2(-hh / 2)} width={100} height={r2(hh)} />;
      })}
      <filter id="ve-tint-blush" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="1 0 0 0 0.02  0 0.8 0 0 0  0 0 0.84 0 0  0 0 0 1 0" />
      </filter>
      <filter id="ve-tint-red" colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values="0.86 0 0 0 0.04  0 0.2 0 0 0  0 0 0.26 0 0  0 0 0 1 0" />
      </filter>
    </>
  );
}

function hash(seed: number) {
  return (i: number) => {
    let x = Math.imul(seed + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(i + 1, 0xc2b2ae35);
    x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
    x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };
}

/** One bloom, `size` units wide, centred on (x, y) */
export function Flower({ kind, x, y, size, rot = 0, flip = false }: { kind: Bloom | "spray"; x: number; y: number; size: number; rot?: number; flip?: boolean }) {
  const [photo, tint] = kind === "spray" ? (["spray"] as [Photo]) : BLOOM[kind];
  const s = r2(size / 100);
  return <use href={`#ve-fl-${photo}`} filter={tint ? `url(#${tint})` : undefined} transform={`translate(${r2(x)} ${r2(y)}) rotate(${r2(rot)}) scale(${flip ? -s : s} ${s})`} />;
}

type Placed = { x: number; y: number; size: number; kind: Bloom; rot: number };
const pick = (mix: readonly Bloom[], v: number) => mix[Math.floor(v * mix.length) % mix.length];

/** A dome of flowers standing on (x, y): `w` wide, `h` tall, larger blooms
    in front and in the middle, a soft shadow under it */
export function FlowerBank({ x, y, w, h, n, seed = 1, mix = MIX.wedding, size = 1 }: { x: number; y: number; w: number; h: number; n: number; seed?: number; mix?: readonly Bloom[]; size?: number }) {
  const r = hash(seed);
  const items: Placed[] = Array.from({ length: n }, (_, i) => {
    const u = r(i * 5) * 2 - 1;
    const v = r(i * 5 + 1);
    const top = Math.sqrt(1 - u * u) * h;
    return {
      x: x + u * w * 0.5,
      y: y - v * top,
      size: (0.16 + 0.14 * (1 - Math.abs(u)) + r(i * 5 + 2) * 0.08) * w * size,
      kind: pick(mix, r(i * 5 + 3)),
      rot: (r(i * 5 + 4) - 0.5) * 70,
    };
  }).sort((a, b) => a.y - b.y);
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={r2(w * 0.55)} ry={r2(w * 0.07)} fill="#2E1A10" fillOpacity="0.25" />
      {items.map((b, i) => <Flower key={i} {...b} />)}
    </g>
  );
}

/** A wall of flowers filling a rectangle, on a blush ground so no gap shows */
export function FlowerWall({ x, y, w, h, cell = 34, seed = 1, mix = MIX.wedding, ground = "#E9C9C2" }: { x: number; y: number; w: number; h: number; cell?: number; seed?: number; mix?: readonly Bloom[]; ground?: string }) {
  const r = hash(seed);
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
  const items: Placed[] = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const k = j * (cols + 1) + i;
      items.push({
        x: x + (i + (j % 2) * 0.5) * cell + (r(k * 4) - 0.5) * cell * 0.5,
        y: y + j * cell + (r(k * 4 + 1) - 0.5) * cell * 0.5,
        size: cell * (1.25 + r(k * 4 + 2) * 0.55),
        kind: pick(mix, r(k * 4 + 3)),
        rot: (r(k * 4 + 2) - 0.5) * 80,
      });
    }
  }
  const clip = `ve-fw-${seed}`;
  return (
    <g>
      <clipPath id={clip}>
        <rect x={x} y={y} width={w} height={h} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x={x} y={y} width={w} height={h} fill={ground} />
        {items.map((b, i) => <Flower key={i} {...b} />)}
      </g>
    </g>
  );
}

/** Blooms strung along a swag from a to b, sagging by `sag` */
export function Garland({ a, b, sag, n, size, seed = 1, mix = MIX.wedding }: { a: [number, number]; b: [number, number]; sag: number; n: number; size: number; seed?: number; mix?: readonly Bloom[] }) {
  const r = hash(seed);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const x = a[0] + (b[0] - a[0]) * t;
        const y = a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * sag;
        // Fuller in the middle of the swag
        const s = size * (0.75 + 0.45 * Math.sin(t * Math.PI)) * (0.85 + r(i * 3) * 0.3);
        return <Flower key={i} kind={pick(mix, r(i * 3 + 1))} x={x + (r(i * 3 + 2) - 0.5) * size * 0.3} y={y} size={s} rot={(r(i * 3 + 2) - 0.5) * 60} />;
      })}
    </g>
  );
}

/** A tall gilded stand with a dome of flowers spilling from its bowl;
    (x, y) is the foot, about 160·s tall */
export function PhotoFlowerStand({ x, y, s = 1, seed = 1, mix = MIX.wedding }: { x: number; y: number; s?: number; seed?: number; mix?: readonly Bloom[] }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={22 * s} ry={4 * s} fill="#2E1A10" fillOpacity="0.25" />
      <path d={`M${r2(x - 18 * s)} ${y} L${r2(x + 18 * s)} ${y} L${r2(x + 7 * s)} ${r2(y - 10 * s)} L${r2(x - 7 * s)} ${r2(y - 10 * s)} Z`} fill="url(#ve-gold)" />
      <rect x={r2(x - 3.5 * s)} y={r2(y - 92 * s)} width={r2(7 * s)} height={r2(84 * s)} fill="url(#ve-gold-h)" />
      <path d={`M${r2(x - 26 * s)} ${r2(y - 100 * s)} C${r2(x - 24 * s)} ${r2(y - 86 * s)} ${r2(x + 24 * s)} ${r2(y - 86 * s)} ${r2(x + 26 * s)} ${r2(y - 100 * s)} Z`} fill="url(#ve-gold)" />
      <Flower kind="spray" x={x - 30 * s} y={y - 66 * s} size={34 * s} rot={-8} />
      <Flower kind="spray" x={x + 30 * s} y={y - 66 * s} size={34 * s} rot={8} flip />
      <FlowerBank x={x} y={y - 96 * s} w={92 * s} h={62 * s} n={14} seed={seed} mix={mix} />
    </g>
  );
}
