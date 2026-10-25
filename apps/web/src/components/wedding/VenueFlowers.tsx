import React from "react";

/* Flowers for the wedding hall, drawn as flowers rather than dots.

   Garden roses in three colours (blush, ivory, deep red), each built from
   three rings of shaded petals round a curled heart; frangipani (champa,
   the Khmer wedding flower) with its yellow throat; rose buds; leaves with
   veins; and sprays of baby's breath. Each is defined once (FlowerDefs) and
   placed with <use>, and every shape is styled with attributes only, so the
   layer can be flattened into an image.

   Arrangements are scattered by an integer hash, identical on the server
   and in every browser. */

const r2 = (v: number) => Math.round(v * 100) / 100;

const PETAL = "M0 0 C-0.62 -0.12 -0.8 -0.78 -0.32 -1 C-0.12 -1.08 0.12 -1.08 0.32 -1 C0.8 -0.78 0.62 -0.12 0 0 Z";
const PETAL_LIP = "M-0.34 -0.97 C-0.12 -1.03 0.12 -1.03 0.34 -0.97";
const CHAMPA = "M0 0 C-0.42 -0.16 -0.5 -0.82 -0.08 -1.02 C0.3 -1.08 0.42 -0.62 0.14 -0.32 C0.08 -0.2 0.04 -0.1 0 0 Z";
const LEAF = "M0 0 C0.3 -0.24 0.34 -0.72 0 -1 C-0.34 -0.72 -0.3 -0.24 0 0 Z";

const ROSES = {
  blush: ["#B4566A", "#EBA4A9", "#FFE7E3"],
  ivory: ["#C9A27E", "#F3E3CF", "#FFFDF7"],
  red: ["#5E0E18", "#A3222F", "#E06A6E"],
} as const;
export type RoseColour = keyof typeof ROSES;

