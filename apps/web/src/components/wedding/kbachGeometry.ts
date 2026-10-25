/* Kbach Khmer drawn in code.

   Every motif is built from a handful of hand-set Bézier outlines (the
   flame tongue, the lancet, the petal, the bud) placed, mirrored and
   layered by small functions, the way a kbach carver builds a panel from
   the same few strokes. A motif is a list of shapes in back-to-front
   order, each with a role that decides how it is painted (gold body,
   engraved line, highlight, ground colour); the renderer is elsewhere, so
   the same geometry can be drawn in the scene or inspected on its own.

   Paths use only absolute M / L / C / Z, so they can be moved, turned and
   mirrored by transforming coordinate pairs. */

export type Role = "gold" | "line" | "shine" | "ground" | "red" | "rope";
export interface Shape {
  d: string;
  role: Role;
  /** stroke width for line / rope / red roles, in the motif's own units */
  w?: number;
}

/* ─── Transforms ────────────────────────────────────────────────────────── */

type M = [number, number, number, number, number, number];

const r2 = (v: number) => Math.round(v * 1000) / 1000;

/** translate(x y) rotate(deg) scale(sx sy) as one matrix */
export function mat(x = 0, y = 0, deg = 0, sx = 1, sy = sx): M {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return [c * sx, s * sx, -s * sy, c * sy, x, y];
}

function tfPath(d: string, m: M) {
  return d.replace(/(-?\d*\.?\d+(?:e-?\d+)?)[ ,]+(-?\d*\.?\d+(?:e-?\d+)?)/g, (_, xs: string, ys: string) => {
    const x = parseFloat(xs), y = parseFloat(ys);
    return `${r2(m[0] * x + m[2] * y + m[4])} ${r2(m[1] * x + m[3] * y + m[5])}`;
  });
}

/** Place a motif: move, turn, scale (and mirror with a negative sx) */
export function place(shapes: Shape[], x = 0, y = 0, deg = 0, sx = 1, sy = Math.abs(sx)): Shape[] {
  const m = mat(x, y, deg, sx, sy);
  const k = Math.sqrt(Math.abs(sx * sy));
  return shapes.map((s) => ({ ...s, d: tfPath(s.d, m), w: s.w === undefined ? undefined : s.w * k }));
}

/** Turn a motif about its own origin */
const rot = (shapes: Shape[], deg: number) => place(shapes, 0, 0, deg);

/** The same shapes plus their mirror image across x = 0 */
function bilateral(shapes: Shape[]) {
  return [...shapes, ...place(shapes, 0, 0, 0, -1, 1)];
}

/* ─── Curves ────────────────────────────────────────────────────────────── */

export type Pt = readonly [number, number];
export type Cubic = readonly [Pt, Pt, Pt, Pt];

export function bez(c: Cubic, t: number): Pt {
  const u = 1 - t;
  const f = (i: 0 | 1) => u * u * u * c[0][i] + 3 * u * u * t * c[1][i] + 3 * u * t * t * c[2][i] + t * t * t * c[3][i];
  return [f(0), f(1)];
}
export function bezAngle(c: Cubic, t: number) {
  const u = 1 - t;
  const f = (i: 0 | 1) => 3 * u * u * (c[1][i] - c[0][i]) + 6 * u * t * (c[2][i] - c[1][i]) + 3 * t * t * (c[3][i] - c[2][i]);
  return Math.atan2(f(1), f(0));
}
const cubicD = (c: Cubic) => `M${c[0].join(" ")} C${c[1].join(" ")} ${c[2].join(" ")} ${c[3].join(" ")}`;

export function circle(cx: number, cy: number, r: number) {
  // Four cubic arcs, so it can be moved and scaled like any other path
  const k = 0.5523 * r;
  return `M${r2(cx)} ${r2(cy - r)} C${r2(cx + k)} ${r2(cy - r)} ${r2(cx + r)} ${r2(cy - k)} ${r2(cx + r)} ${r2(cy)} C${r2(cx + r)} ${r2(cy + k)} ${r2(cx + k)} ${r2(cy + r)} ${r2(cx)} ${r2(cy + r)} C${r2(cx - k)} ${r2(cy + r)} ${r2(cx - r)} ${r2(cy + k)} ${r2(cx - r)} ${r2(cy)} C${r2(cx - r)} ${r2(cy - k)} ${r2(cx - k)} ${r2(cy - r)} ${r2(cx)} ${r2(cy - r)} Z`;
}

