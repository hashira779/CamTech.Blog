"use client";

import React, { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { OrnamentSlot } from "@/lib/wedding-ornaments";
import { leavesAlong, type Pt } from "./KhmerKbach";
import { bud, edgeUnit, flame, gable, lancet, naga, pendant, pkaChan, place, rosette, stripUnit, teardrop, tongue, type Shape } from "./kbachGeometry";

/* Kbach Khmer for the wedding-hall scene.

   The motifs are drawn in code in kbachGeometry.ts (flame tongues with
   their spiral eyes, the pka chan, the diamond rosette, the teardrop
   panel, naga crests, pendants, the gilded gable); this file paints them
   in raised gold and defines each once, so the scene places hundreds of
   them with <use> at the cost of one drawing each.

   The definitions are added on the client only: they are decorative, the
   scene sits behind the opening envelope at first, and it keeps a few
   hundred kilobytes of path data out of the server HTML.

   A couple can replace any of these with their own ornament image (a
   transparent PNG) per place in the scene; see lib/wedding-ornaments.ts.
   Where they have, the pieces, bands, strips and wall silk below draw that
   image instead, in the same spot. */

const r2 = (v: number) => Math.round(v * 100) / 100;

/* ─── Painting ──────────────────────────────────────────────────────────── */

const EDGE = "#6E4A12";

/** Paint a motif: gold bodies with a dark edge and a soft shadow below,
    engraved lines, highlights, and the ground colour where it shows */
export function Paint({ shapes, ground = "#5A1414" }: { shapes: Shape[]; ground?: string }) {
  return (
    <>
      {shapes.map((s, i) => {
        switch (s.role) {
          case "gold":
            return (
              <g key={i}>
                <path d={s.d} fill="#2E1C06" fillOpacity="0.4" transform="translate(0.03 0.04)" />
                <path d={s.d} fill="url(#ve-k-gold)" stroke={EDGE} strokeWidth={s.w ?? 0.02} strokeLinejoin="round" />
              </g>
            );
          case "line":
            return <path key={i} d={s.d} fill="none" stroke="#7A5418" strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" />;
          case "shine":
            return <path key={i} d={s.d} fill="#FFF4CC" fillOpacity="0.55" />;
          case "ground":
            return <path key={i} d={s.d} fill={ground} />;
          case "red":
            return <path key={i} d={s.d} fill="none" stroke="#8B1E1E" strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" />;
          case "rope":
            return (
              <g key={i}>
                <path d={s.d} fill="none" stroke={EDGE} strokeWidth={(s.w ?? 0.1) * 1.18} strokeLinecap="round" strokeLinejoin="round" />
                <path d={s.d} fill="none" stroke="url(#ve-k-gold)" strokeWidth={s.w} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            );
        }
      })}
    </>
  );
}

/* ─── The couple's own ornament images ──────────────────────────────────── */

export interface OrnamentImage {
  url: string;
  /** Natural size, for tiling at the right proportions */
  w: number;
  h: number;
}
export type OrnamentImages = Partial<Record<OrnamentSlot, OrnamentImage>>;

/** The loaded ornament images for the scene being drawn */
export const OrnamentContext = createContext<OrnamentImages>({});

/* ─── Placing ───────────────────────────────────────────────────────────── */

/** One flame tongue: base at (x,y), `angle` degrees clockwise from up,
    `notched` for the full kbach phni tes with its back cut into tongues */
export function Leaf({ x, y, size, angle = 0, flip = false, notched = false }: { x: number; y: number; size: number; angle?: number; flip?: boolean; notched?: boolean }) {
  return <use href={notched ? "#ve-k-flame" : "#ve-k-leaf"} transform={`translate(${r2(x)} ${r2(y)}) rotate(${r2(angle)}) scale(${flip ? -r2(size) : r2(size)} ${r2(size)})`} />;
}

export type PieceId = "chan" | "rosette" | "tear" | "pendant" | "naga" | "crest" | "gable" | "lancet" | "bud";

/* Which uploaded ornament replaces a piece (a rosette names its own, as it
   stands in more than one place), and the box the piece fills in its own
   units at s = 1, with how an image sits in that box */
const PIECE_SLOT: Partial<Record<PieceId, OrnamentSlot>> = { chan: "flower", pendant: "pendant", naga: "naga", tear: "wall_panel", gable: "stage_arch" };
const PIECE_BOX: Partial<Record<PieceId, [number, number, number, number, string]>> = {
  chan: [-28, -28, 56, 56, "xMidYMid"],
  rosette: [-68, -68, 136, 136, "xMidYMid"],
  tear: [-72, -88, 144, 148, "xMidYMid"],
  pendant: [-26, 0, 52, 62, "xMidYMin"],
  naga: [-66, -86, 80, 90, "xMaxYMax"],
  gable: [-1.36, -2.64, 2.72, 2.66, "xMidYMax"],
};

/** A defined piece placed at (x,y). Sizes at s = 1: chan radius 28,
    rosette radius ~68, tear ~150 tall, pendant ~40 long, naga ~80 tall,
    crest 1 wide, gable 2.6 wide (scale it), lancet and bud 1 tall. If the
    couple uploaded an ornament for its place, that image fills the box */
export function Piece({ id, x, y, s = 1, flip = false, rotate = 0, slot }: { id: PieceId; x: number; y: number; s?: number; flip?: boolean; rotate?: number; slot?: OrnamentSlot }) {
  const ornaments = useContext(OrnamentContext);
  const sc = flip ? `${-r2(s)} ${r2(s)}` : `${r2(s)}`;
  const transform = `translate(${r2(x)} ${r2(y)})${rotate ? ` rotate(${rotate})` : ""} scale(${sc})`;
  const place = slot ?? PIECE_SLOT[id];
  const own = place ? ornaments[place] : undefined;
  const box = PIECE_BOX[id];
  if (own && box) {
    return (
      <g transform={transform}>
        <image href={own.url} x={box[0]} y={box[1]} width={box[2]} height={box[3]} preserveAspectRatio={`${box[4]} meet`} />
      </g>
    );
  }
  return <use href={`#ve-k-${id}`} transform={transform} />;
}

/** Flame tongues climbing a curve p0..p3 on its outer side; with `mirror`,
    the mirror image across x = mirror too. On the left of a gable the
    flames are turned to throw their tips outward, as on a carved gable */
export function LeavesAlong({ p, n, big, small, from = 0.04, to = 0.92, lean = 0.55, offset = 3, mirror, notchedEvery = 2 }: { p: [Pt, Pt, Pt, Pt]; n: number; big: number; small: number; from?: number; to?: number; lean?: number; offset?: number; mirror?: number; notchedEvery?: number }) {
  const leaves = leavesAlong(p[0], p[1], p[2], p[3], n, from, to, big, small, lean, offset);
  return (
    <g>
      {leaves.map((l, i) => <Leaf key={`a${i}`} x={l.x} y={l.y} size={l.size} angle={l.angle} flip notched={i % notchedEvery === 0} />)}
      {mirror !== undefined && leaves.map((l, i) => <Leaf key={`b${i}`} x={2 * mirror - l.x} y={l.y} size={l.size} angle={-l.angle} notched={i % notchedEvery === 0} />)}
    </g>
  );
}

/** A straight edge as a cubic, for LeavesAlong */
export function line(a: Pt, b: Pt): [Pt, Pt, Pt, Pt] {
  return [a, [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], [a[0] + ((b[0] - a[0]) * 2) / 3, a[1] + ((b[1] - a[1]) * 2) / 3], b];
}

/** A carved border band (gold kbach on maroon), any size: the pattern is
    32 units tall, so the band is drawn at that height and scaled */
export function Band({ x, y, w, h, vertical = false }: { x: number; y: number; w: number; h: number; vertical?: boolean }) {
  const fill = useContext(OrnamentContext).border ? "url(#ve-o-border)" : "url(#ve-k-band)";
  if (vertical) {
    const s = w / 32;
    return (
      <g transform={`translate(${r2(x + w)} ${r2(y)}) rotate(90) scale(${r2(s)})`}>
        <rect width={r2(h / s)} height="32" fill={fill} />
      </g>
    );
  }
  const s = h / 32;
  return (
    <g transform={`translate(${r2(x)} ${r2(y)}) scale(${r2(s)})`}>
      <rect width={r2(w / s)} height="32" fill={fill} />
    </g>
  );
}

/** A door-post strip: pka chan in diamonds joined by flames, running
    down a rect (the pattern is 64 wide, so it is scaled to the width) */
export function Strip({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const own = useContext(OrnamentContext).post_strip;
  const s = w / 64;
  return (
    <g transform={`translate(${r2(x)} ${r2(y)}) scale(${r2(s)})`}>
      <rect width="64" height={r2(h / s)} fill={own ? "url(#ve-o-strip)" : "url(#ve-k-strip)"} />
    </g>
  );
}

/** A crown of flame crests standing along a line from x0 to x1 at y */
export function Crest({ x0, x1, y, size }: { x0: number; x1: number; y: number; size: number }) {
  const n = Math.max(1, Math.round((x1 - x0) / size));
  const step = (x1 - x0) / n;
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <Piece key={i} id="crest" x={x0 + step * (i + 0.5)} y={y} s={size} />
      ))}
    </g>
  );
}

