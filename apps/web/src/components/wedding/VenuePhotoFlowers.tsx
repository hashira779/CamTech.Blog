import React from "react";

/* Flowers for the wedding hall, drawn: garden roses in ivory, blush and
   dusty burgundy, pink peonies, frangipani, white orchids and sprigs of
   jasmine, with sage leaves and eucalyptus between them.

   Each bloom is built from layered petals in rings; one radial gradient
   per colour runs from the deep heart of the flower out to the pale petal
   edges, so every petal shades by its distance from the centre and the
   bloom reads as cupped and deep. Each is defined once (PhotoFlowerDefs)
   and placed with <use>, attribute styling only, so the planes can be
   flattened into images. Scatter comes from an integer hash: identical on
   the server and in every browser. */

const r2 = (v: number) => Math.round(v * 100) / 100;

export type Bloom = "rose" | "blush" | "red" | "orchid" | "plumeriaPink" | "plumeria" | "jasmine";

/** Mixes that read as one arrangement */
export const MIX = {
  wedding: ["blush", "rose", "plumeriaPink", "jasmine", "blush", "orchid", "rose", "red", "blush", "plumeria", "rose", "jasmine"],
  white: ["rose", "orchid", "jasmine", "rose", "plumeria", "orchid"],
  blush: ["blush", "plumeriaPink", "rose", "blush", "jasmine", "orchid"],
} as const satisfies Record<string, readonly Bloom[]>;

/* ─── Drawing ───────────────────────────────────────────────────────────── */

/* One rose petal pointing up from the centre, 50 long: a broad cup with a
   rolled-back lip along its top edge */
const PETAL = "M0 0 C-27 -5 -31 -37 -10 -49 C-3 -52 3 -52 10 -49 C31 -37 27 -5 0 0 Z";
const LIP = "M-21 -39 C-11 -48 11 -48 21 -39 C11 -43 -11 -43 -21 -39 Z";

/* Rings of petals, outermost first: count, scale, turn */
const ROSE_RINGS: [number, number, number][] = [[6, 1, 0], [6, 0.8, 30], [5, 0.6, 12], [4, 0.42, 45]];
const PEONY_RINGS: [number, number, number][] = [[8, 1, 0], [8, 0.86, 22], [7, 0.7, 8], [6, 0.54, 30], [5, 0.38, 14]];

function Rose({ id, c, rings }: { id: string; c: [string, string, string]; rings: [number, number, number][] }) {
  return (
    <g id={id}>
      <circle r="48" fill="#3A2416" fillOpacity="0.16" transform="translate(3 5)" />
      {rings.map(([n, s, turn]) =>
        Array.from({ length: n }, (_, i) => (
          <g key={`${s}-${i}`} transform={`rotate(${r2(turn + (i * 360) / n)}) scale(${s})`}>
            <path d={PETAL} fill={`url(#${id}-g)`} stroke={c[0]} strokeOpacity="0.35" strokeWidth={0.8 / s} />
            <path d={LIP} fill={c[2]} fillOpacity="0.85" />
          </g>
        ))
      )}
      <circle r="9" fill={c[0]} />
      <path d="M-7 1 C-8 -8 7 -10 8 -1 C9 6 0 9 -4 5 C-7 2 -3 -4 2 -2" fill="none" stroke={c[2]} strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" />
    </g>
  );
}

const ROSE_COLOURS: Record<string, [string, string, string]> = {
  "ve-fl-rose": ["#B89474", "#EEDCC6", "#FFFBF3"],
  "ve-fl-blush": ["#B9676F", "#EBB3B0", "#FCE8E2"],
  "ve-fl-red": ["#5E1220", "#9C2A38", "#D46A72"],
  "ve-fl-peony": ["#B84B6E", "#EE9DB2", "#FDE6EC"],
};