/* ─── The strokes ───────────────────────────────────────────────────────── */

/* Flame tongue (the unit of kbach phni tes): a round bulb at the base
   holding a spiral eye, a waist, then a tall body that sweeps into a sharp
   tip thrown over to the right. Base at the origin, about 1.1 tall. */
const TONGUE =
  "M0 0 C-0.17 0 -0.27 -0.1 -0.26 -0.23 C-0.25 -0.36 -0.12 -0.43 -0.1 -0.56 C-0.08 -0.72 -0.12 -0.86 0 -0.98 C0.07 -1.05 0.16 -1.07 0.26 -1.12 C0.13 -1.01 0.08 -0.92 0.1 -0.79 C0.12 -0.63 0.23 -0.51 0.23 -0.32 C0.23 -0.12 0.13 0 0 0 Z";
/* The same flame with its back cut into two smaller tongues */
const TONGUE_NOTCHED =
  "M0 0 C-0.17 0 -0.27 -0.1 -0.26 -0.23 C-0.25 -0.36 -0.12 -0.43 -0.1 -0.56 C-0.08 -0.72 -0.12 -0.86 0 -0.98 C0.07 -1.05 0.16 -1.07 0.26 -1.12 C0.13 -1.01 0.07 -0.93 0.08 -0.82 C0.16 -0.78 0.24 -0.8 0.33 -0.88 C0.33 -0.76 0.27 -0.66 0.15 -0.62 C0.23 -0.58 0.32 -0.6 0.4 -0.66 C0.39 -0.52 0.3 -0.44 0.23 -0.38 C0.25 -0.16 0.14 0 0 0 Z";
/* Vein from the tip down the middle, ending in the spiral eye of the bulb */
const TONGUE_VEIN = "M0.14 -0.98 C0.02 -0.86 0.02 -0.64 -0.02 -0.5 C-0.06 -0.38 -0.17 -0.33 -0.16 -0.2 C-0.15 -0.07 0.04 -0.06 0.06 -0.17 C0.07 -0.25 -0.03 -0.28 -0.06 -0.21";
/* Light along the left flank */
const TONGUE_SHINE = "M-0.19 -0.16 C-0.24 -0.3 -0.16 -0.4 -0.13 -0.5 C-0.12 -0.38 -0.18 -0.3 -0.15 -0.16 Z M-0.07 -0.64 C-0.06 -0.76 -0.07 -0.84 0 -0.93 C-0.03 -0.82 -0.03 -0.74 -0.05 -0.62 Z";

/** One flame tongue, raised in gold with its vein and spiral */
export function tongue(notched = false): Shape[] {
  return [
    { d: notched ? TONGUE_NOTCHED : TONGUE, role: "gold", w: 0.025 },
    { d: TONGUE_SHINE, role: "shine" },
    { d: TONGUE_VEIN, role: "line", w: 0.03 },
  ];
}

/** A flame whose back is cut into tongues: the standard kbach phni tes */
export const flame = () => tongue(true);

/* Lancet: the symmetric flame, rising from a pair of spirals; used where
   flames radiate from a centre (base at origin, 1 tall) */