/* ─── Definitions ───────────────────────────────────────────────────────── */

const noop = () => () => {};

function build() {
  const def = (id: string, shapes: Shape[], s = 1, ground?: string) => (
    <g id={`ve-k-${id}`}>
      <g transform={s === 1 ? undefined : `scale(${s})`}>
        <Paint shapes={shapes} ground={ground} />
      </g>
    </g>
  );
  // Band tile, 64 x 32: a pka chan with notched flames lying out to each
  // side as chevrons, between gold fillets, on maroon
  const bandFlames: Shape[] = [];
  for (const [x, sgn] of [[42, 1], [52, 1], [22, -1], [12, -1]] as const) {
    bandFlames.push(...place(flame(), x, 17, sgn * 64, sgn * 9, 9), ...place(flame(), x, 15, sgn * 116, -sgn * 9, 9));
  }
  return (
    <>
      <linearGradient id="ve-k-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFF0B0" />
        <stop offset="0.35" stopColor="#E8C15A" />
        <stop offset="0.7" stopColor="#B8862B" />
        <stop offset="1" stopColor="#7A5418" />
      </linearGradient>
      {def("leaf", tongue())}
      {def("flame", flame())}
      {def("lancet", lancet())}
      {def("bud", bud())}
      {def("chan", pkaChan(), 28)}
      {def("rosette", rosette(), 50)}
      {def("tear", teardrop(), 58)}
      {def("pendant", pendant(), 32)}
      {def("naga", naga(), 48)}
      {def("crest", edgeUnit())}
      {def("gable", gable(), 1, "url(#ve-silk)")}

      <pattern id="ve-k-band" width="64" height="32" patternUnits="userSpaceOnUse">
        <rect width="64" height="32" fill="#5A1414" />
        <rect y="1" width="64" height="1.8" fill="#D4AF37" />
        <rect y="29.2" width="64" height="1.8" fill="#D4AF37" />
        <Paint shapes={bandFlames} />
        <Paint shapes={place(pkaChan(), 32, 16, 0, 9.5)} />
        <Paint shapes={place(pkaChan(), 0, 16, 45, 4)} />
        <Paint shapes={place(pkaChan(), 64, 16, 45, 4)} />
      </pattern>

      <pattern id="ve-k-strip" width="64" height="112" patternUnits="userSpaceOnUse">
        <rect width="64" height="112" fill="#5A1414" />
        <Paint shapes={place(stripUnit(), 32, 56, 0, 56)} />
        <rect x="1" width="2" height="112" fill="#D4AF37" />
        <rect x="61" width="2" height="112" fill="#D4AF37" />
      </pattern>

      <pattern id="ve-k-lattice" width="72" height="72" patternUnits="userSpaceOnUse">
        <rect width="72" height="72" fill="#4E0F13" />
        <path d="M0 36 L36 0 L72 36 L36 72 Z" fill="none" stroke="#C9A24A" strokeOpacity="0.35" strokeWidth="0.8" />
        <Paint shapes={place(pkaChan(), 36, 36, 0, 15)} ground="#4E0F13" />
        {[[0, 0], [72, 0], [0, 72], [72, 72]].map(([x, y]) => (
          <Paint key={`${x}-${y}`} shapes={place(pkaChan(), x, y, 45, 7)} ground="#4E0F13" />
        ))}
      </pattern>
    </>
  );
}