export function PhotoFlowerDefs() {
  return (
    <>
      {Object.entries(ROSE_COLOURS).map(([id, c]) => (
        <radialGradient key={id} id={`${id}-g`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="50">
          <stop offset="0" stopColor={c[0]} />
          <stop offset="0.5" stopColor={c[1]} />
          <stop offset="1" stopColor={c[2]} />
        </radialGradient>
      ))}
      <radialGradient id="ve-fl-frangi-g" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="46">
        <stop offset="0" stopColor="#F2B233" />
        <stop offset="0.3" stopColor="#FBE29A" />
        <stop offset="0.6" stopColor="#FFFBF0" />
        <stop offset="1" stopColor="#FFFFFF" />
      </radialGradient>
      <radialGradient id="ve-fl-white-g" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="40">
        <stop offset="0" stopColor="#EADFCB" />
        <stop offset="0.5" stopColor="#FBF7EF" />
        <stop offset="1" stopColor="#FFFFFF" />
      </radialGradient>
      <linearGradient id="ve-fl-leaf-g" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#4F6B48" />
        <stop offset="1" stopColor="#9DB58C" />
      </linearGradient>
      <linearGradient id="ve-fl-euca-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#A9BFA6" />
        <stop offset="1" stopColor="#6F8E73" />
      </linearGradient>

      <Rose id="ve-fl-rose" c={ROSE_COLOURS["ve-fl-rose"]} rings={ROSE_RINGS} />
      <Rose id="ve-fl-blush" c={ROSE_COLOURS["ve-fl-blush"]} rings={ROSE_RINGS} />
      <Rose id="ve-fl-red" c={ROSE_COLOURS["ve-fl-red"]} rings={ROSE_RINGS} />
      <Rose id="ve-fl-peony" c={ROSE_COLOURS["ve-fl-peony"]} rings={PEONY_RINGS} />

      {/* Frangipani: five broad petals, each overlapping the next, a gold throat */}
      <g id="ve-fl-plumeria">
        <circle r="40" fill="#3A2416" fillOpacity="0.12" transform="translate(3 5)" />
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 72})`}>
            <path d="M0 0 C-14 -6 -24 -28 -8 -44 C6 -50 20 -38 13 -21 C9 -12 5 -5 0 0 Z" fill="url(#ve-fl-frangi-g)" stroke="#D8C7A4" strokeWidth="0.8" />
            <path d="M-2 -6 C-6 -16 -8 -28 -5 -38" fill="none" stroke="#E7D7B6" strokeWidth="0.9" />
          </g>
        ))}
        <circle r="3.5" fill="#E9A225" />
      </g>

      {/* White orchid: two broad petals, three sepals, a blushed lip */}
      <g id="ve-fl-orchid">
        <circle r="40" fill="#3A2416" fillOpacity="0.1" transform="translate(3 5)" />
        <ellipse cx="0" cy="-26" rx="11" ry="21" fill="url(#ve-fl-white-g)" stroke="#E2D6C0" strokeWidth="0.8" />
        <ellipse cx="0" cy="-26" rx="11" ry="21" fill="url(#ve-fl-white-g)" stroke="#E2D6C0" strokeWidth="0.8" transform="rotate(125)" />
        <ellipse cx="0" cy="-26" rx="11" ry="21" fill="url(#ve-fl-white-g)" stroke="#E2D6C0" strokeWidth="0.8" transform="rotate(-125)" />
        <ellipse cx="-20" cy="-4" rx="22" ry="17" fill="url(#ve-fl-white-g)" stroke="#E2D6C0" strokeWidth="0.8" transform="rotate(-18 -20 -4)" />
        <ellipse cx="20" cy="-4" rx="22" ry="17" fill="url(#ve-fl-white-g)" stroke="#E2D6C0" strokeWidth="0.8" transform="rotate(18 20 -4)" />
        <path d="M-8 4 C-12 16 -4 24 0 22 C4 24 12 16 8 4 C4 8 -4 8 -8 4 Z" fill="#E9A3AE" stroke="#C9727E" strokeWidth="0.8" />
        <circle cx="0" cy="0" r="4" fill="#F4D36B" />
      </g>

      {/* Jasmine: a sprig of three small starry flowers and two buds */}
      <g id="ve-fl-jasmine">
        <path d="M-30 30 C-10 16 4 4 22 -24" fill="none" stroke="#6E8A5E" strokeWidth="2" />
        {[[-22, 22, 14], [2, 2, 18], [18, -22, 13]].map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x} ${y}) scale(${s / 18})`}>
            {Array.from({ length: 5 }, (_, k) => (
              <path key={k} d="M0 0 C-5 -6 -5 -15 0 -18 C5 -15 5 -6 0 0 Z" fill="url(#ve-fl-white-g)" stroke="#E2D6C0" strokeWidth="0.8" transform={`rotate(${k * 72})`} />
            ))}
            <circle r="2.6" fill="#C9C77A" />
          </g>
        ))}
        <ellipse cx="-34" cy="4" rx="4" ry="8" fill="#FBF2E6" stroke="#E4CDB6" strokeWidth="0.8" transform="rotate(-30 -34 4)" />
        <ellipse cx="30" cy="-2" rx="3.6" ry="7" fill="#F6DCD6" stroke="#E4C2B8" strokeWidth="0.8" transform="rotate(30 30 -2)" />
      </g>

      {/* A pointed sage leaf with its vein, base at the origin, 50 long */}
      <g id="ve-fl-leaf">
        <path d="M0 0 C14 -12 16 -36 0 -50 C-16 -36 -14 -12 0 0 Z" fill="url(#ve-fl-leaf-g)" />
        <path d="M0 -3 L0 -44" stroke="#C9D8B8" strokeOpacity="0.7" strokeWidth="1" />
      </g>

      {/* A sprig of eucalyptus: round grey-green leaves along a stem */}
      <g id="ve-fl-spray">
        <path d="M0 50 C6 20 -6 -10 4 -50" fill="none" stroke="#7D917A" strokeWidth="1.6" />
        {[[2, 38, 1], [-1, 20, -1], [1, 2, 1], [-1, -16, -1], [2, -34, 1]].map(([x, y, side], i) => (
          <ellipse key={i} cx={x + side * 9} cy={y} rx={9 - i * 0.6} ry={7.5 - i * 0.5} fill="url(#ve-fl-euca-g)" stroke="#6F8E73" strokeOpacity="0.5" strokeWidth="0.6" />
        ))}
        <ellipse cx="4" cy="-50" rx="5" ry="4.5" fill="url(#ve-fl-euca-g)" />
      </g>
    </>
  );
}