const LANCET = "M0 0 C-0.22 -0.06 -0.26 -0.3 -0.14 -0.5 C-0.07 -0.64 -0.02 -0.8 0 -1 C0.02 -0.8 0.07 -0.64 0.14 -0.5 C0.26 -0.3 0.22 -0.06 0 0 Z";
const LANCET_CURLS = "M0 -0.6 C0 -0.42 -0.02 -0.3 -0.1 -0.24 C-0.17 -0.18 -0.15 -0.08 -0.08 -0.09 C-0.03 -0.1 -0.03 -0.16 -0.07 -0.17 M0 -0.6 C0 -0.42 0.02 -0.3 0.1 -0.24 C0.17 -0.18 0.15 -0.08 0.08 -0.09 C0.03 -0.1 0.03 -0.16 0.07 -0.17";
export function lancet(): Shape[] {
  return [
    { d: LANCET, role: "gold", w: 0.025 },
    { d: "M-0.08 -0.5 C-0.07 -0.62 -0.04 -0.76 0 -0.9 C-0.02 -0.76 -0.03 -0.64 -0.05 -0.5 Z", role: "shine" },
    { d: LANCET_CURLS, role: "line", w: 0.028 },
  ];
}

/* Petal of the pka chan, pointing up from the centre: a dome that draws
   to a point, an S-scroll curling inside each flank and a pointed heart */
const PETAL = "M-0.24 -0.3 C-0.48 -0.4 -0.5 -0.66 -0.3 -0.78 C-0.18 -0.85 -0.06 -0.88 0 -1.02 C0.06 -0.88 0.18 -0.85 0.3 -0.78 C0.5 -0.66 0.48 -0.4 0.24 -0.3 Z";
const PETAL_SCROLL = "M-0.03 -0.36 C-0.3 -0.4 -0.36 -0.62 -0.2 -0.68 C-0.08 -0.72 -0.04 -0.6 -0.12 -0.56";
const PETAL_HEART = "M0 -0.44 C-0.08 -0.56 -0.08 -0.72 0 -0.88 C0.08 -0.72 0.08 -0.56 0 -0.44 Z";
const ALMOND = "M0 -0.26 C-0.17 -0.42 -0.17 -0.66 0 -0.88 C0.17 -0.66 0.17 -0.42 0 -0.26 Z";
const ALMOND_IN = "M0 -0.38 C-0.08 -0.48 -0.08 -0.62 0 -0.74 C0.08 -0.62 0.08 -0.48 0 -0.38 Z";

/** Raised boss: a disc ringed with beads round a four-point star */
export function boss(r: number, beads = 12): Shape[] {
  const out: Shape[] = [{ d: circle(0, 0, r), role: "gold", w: r * 0.06 }];
  for (let i = 0; i < beads; i++) {
    const a = (i / beads) * Math.PI * 2;
    out.push({ d: circle(Math.cos(a) * r * 0.74, Math.sin(a) * r * 0.74, r * 0.15), role: "gold", w: r * 0.04 });
  }
  out.push({ d: circle(0, 0, r * 0.5), role: "line", w: r * 0.06 });
  const s = r * 0.42, q = r * 0.1;
  out.push({ d: `M0 ${r2(-s)} C${r2(q)} ${r2(-q)} ${r2(q)} ${r2(-q)} ${r2(s)} 0 C${r2(q)} ${r2(q)} ${r2(q)} ${r2(q)} 0 ${r2(s)} C${r2(-q)} ${r2(q)} ${r2(-q)} ${r2(q)} ${r2(-s)} 0 C${r2(-q)} ${r2(-q)} ${r2(-q)} ${r2(-q)} 0 ${r2(-s)} Z`, role: "shine" });
  return out;
}

/* ─── Motifs ────────────────────────────────────────────────────────────── */

/** Pka chan: four pointed dome petals with scrolls, almond leaves between,
    and a beaded boss (radius 1) */
export function pkaChan(): Shape[] {
  const out: Shape[] = [];
  for (const r of [45, 135, 225, 315]) out.push(...rot([{ d: ALMOND, role: "gold", w: 0.025 }, { d: ALMOND_IN, role: "line", w: 0.02 }], r));
  const petal: Shape[] = [
    { d: PETAL, role: "gold", w: 0.03 },
    { d: PETAL_SCROLL, role: "line", w: 0.03 },
    { d: tfPath(PETAL_SCROLL, [-1, 0, 0, 1, 0, 0]), role: "line", w: 0.03 },
    { d: PETAL_HEART, role: "shine" },
  ];
  for (const r of [0, 90, 180, 270]) out.push(...rot(petal, r));
  out.push(...boss(0.3));
  return out;
}