/* Tiles of the couple's own images, sized to each image's proportions in
   the same units as the drawn patterns they replace: the border 32 tall,
   the gate-post strip 64 wide, the back-wall silk 96 wide */
function OrnamentTiles({ ornaments }: { ornaments: OrnamentImages }) {
  const tile = (id: string, img: OrnamentImage | undefined, w: number, h: number) =>
    img && (
      <pattern id={id} width={r2(w)} height={r2(h)} patternUnits="userSpaceOnUse">
        <image href={img.url} width={r2(w)} height={r2(h)} preserveAspectRatio="none" />
      </pattern>
    );
  const { border, post_strip, wall_pattern } = ornaments;
  return (
    <>
      {tile("ve-o-border", border, border ? (32 * border.w) / border.h : 0, 32)}
      {tile("ve-o-strip", post_strip, 64, post_strip ? (64 * post_strip.h) / post_strip.w : 0)}
      {tile("ve-o-wall", wall_pattern, 96, wall_pattern ? (96 * wall_pattern.h) / wall_pattern.w : 0)}
    </>
  );
}

/** Every kbach definition the scene refers to; goes inside a <defs> */
export function KbachDefs() {
  const client = useSyncExternalStore(noop, () => true, () => false);
  const ornaments = useContext(OrnamentContext);
  const drawn = useMemo(() => (client ? build() : null), [client]);
  return (
    <>
      {drawn}
      <OrnamentTiles ornaments={ornaments} />
    </>
  );
}