/* ─── Placing ───────────────────────────────────────────────────────────── */

const DEF: Record<Bloom | "spray" | "leaf", string> = {
  rose: "ve-fl-rose",
  blush: "ve-fl-blush",
  red: "ve-fl-red",
  plumeriaPink: "ve-fl-peony",
  plumeria: "ve-fl-plumeria",
  orchid: "ve-fl-orchid",
  jasmine: "ve-fl-jasmine",
  spray: "ve-fl-spray",
  leaf: "ve-fl-leaf",
};

function hash(seed: number) {
  return (i: number) => {
    let x = Math.imul(seed + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(i + 1, 0xc2b2ae35);
    x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
    x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };
}

/** One bloom, `size` units across, centred on (x, y) */
export function Flower({ kind, x, y, size, rot = 0, flip = false }: { kind: Bloom | "spray" | "leaf"; x: number; y: number; size: number; rot?: number; flip?: boolean }) {
  const s = r2(size / 100);
  return <use href={`#${DEF[kind]}`} transform={`translate(${r2(x)} ${r2(y)}) rotate(${r2(rot)}) scale(${flip ? -s : s} ${s})`} />;
}

type Placed = { x: number; y: number; size: number; kind: Bloom; rot: number };
const pick = (mix: readonly Bloom[], v: number) => mix[Math.floor(v * mix.length) % mix.length];

/** Leaves fanned out round a point, behind a cluster */
function Foliage({ x, y, w, n, seed }: { x: number; y: number; w: number; n: number; seed: number }) {
  const r = hash(seed + 991);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const a = -80 + (i * 160) / Math.max(1, n - 1) + (r(i) - 0.5) * 16;
        const len = w * (0.42 + r(i + 50) * 0.18);
        return <use key={i} href="#ve-fl-leaf" transform={`translate(${r2(x)} ${r2(y)}) rotate(${r2(a)}) scale(${r2(len / 50)})`} />;
      })}
    </g>
  );
}

/** A dome of flowers standing on (x, y), `w` wide and `h` tall: leaves
    and eucalyptus fanned behind, the larger blooms in front and middle */