/** Diamond rosette: a gilded diamond with flames standing at its corners,
    an eight-petal flower inside sending lancet flames to the corners and
    sides (radius ~1.35) */
export function rosette(): Shape[] {
  const out: Shape[] = [];
  const spray = [...place(tongue(), -0.04, 0, -30, -0.36, 0.36), ...place(tongue(), 0.04, 0, 30, 0.36), ...place(lancet(), 0, 0.02, 0, 0.4)];
  for (const r of [0, 90, 180, 270]) out.push(...rot(place(spray, 0, -0.98), r));
  out.push({ d: "M0 -1 L1 0 L0 1 L-1 0 Z", role: "gold", w: 0.03 });
  out.push({ d: "M0 -0.88 L0.88 0 L0 0.88 L-0.88 0 Z", role: "ground" });
  out.push({ d: "M0 -0.82 L0.82 0 L0 0.82 L-0.82 0 Z", role: "line", w: 0.016 });
  for (const r of [0, 90, 180, 270]) out.push(...rot(place(lancet(), 0, -0.16, 0, 0.6), r));
  for (const r of [45, 135, 225, 315]) out.push(...rot(place(lancet(), 0, -0.16, 0, 0.36), r));
  for (let i = 0; i < 8; i++) out.push(...rot([{ d: "M0 -0.07 C-0.1 -0.1 -0.13 -0.24 0 -0.3 C0.13 -0.24 0.1 -0.1 0 -0.07 Z", role: "gold", w: 0.012 }], i * 45 + 22.5));
  out.push(...boss(0.15, 8));
  return out;
}

/** Lotus bud, layered: two outer petals opening, a tall pointed centre */
export function bud(): Shape[] {
  return [
    { d: "M0 0 C-0.3 -0.06 -0.44 -0.3 -0.34 -0.6 C-0.24 -0.4 -0.12 -0.2 0 -0.12 Z", role: "gold", w: 0.025 },
    { d: "M0 0 C0.3 -0.06 0.44 -0.3 0.34 -0.6 C0.24 -0.4 0.12 -0.2 0 -0.12 Z", role: "gold", w: 0.025 },
    { d: "M0 0 C-0.22 -0.12 -0.24 -0.5 0 -1 C0.24 -0.5 0.22 -0.12 0 0 Z", role: "gold", w: 0.025 },
    { d: "M0 -0.14 C-0.1 -0.3 -0.1 -0.56 0 -0.84 C0.1 -0.56 0.1 -0.3 0 -0.14 Z", role: "line", w: 0.02 },
    { d: "M-0.06 -0.2 C-0.14 -0.4 -0.12 -0.6 -0.04 -0.8 C-0.08 -0.6 -0.08 -0.4 -0.06 -0.2 Z", role: "shine" },
  ];
}

/* The teardrop's outline, left half from the foot to the tip */
const DROP_L: Cubic = [[0, 1], [-0.86, 1], [-0.8, -0.1], [0, -1.12]];

/** Kbach phni teardrop panel: a gilded rim fringed with flames, two great
    notched flames sweeping up from the base, and a lotus bud on a beaded
    stem rising between them over a pka chan (height ~2.6, centred) */
export function teardrop(): Shape[] {
  const out: Shape[] = [];
  const fringe: Shape[] = [];
  for (let i = 0; i < 8; i++) {
    const t = 0.1 + (i * 0.78) / 7;
    const [x, y] = bez(DROP_L, t);
    const phi = (bezAngle(DROP_L, t) * 180) / Math.PI;
    const s = 0.4 - i * 0.02;
    fringe.push(...place(tongue(), x, y, phi * 0.55 + 10, -s, s));
  }
  out.push(...bilateral(fringe));
  out.push(...place(lancet(), 0, -1.06, 0, 0.42));
  out.push({ d: "M0 1 C-0.86 1 -0.8 -0.1 0 -1.12 C0.8 -0.1 0.86 1 0 1 Z", role: "gold", w: 0.03 });
  out.push({ d: "M0 0.9 C-0.74 0.9 -0.68 -0.06 0 -0.98 C0.68 -0.06 0.74 0.9 0 0.9 Z", role: "ground" });
  out.push({ d: "M0 0.84 C-0.66 0.84 -0.62 -0.04 0 -0.9 C0.62 -0.04 0.66 0.84 0 0.84 Z", role: "line", w: 0.016 });
  out.push(...bilateral(place(flame(), -0.1, 0.8, -14, -0.9, 0.9)));
  out.push({ d: "M0 0.62 L0 -0.2", role: "rope", w: 0.045 });
  out.push(...place(bud(), 0, -0.14, 0, 0.6));
  out.push(...place(pkaChan(), 0, 0.6, 45, 0.24));
  return out;
}