function Rose({ id, c }: { id: string; c: readonly [string, string, string] }) {
  const ring = (n: number, scale: number, offset: number, lip: string) =>
    Array.from({ length: n }, (_, i) => (
      <g key={`${scale}-${i}`} transform={`rotate(${r2(offset + (i * 360) / n)}) scale(${scale})`}>
        <path d={PETAL} fill={`url(#${id}-g)`} stroke={c[0]} strokeWidth="0.03" strokeOpacity="0.5" />
        <path d={PETAL_LIP} fill="none" stroke={lip} strokeWidth="0.06" strokeOpacity="0.85" strokeLinecap="round" />
      </g>
    ));
  return (
    <>
      <linearGradient id={`${id}-g`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor={c[0]} />
        <stop offset="0.55" stopColor={c[1]} />
        <stop offset="1" stopColor={c[2]} />
      </linearGradient>
      <radialGradient id={`${id}-h`} cx="0.42" cy="0.4" r="0.6">
        <stop offset="0" stopColor={c[0]} />
        <stop offset="1" stopColor={c[1]} />
      </radialGradient>
      {/* Gradients stay direct children of <defs>: the layer flattening
          finds definitions there by id */}
      <g id={id}>
      <circle r="1.02" fill="#2E1A10" fillOpacity="0.25" transform="translate(0.06 0.1)" />
      {ring(5, 1, 0, c[2])}
      {ring(5, 0.78, 36, c[2])}
      {ring(4, 0.56, 14, c[2])}
      {/* The curled heart: a cup with petals wrapped round it in a spiral */}
      <ellipse rx="0.34" ry="0.3" fill={`url(#${id}-h)`} />
      <path d="M-0.26 0.04 C-0.28 -0.24 0.22 -0.32 0.27 -0.04 C0.3 0.18 0 0.27 -0.12 0.12 C-0.2 0.01 -0.06 -0.14 0.07 -0.06 C0.14 -0.01 0.08 0.08 0.01 0.05" fill="none" stroke={c[2]} strokeWidth="0.06" strokeLinecap="round" strokeOpacity="0.9" />
      <path d="M-0.26 0.04 C-0.28 -0.24 0.22 -0.32 0.27 -0.04" fill="none" stroke={c[0]} strokeWidth="0.03" strokeOpacity="0.6" transform="translate(0.02 0.03)" />
      </g>
    </>
  );
}

/** Every flower definition the arrangements use; goes inside a <defs> */
export function FlowerDefs() {
  return (
    <>
      <Rose id="ve-rose-blush" c={ROSES.blush} />
      <Rose id="ve-rose-ivory" c={ROSES.ivory} />
      <Rose id="ve-rose-red" c={ROSES.red} />
      <linearGradient id="ve-champa-g" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#EFA82A" />
        <stop offset="0.32" stopColor="#FBE3A0" />
        <stop offset="0.7" stopColor="#FFFCF2" />
        <stop offset="1" stopColor="#FFFFFF" />
      </linearGradient>
      <g id="ve-champa">
        <circle r="0.95" fill="#2E1A10" fillOpacity="0.2" transform="translate(0.06 0.1)" />
        {Array.from({ length: 5 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 72})`}>
            <path d={CHAMPA} fill="url(#ve-champa-g)" stroke="#D9C49A" strokeWidth="0.025" />
            <path d="M-0.04 -0.18 C-0.12 -0.42 -0.12 -0.7 0 -0.9" fill="none" stroke="#E8D5AE" strokeWidth="0.03" />
          </g>
        ))}
        <circle r="0.1" fill="#E9A225" />
      </g>
      <linearGradient id="ve-leaf-g" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#24401C" />
        <stop offset="0.6" stopColor="#4F7A3A" />
        <stop offset="1" stopColor="#7FA75E" />
      </linearGradient>
      <g id="ve-leaf">
        <path d={LEAF} fill="url(#ve-leaf-g)" stroke="#1E3517" strokeWidth="0.02" />
        <path d="M0 -0.04 L0 -0.9 M0 -0.3 L0.14 -0.42 M0 -0.3 L-0.14 -0.42 M0 -0.56 L0.12 -0.66 M0 -0.56 L-0.12 -0.66" stroke="#A6C887" strokeWidth="0.025" strokeOpacity="0.7" fill="none" />
      </g>
      <linearGradient id="ve-bud-g" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#A63A4C" />
        <stop offset="1" stopColor="#F4B9B6" />
      </linearGradient>
      <g id="ve-bud">
        <path d="M0 0 C-0.3 -0.2 -0.26 -0.7 0 -1 C0.26 -0.7 0.3 -0.2 0 0 Z" fill="url(#ve-bud-g)" stroke="#8A2C3C" strokeWidth="0.03" />
        <path d="M0 0 C-0.3 -0.06 -0.4 -0.36 -0.36 -0.5 C-0.2 -0.36 -0.1 -0.2 0 -0.12 C0.1 -0.2 0.2 -0.36 0.36 -0.5 C0.4 -0.36 0.3 -0.06 0 0 Z" fill="#4F7A3A" />
      </g>
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

const use = (href: string, x: number, y: number, s: number, deg = 0) => (
  <use href={href} transform={`translate(${r2(x)} ${r2(y)})${deg ? ` rotate(${r2(deg)})` : ""} scale(${r2(s)})`} />
);

/** A dome of flowers: leaves fanned behind, roses (larger towards the
    middle), frangipani, buds and baby's breath. (x, y) is the base of
    the dome, about 90·s wide and 50·s tall. */
export function Arrangement({ x, y, s = 1, seed = 1, palette = ["blush", "ivory", "blush", "red", "ivory"] }: { x: number; y: number; s?: number; seed?: number; palette?: RoseColour[] }) {
  const h = hash(seed);
  const leaves = Array.from({ length: 11 }, (_, i) => {
    const a = -80 + (i * 160) / 10 + (h(i) - 0.5) * 14;
    return use("#ve-leaf", x + Math.sin((a * Math.PI) / 180) * 30 * s, y - 12 * s, (16 + h(i + 40) * 8) * s, a);
  });
  // Roses on a dome: row by row, the middle ones larger and higher
  const blooms: { x: number; y: number; r: number; kind: string }[] = [];
  let k = 0;
  for (const [row, n, ry] of [[0, 5, 0], [1, 4, -12], [2, 3, -23], [3, 1, -32]] as const) {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const width = [44, 34, 22, 0][row];
      const r = (8.5 + (1 - Math.abs(t)) * 3 + h(k + 80) * 2.2) * s;
      const roll = h(k + 120);
      const kind = roll < 0.18 ? "#ve-champa" : `#ve-rose-${palette[Math.floor(h(k + 160) * palette.length)]}`;
      blooms.push({ x: x + t * 2 * width * s + (h(k + 200) - 0.5) * 4 * s, y: y + ry * s - 4 * s + (h(k + 240) - 0.5) * 3 * s, r, kind });
      k++;
    }
  }
  const buds = Array.from({ length: 4 }, (_, i) => {
    const side = i % 2 ? 1 : -1;
    return use("#ve-bud", x + side * (18 + h(i + 300) * 22) * s, y - (26 + h(i + 320) * 12) * s, (9 + h(i + 340) * 3) * s, side * (18 + h(i + 360) * 22));
  });
  const breath = Array.from({ length: 22 }, (_, i) => {
    const a = Math.PI * (1.05 + h(i + 400) * 0.9);
    const rr = (34 + h(i + 420) * 16) * s;
    return <circle key={i} cx={r2(x + Math.cos(a) * rr)} cy={r2(y - 8 * s + Math.sin(a) * rr * 0.75)} r={r2((1.1 + h(i + 440) * 1.1) * s)} fill="#FFFDF7" stroke="#E2D6C2" strokeWidth={r2(0.3 * s)} />;
  });
  return (
    <g>
      <ellipse cx={x} cy={y + 2 * s} rx={46 * s} ry={7 * s} fill="#2E1A10" fillOpacity="0.22" />
      {leaves.map((l, i) => <React.Fragment key={i}>{l}</React.Fragment>)}
      {breath}
      {buds.map((b, i) => <React.Fragment key={i}>{b}</React.Fragment>)}
      {blooms.map((b, i) => <React.Fragment key={i}>{use(b.kind, b.x, b.y, b.r, h(i + 500) * 72)}</React.Fragment>)}
    </g>
  );
}

/** A tall gilded stand with an arrangement spilling over its bowl, for the
    sides of the stage; (x, y) is the foot, about 150·s tall */
export function FlowerStand({ x, y, s = 1, seed = 1 }: { x: number; y: number; s?: number; seed?: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={22 * s} ry={4 * s} fill="#2E1A10" fillOpacity="0.25" />
      <path d={`M${r2(x - 18 * s)} ${y} L${r2(x + 18 * s)} ${y} L${r2(x + 7 * s)} ${r2(y - 10 * s)} L${r2(x - 7 * s)} ${r2(y - 10 * s)} Z`} fill="url(#ve-gold)" />
      <rect x={r2(x - 3.5 * s)} y={r2(y - 92 * s)} width={r2(7 * s)} height={r2(84 * s)} fill="url(#ve-gold-h)" />
      {[0.3, 0.62].map((f) => (
        <ellipse key={f} cx={x} cy={r2(y - 10 * s - 82 * s * f)} rx={r2(6 * s)} ry={r2(3 * s)} fill="url(#ve-gold)" />
      ))}
      <path d={`M${r2(x - 26 * s)} ${r2(y - 100 * s)} C${r2(x - 24 * s)} ${r2(y - 86 * s)} ${r2(x + 24 * s)} ${r2(y - 86 * s)} ${r2(x + 26 * s)} ${r2(y - 100 * s)} Z`} fill="url(#ve-gold)" />
      <Arrangement x={x} y={y - 98 * s} s={0.72 * s} seed={seed} />
      {/* Trailing stems spilling over the bowl */}
      {[-1, 1].map((side) => (
        <g key={side}>
          <path d={`M${r2(x + side * 20 * s)} ${r2(y - 98 * s)} C${r2(x + side * 34 * s)} ${r2(y - 80 * s)} ${r2(x + side * 30 * s)} ${r2(y - 58 * s)} ${r2(x + side * 36 * s)} ${r2(y - 44 * s)}`} fill="none" stroke="#3E6230" strokeWidth={r2(1.6 * s)} />
          {use("#ve-leaf", x + side * 30 * s, y - 72 * s, 9 * s, side * 120)}
          {use(side < 0 ? "#ve-rose-ivory" : "#ve-rose-blush", x + side * 34 * s, y - 50 * s, 6 * s, 20)}
          {use("#ve-bud", x + side * 36 * s, y - 44 * s, 7 * s, side * 160)}
        </g>
      ))}
    </g>
  );
}