export function FlowerBank({ x, y, w, h, n, seed = 1, mix = MIX.wedding, size = 1 }: { x: number; y: number; w: number; h: number; n: number; seed?: number; mix?: readonly Bloom[]; size?: number }) {
  const r = hash(seed);
  const items: Placed[] = Array.from({ length: n }, (_, i) => {
    const u = r(i * 5) * 2 - 1;
    const v = r(i * 5 + 1);
    const top = Math.sqrt(1 - u * u) * h;
    return {
      x: x + u * w * 0.46,
      y: y - v * top * 0.85 - h * 0.1,
      size: (0.2 + 0.12 * (1 - Math.abs(u)) + r(i * 5 + 2) * 0.06) * w * size,
      kind: pick(mix, r(i * 5 + 3)),
      rot: (r(i * 5 + 4) - 0.5) * 60,
    };
  }).sort((a, b) => a.y - b.y);
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx={r2(w * 0.5)} ry={r2(Math.max(2, w * 0.06))} fill="#2E1A10" fillOpacity="0.22" />
      <Foliage x={x} y={y - h * 0.15} w={w} n={9} seed={seed} />
      <Flower kind="spray" x={x - w * 0.42} y={y - h * 0.55} size={w * 0.5} rot={-38} />
      <Flower kind="spray" x={x + w * 0.42} y={y - h * 0.55} size={w * 0.5} rot={38} flip />
      {items.map((b, i) => <Flower key={i} {...b} />)}
    </g>
  );
}

/** A wall of flowers filling a rectangle: greenery first, then blooms set
    in staggered rows, on a soft ground so no gap shows */
export function FlowerWall({ x, y, w, h, cell = 34, seed = 1, mix = MIX.wedding, ground = "#EADBD2" }: { x: number; y: number; w: number; h: number; cell?: number; seed?: number; mix?: readonly Bloom[]; ground?: string }) {
  const r = hash(seed);
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
  const leaves: React.ReactNode[] = [];
  const items: Placed[] = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const k = j * (cols + 1) + i;
      const cx = x + (i + (j % 2) * 0.5) * cell;
      const cy = y + j * cell;
      leaves.push(<use key={k} href="#ve-fl-leaf" transform={`translate(${r2(cx + cell * 0.4)} ${r2(cy + cell * 0.3)}) rotate(${r2(r(k * 4) * 360)}) scale(${r2((cell * 0.55) / 50)})`} />);
      items.push({
        x: cx + (r(k * 4 + 1) - 0.5) * cell * 0.35,
        y: cy + (r(k * 4 + 2) - 0.5) * cell * 0.35,
        size: cell * (0.95 + r(k * 4 + 3) * 0.35),
        kind: pick(mix, r(k * 4 + 3)),
        rot: (r(k * 4 + 1) - 0.5) * 80,
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
        {leaves}
        {items.map((b, i) => <Flower key={i} {...b} />)}
      </g>
    </g>
  );
}

/** Blooms strung along a swag from a to b, sagging by `sag`, with leaves
    trailing between them */
export function Garland({ a, b, sag, n, size, seed = 1, mix = MIX.wedding }: { a: [number, number]; b: [number, number]; sag: number; n: number; size: number; seed?: number; mix?: readonly Bloom[] }) {
  const r = hash(seed);
  const pts = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return { t, x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t + Math.sin(t * Math.PI) * sag };
  });
  return (
    <g>
      {pts.map((p, i) => (
        <use key={`l${i}`} href="#ve-fl-leaf" transform={`translate(${r2(p.x)} ${r2(p.y)}) rotate(${r2(r(i * 3 + 7) * 360)}) scale(${r2((size * 0.7) / 50)})`} />
      ))}
      {pts.map((p, i) => {
        const s = size * (0.75 + 0.35 * Math.sin(p.t * Math.PI)) * (0.85 + r(i * 3) * 0.3);
        return <Flower key={i} kind={pick(mix, r(i * 3 + 1))} x={p.x + (r(i * 3 + 2) - 0.5) * size * 0.3} y={p.y} size={s} rot={(r(i * 3 + 2) - 0.5) * 60} />;
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
      <Flower kind="spray" x={x - 28 * s} y={y - 74 * s} size={40 * s} rot={-24} />
      <Flower kind="spray" x={x + 28 * s} y={y - 74 * s} size={40 * s} rot={24} flip />
      <FlowerBank x={x} y={y - 96 * s} w={92 * s} h={62 * s} n={12} seed={seed} mix={mix} />
    </g>
  );
}