/** Naga crest, as on the feet of a gable: a neck curling up into a spiral
    head, its back fringed with flames that grow toward the head (base at
    origin, faces left, ~1.7 tall) */
export function naga(): Shape[] {
  const neck: Cubic = [[0, 0], [-0.1, -0.5], [-0.62, -0.62], [-0.56, -1.08]];
  const out: Shape[] = [];
  for (let i = 0; i < 5; i++) {
    const t = 0.14 + i * 0.19;
    const [x, y] = bez(neck, t);
    const a = (bezAngle(neck, t) * 180) / Math.PI;
    out.push(...place(flame(), x + 0.05, y, a + 90 + 28, 0.42 + i * 0.08));
  }
  const neckD = `${cubicD(neck)} C-0.5 -1.42 -0.06 -1.4 -0.06 -1.14 C-0.06 -0.94 -0.32 -0.94 -0.32 -1.1`;
  out.push({ d: neckD, role: "rope", w: 0.22 });
  out.push({ d: neckD, role: "red", w: 0.06 });
  out.push(...place(flame(), -0.58, -1.28, -34, -0.62, 0.62));
  out.push(...place(boss(0.5, 8), -0.19, -1.12, 0, 0.22));
  return out;
}

/** Hanging pendant (kbach phni ta): a beaded knot with flames curling out
    and down either side, an inverted lotus and a long drop (top at the
    origin, ~1.25 long) */
export function pendant(): Shape[] {
  const out: Shape[] = [];
  out.push(...bilateral(place(flame(), -0.1, 0.06, 180 + 24, 0.5)));
  out.push({ d: "M-0.2 0.1 C-0.28 0.3 -0.2 0.48 0 0.58 C0.2 0.48 0.28 0.3 0.2 0.1 C0.12 0.16 -0.12 0.16 -0.2 0.1 Z", role: "gold", w: 0.025 });
  out.push({ d: "M-0.1 0.18 C-0.14 0.32 -0.09 0.43 0 0.5 C0.09 0.43 0.14 0.32 0.1 0.18", role: "line", w: 0.02 });
  out.push({ d: "M0 0.54 C-0.11 0.66 -0.1 0.86 0 1.25 C0.1 0.86 0.11 0.66 0 0.54 Z", role: "gold", w: 0.025 });
  out.push({ d: "M0 0.64 C-0.04 0.74 -0.04 0.9 0 1.08", role: "line", w: 0.018 });
  out.push(...place(boss(0.5, 8), 0, 0.04, 0, 0.22));
  return out;
}

/** Flame crest for a lintel or ridge: a lancet flame standing between two
    smaller flames that lean away from it, one unit wide on a baseline at
    y = 0, so a row of them reads as a crown */
export function edgeUnit(): Shape[] {
  return [
    ...place(tongue(), -0.18, 0, -16, -0.46, 0.46),
    ...place(tongue(), 0.18, 0, 16, 0.46),
    ...place(lancet(), 0, 0.02, 0, 0.72),
  ];
}

/** Strip of kbach for a door post: pka chan in diamond frames, joined by
    mirrored flames. One repeat, 1 wide and 2 tall, centred */
export function stripUnit(): Shape[] {
  const out: Shape[] = [];
  const pair = bilateral(place(flame(), -0.06, 0.04, -132, 0.4));
  out.push(...pair, ...rot(pair, 180));
  out.push({ d: "M0 -0.98 L0.46 -0.52 L0 -0.06 L-0.46 -0.52 Z", role: "gold", w: 0.02 });
  out.push({ d: "M0 0.06 L0.46 0.52 L0 0.98 L-0.46 0.52 Z", role: "gold", w: 0.02 });
  out.push({ d: "M0 -0.9 L0.38 -0.52 L0 -0.14 L-0.38 -0.52 Z", role: "ground" });
  out.push({ d: "M0 0.14 L0.38 0.52 L0 0.9 L-0.38 0.52 Z", role: "ground" });
  out.push(...place(pkaChan(), 0, -0.52, 0, 0.32));
  out.push(...place(pkaChan(), 0, 0.52, 0, 0.32));
  return out;
}

/* ─── Rope: twisted gold cord laid along a path ─────────────────────────── */

type Seg = { a: Pt; b: Pt } | { c: Cubic };

/** Beads of a twisted cord along line and curve segments, each a short
    ellipse set slantwise across the path */
export function ropeAlong(segs: Seg[], step: number, width: number): Shape[] {
  const pts: { p: Pt; a: number }[] = [];
  for (const sg of segs) {
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      if ("c" in sg) pts.push({ p: bez(sg.c, t), a: bezAngle(sg.c, t) });
      else pts.push({ p: [sg.a[0] + (sg.b[0] - sg.a[0]) * t, sg.a[1] + (sg.b[1] - sg.a[1]) * t], a: Math.atan2(sg.b[1] - sg.a[1], sg.b[0] - sg.a[0]) });
    }
  }
  const e = `M${-step * 0.62} 0 C${-step * 0.62} ${-width * 0.5} ${step * 0.62} ${-width * 0.5} ${step * 0.62} 0 C${step * 0.62} ${width * 0.5} ${-step * 0.62} ${width * 0.5} ${-step * 0.62} 0 Z`;
  const out: Shape[] = [];
  let acc = step;
  for (let i = 1; i < pts.length; i++) {
    acc += Math.hypot(pts[i].p[0] - pts[i - 1].p[0], pts[i].p[1] - pts[i - 1].p[1]);
    if (acc < step) continue;
    acc = 0;
    out.push(...place([{ d: e, role: "gold", w: width * 0.12 }], pts[i].p[0], pts[i].p[1], (pts[i].a * 180) / Math.PI + 50));
  }
  return out;
}

/* ─── The gable (khlong thvear) ─────────────────────────────────────────── */

/* Left half of the stepped opening, foot to apex */
const OPEN_L: Seg[] = [
  { a: [-0.62, 0], b: [-0.62, -0.82] },
  { a: [-0.62, -0.82], b: [-0.52, -0.82] },
  { a: [-0.52, -0.82], b: [-0.52, -1.0] },
  { a: [-0.52, -1.0], b: [-0.42, -1.0] },
  { a: [-0.42, -1.0], b: [-0.42, -1.1] },
  { c: [[-0.42, -1.1], [-0.24, -1.14], [-0.06, -1.38], [0, -1.72]] },
];
const OUTER_L: Cubic = [[-0.9, 0], [-0.9, -0.92], [-0.46, -1.32], [0, -2.02]];

const flipPt = (p: Pt): Pt => [-p[0], p[1]];
/** The right half, apex to foot: the left half mirrored and reversed */
const OPEN_R: Seg[] = OPEN_L.slice()
  .reverse()
  .map((s) => ("c" in s ? { c: [flipPt(s.c[3]), flipPt(s.c[2]), flipPt(s.c[1]), flipPt(s.c[0])] as Cubic } : { a: flipPt(s.b), b: flipPt(s.a) }));

function segsPath(segs: Seg[]) {
  const f = (p: Pt) => `${r2(p[0])} ${r2(p[1])}`;
  return segs.map((s) => ("c" in s ? `C${f(s.c[1])} ${f(s.c[2])} ${f(s.c[3])}` : `L${f(s.b)}`)).join(" ");
}

/** Gilded gable over a stepped opening: flames climbing its outer edge,
    naga crests curling out at its feet, a bud finial, and a frame of gold,
    crimson and twisted cord. Feet on y = 0, 2.6 wide, ~2.5 tall. The
    opening is a "ground" shape, so the silk colour shows through it. */
export function gable(): Shape[] {
  const out: Shape[] = [];
  // A crest of flames along the outer edge: many, fine and close-set,
  // growing a little toward the feet; notched and plain ones alternate,
  // and the left ones are mirrored so every tip throws outward
  const flames: Shape[] = [];
  const n = 15;
  for (let i = 0; i < n; i++) {
    const t = 0.03 + (i * 0.9) / (n - 1);
    const [x, y] = bez(OUTER_L, t);
    const phi = (bezAngle(OUTER_L, t) * 180) / Math.PI;
    const s = 0.34 - (i * 0.1) / (n - 1);
    flames.push(...place(i % 2 ? tongue() : flame(), x, y, phi * 0.55 + 4, -s, s));
  }
  out.push(...bilateral(flames));
  // Finial: a tall lancet over a lotus bud over a small pka chan
  out.push(...place(lancet(), 0, -1.98, 0, 0.46));
  out.push(...place(bud(), 0, -1.9, 0, 0.3));
  out.push(...place(pkaChan(), 0, -1.92, 45, 0.07));
  // Naga crests at the feet, turning outward
  out.push(...place(naga(), -0.88, 0.02, 0, 0.44));
  out.push(...place(naga(), 0.88, 0.02, 0, -0.44, 0.44));
  // Gold body between the crest and the frame
  const outer = `${cubicD(OUTER_L)} C${-OUTER_L[2][0]} ${OUTER_L[2][1]} ${-OUTER_L[1][0]} ${OUTER_L[1][1]} ${-OUTER_L[0][0]} ${OUTER_L[0][1]} Z`;
  out.push({ d: outer, role: "gold", w: 0.02 });
  // Carved into it: an engraved border, a running band of small lancets
  // standing out from it like a relief, and pka chan bosses spaced along
  // the middle of the band
  const INNER: Cubic = [[-0.84, 0], [-0.84, -0.87], [-0.43, -1.26], [0, -1.93]];
  const MID: Cubic = [[-0.76, 0], [-0.76, -0.82], [-0.39, -1.18], [0, -1.83]];
  out.push({ d: "M-0.84 0 C-0.84 -0.87 -0.43 -1.26 0 -1.93 C0.43 -1.26 0.84 -0.87 0.84 0", role: "line", w: 0.012 });
  const relief: Shape[] = [];
  for (let i = 0; i < 22; i++) {
    const t = 0.03 + (i * 0.92) / 21;
    const [x, y] = bez(INNER, t);
    const phi = (bezAngle(INNER, t) * 180) / Math.PI;
    relief.push(...place(lancet(), x, y, phi * 0.85, 0.075));
  }
  for (const t of [0.16, 0.42, 0.68]) {
    const [x, y] = bez(MID, t);
    relief.push(...place(pkaChan(), x, y, 45, 0.055));
  }
  out.push(...bilateral(relief));
  out.push({ d: "M-0.7 0 C-0.7 -0.78 -0.36 -1.12 0 -1.78 C0.36 -1.12 0.7 -0.78 0.7 0", role: "line", w: 0.01 });
  // The opening, then its frame: a slim gold band, crimson inside it, a
  // fine twisted cord, and a hairline of gold just inside the opening
  const frame = `M-0.62 0 ${segsPath(OPEN_L)} ${segsPath(OPEN_R)}`;
  out.push({ d: `${frame} Z`, role: "ground" });
  out.push({ d: frame, role: "rope", w: 0.15 });
  out.push({ d: frame, role: "red", w: 0.085 });
  out.push(...ropeAlong([...OPEN_L, ...OPEN_R], 0.026, 0.04));
  out.push(...place([{ d: frame, role: "rope", w: 0.012 }], 0, 0, 0, 0.86, 0.95));
  return out;
}
