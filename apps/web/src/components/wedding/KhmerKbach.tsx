"use client";

import React, { useEffect, useId, useRef } from "react";

/* --- Reveal ----------------------------------------------------------------
   Each ornament grows in the first time it scrolls into view: flame-leaves
   sprout in sequence, lines draw, flowers turn and bloom (CSS in
   globals.css, .kb-anim). One IntersectionObserver serves every ornament on
   the page; it only sets data-in, so React never re-renders for it. The
   hidden start state is gated on html.js, so without JS (or with reduced
   motion) every ornament is simply there. */
let sharedObserver: IntersectionObserver | null = null;
function observe(el: Element) {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute("data-in", "");
            sharedObserver?.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.15 }
    );
  }
  sharedObserver.observe(el);
  return () => sharedObserver?.unobserve(el);
}
function useKbachReveal<T extends Element>() {
  const ref = useRef<T>(null);
  useEffect(() => (ref.current ? observe(ref.current) : undefined), []);
  return ref;
}

/* Kbach Khmer ornament set for the invitations.

   Original vector drawings made from the couple's reference sheet of kbach
   motifs (not copies of those images): the flame-leaf (kbach phni tes) as
   the basic unit, a pointed gable arch lined with climbing flame-leaves and
   scrolled at its feet, the four-petal pka chan flower, a chevron border of
   leaves running out from a central flower, J-shaped flame-leaf sprays for
   corners, and a fine flower lattice like woven sampot silk.

   Every solid shape is drawn in three layers so it reads as raised gold:
   a dark underlay offset down-right, the gold body, a pale highlight. */

const GOLD = (
  <>
    <stop offset="0" stopColor="#F4DC8E" />
    <stop offset="0.45" stopColor="#D4AF37" />
    <stop offset="1" stopColor="#8C6D37" />
  </>
);
const SHADE = "#5E4520";
const SHINE = "#FFF3CC";

function useGoldId(prefix: string) {
  return `${prefix}-${useId().replace(/[:]/g, "")}`;
}

/* ─── The flame-leaf (kbach phni tes) ────────────────────────────────────
   Unit leaf, base at the origin, pointing up (−y), one unit long: a full
   lower lobe that narrows into a flame tip leaning right, with a curl
   tucked inside the lobe. */
const LEAF = "M0 0 C-0.36 -0.06 -0.5 -0.34 -0.34 -0.58 C-0.22 -0.76 -0.06 -0.86 0.06 -1.12 C0.1 -0.92 0.2 -0.76 0.27 -0.58 C0.37 -0.34 0.27 -0.08 0 0 Z";
const LEAF_CURL = "M-0.06 -0.14 C-0.24 -0.28 -0.2 -0.5 -0.02 -0.56 C0.08 -0.5 0.06 -0.4 -0.02 -0.38";
const LEAF_SHINE = "M-0.04 -0.12 C-0.28 -0.3 -0.3 -0.56 -0.1 -0.74 C-0.2 -0.56 -0.18 -0.34 -0.04 -0.12 Z";

type LeafProps = { x: number; y: number; size: number; angle: number; flip?: boolean; gold: string; i?: number };

/** One raised flame-leaf, placed at (x,y), `angle` in degrees from pointing up */
function FlameLeaf({ x, y, size, angle, flip, gold, i = 0 }: LeafProps) {
  const t = `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(1)}) scale(${flip ? -size : size} ${size})`;
  const sw = 0.045;
  return (
    <g transform={t}>
      {/* Animated child: a CSS transform here must not replace the placement */}
      <g className="kb-leaf" style={{ "--i": i } as React.CSSProperties}>
      <path d={LEAF} fill={SHADE} opacity="0.5" transform="translate(0.05 0.06)" />
      <path d={LEAF} fill={`url(#${gold})`} stroke="#8C6D37" strokeWidth={sw * 0.6} />
      <path d={LEAF_SHINE} fill={SHINE} opacity="0.5" />
      <path d={LEAF_CURL} fill="none" stroke="#7A5A24" strokeWidth={sw} strokeLinecap="round" />
      </g>
    </g>
  );
}

/* ─── Pka chan: four-petal flower ─────────────────────────────────────── */

const CHAN_PETAL = "M0 0 C-7 -6 -9 -16 0 -28 C9 -16 7 -6 0 0 Z";
const CHAN_INNER = "M0 -4 C-4 -8 -5 -14 0 -20 C5 -14 4 -8 0 -4 Z";
const CHAN_TIP = "M-3 -16 C-6 -19 -3 -23 0 -21";

function ChanShapes({ gold, centre }: { gold: string; centre: string }) {
  return (
    <g className="kb-bloom">
      {[0, 90, 180, 270].map((r) => (
        <g key={r} transform={`rotate(${r})`}>
          <path d={CHAN_PETAL} fill={SHADE} opacity="0.5" transform="translate(1 1.3)" />
          <path d={CHAN_PETAL} fill={`url(#${gold})`} stroke="#8C6D37" strokeWidth="0.5" />
          <path d={CHAN_INNER} fill="#F6E2A0" opacity="0.7" />
          <path d={CHAN_TIP} fill="none" stroke="#7A5A24" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      ))}
      {/* Small leaves in the gaps between petals */}
      {[45, 135, 225, 315].map((r) => (
        <path key={r} d="M0 -6 C-3 -10 -3 -15 0 -18 C3 -15 3 -10 0 -6 Z" transform={`rotate(${r})`} fill={`url(#${gold})`} stroke="#8C6D37" strokeWidth="0.4" />
      ))}
      <circle r="6.5" fill={SHADE} opacity="0.45" transform="translate(0.7 0.9)" />
      <circle r="6.5" fill={`url(#${centre})`} />
      <circle r="3" fill="none" stroke="#8C6D37" strokeWidth="0.6" />
    </g>
  );
}

function CentreGradient({ id }: { id: string }) {
  return (
    <radialGradient id={id} cx="35%" cy="30%" r="75%">
      <stop offset="0" stopColor="#FFF0C0" />
      <stop offset="0.6" stopColor="#D4AF37" />
      <stop offset="1" stopColor="#7A5A24" />
    </radialGradient>
  );
}

export function KbachChan({ className = "w-10 h-10" }: { className?: string }) {
  const gold = useGoldId("kc-gold");
  const ref = useKbachReveal<SVGSVGElement>();
  const centre = useGoldId("kc-centre");
  return (
    <svg ref={ref} viewBox="-31 -31 62 62" className={`kb-anim ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">{GOLD}</linearGradient>
        <CentreGradient id={centre} />
      </defs>
      <ChanShapes gold={gold} centre={centre} />
    </svg>
  );
}

/* ─── Pointed gable arch, lined with climbing flame-leaves ────────────── */

/* Left half of the arch as a cubic from the foot to the apex: broad
   shoulders, then a steep rise to the spire, like a temple gable */
const ARCH = { foot: [22, 204], c1: [20, 118], c2: [66, 64], apex: [100, 26] } as const;

function cubic(t: number, a: number, b: number, c: number, d: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}
function cubicD(t: number, a: number, b: number, c: number, d: number) {
  const u = 1 - t;
  return 3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c);
}

/* Leaves along a curve, on its outer (left-of-travel) side. A leaf's
   rotation 0 points up; the outward normal of a curve heading at angle φ
   works out to rotate(φ), and `lean` pulls each flame toward upright */
export type Pt = readonly [number, number];
export function leavesAlong(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number, from: number, to: number, big: number, small: number, lean: number, offset: number) {
  return Array.from({ length: n }, (_, i) => {
    const t = from + ((to - from) * i) / (n - 1);
    const x = cubic(t, p0[0], p1[0], p2[0], p3[0]);
    const y = cubic(t, p0[1], p1[1], p2[1], p3[1]);
    const dx = cubicD(t, p0[0], p1[0], p2[0], p3[0]);
    const dy = cubicD(t, p0[1], p1[1], p2[1], p3[1]);
    const phi = Math.atan2(dy, dx);
    const nx = Math.sin(phi), ny = -Math.cos(phi); // left-of-travel unit normal
    return { x: x + nx * offset, y: y + ny * offset, size: big - ((big - small) * i) / (n - 1), angle: ((phi * 180) / Math.PI) * lean };
  });
}

const ARCH_LEAVES = leavesAlong(ARCH.foot, ARCH.c1, ARCH.c2, ARCH.apex, 13, 0.04, 0.9, 30, 15, 0.55, 3);

const ARCH_PATH = `M${ARCH.foot[0]} ${ARCH.foot[1]} C${ARCH.c1.join(" ")} ${ARCH.c2.join(" ")} ${ARCH.apex.join(" ")} C${200 - ARCH.c2[0]} ${ARCH.c2[1]} ${200 - ARCH.c1[0]} ${ARCH.c1[1]} ${200 - ARCH.foot[0]} ${ARCH.foot[1]}`;

export function KbachArch({ className = "w-24 h-28" }: { className?: string }) {
  const gold = useGoldId("ka-gold");
  const ref = useKbachReveal<SVGSVGElement>();
  const centre = useGoldId("ka-centre");
  return (
    <svg ref={ref} viewBox="-18 -2 236 226" className={`kb-anim ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">{GOLD}</linearGradient>
        <CentreGradient id={centre} />
      </defs>
      {/* The arch band: gold with a crimson inner line, as on a temple gable */}
      <path d={ARCH_PATH} fill="none" stroke={SHADE} strokeOpacity="0.45" strokeWidth="9" transform="translate(1 1.4)" />
      <path className="kb-draw" pathLength={1} d={ARCH_PATH} fill="none" stroke={`url(#${gold})`} strokeWidth="8" strokeLinecap="round" />
      <path className="kb-draw" pathLength={1} d={ARCH_PATH} fill="none" stroke="#8B1E1E" strokeWidth="2.2" strokeLinecap="round" transform="translate(0 4)" />
      {/* Climbing flame-leaves, mirrored on the right side */}
      {ARCH_LEAVES.map((l, i) => (
        <FlameLeaf key={`l${i}`} gold={gold} x={l.x} y={l.y} size={l.size} angle={l.angle} i={i} />
      ))}
      {ARCH_LEAVES.map((l, i) => (
        <FlameLeaf key={`r${i}`} gold={gold} x={200 - l.x} y={l.y} size={l.size} angle={-l.angle} flip i={i} />
      ))}
      {/* Scrolled feet */}
      {[[22, 206, 1], [178, 206, -1]].map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s} 1)`}>
          <path d="M0 0 C-14 2 -22 -8 -18 -18 C-14 -26 -4 -24 -4 -16 C-4 -10 -10 -10 -11 -14" fill="none" stroke={SHADE} strokeOpacity="0.45" strokeWidth="6" transform="translate(1 1.3)" strokeLinecap="round" />
          <path d="M0 0 C-14 2 -22 -8 -18 -18 C-14 -26 -4 -24 -4 -16 C-4 -10 -10 -10 -11 -14" fill="none" stroke={`url(#${gold})`} strokeWidth="5" strokeLinecap="round" />
        </g>
      ))}
      {/* Spire: a flower bud on the apex */}
      <g transform="translate(100 18)"><g className="kb-leaf" style={{ "--i": 14 } as React.CSSProperties}>
        <path d="M0 -16 C-6 -8 -6 0 0 6 C6 0 6 -8 0 -16 Z" fill={SHADE} opacity="0.45" transform="translate(1 1.2)" />
        <path d="M0 -16 C-6 -8 -6 0 0 6 C6 0 6 -8 0 -16 Z" fill={`url(#${gold})`} stroke="#8C6D37" strokeWidth="0.6" />
        <circle cy="7" r="3.2" fill={`url(#${centre})`} />
      </g></g>
    </svg>
  );
}

/* ─── Chevron border: leaves running out from a central flower ────────── */

export function KbachBorder({ className = "w-72 h-auto" }: { className?: string }) {
  const gold = useGoldId("kb-gold");
  const ref = useKbachReveal<SVGSVGElement>();
  const centre = useGoldId("kb-centre");
  // Pairs of leaves, one above and one below the line, each pair a chevron
  // pointing outward, shrinking toward the ends
  const pairs = Array.from({ length: 9 }, (_, i) => ({ x: 30 + i * 21, size: 26 - i * 1.3 }));
  return (
    <svg ref={ref} viewBox="-232 -30 464 60" className={`kb-anim ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">{GOLD}</linearGradient>
        <CentreGradient id={centre} />
      </defs>
      <path className="kb-draw" pathLength={1} d="M0 0 H222" stroke={`url(#${gold})`} strokeWidth="1.4" strokeLinecap="round" />
      <path className="kb-draw" pathLength={1} d="M0 0 H-222" stroke={`url(#${gold})`} strokeWidth="1.4" strokeLinecap="round" />
      {[1, -1].map((side) =>
        pairs.map((l, i) => (
          <g key={`${side}${i}`} transform={side < 0 ? "scale(-1 1)" : undefined}>
            <FlameLeaf gold={gold} x={l.x} y={-1} size={l.size} angle={62} i={i + 2} />
            <g transform="scale(1 -1)">
              <FlameLeaf gold={gold} x={l.x} y={-1} size={l.size * 0.9} angle={62} i={i + 2} />
            </g>
          </g>
        ))
      )}
      {[222, -222].map((x) => <circle key={x} cx={x} cy="0" r="3" fill={`url(#${centre})`} />)}
      <g transform="scale(0.92)">
        <ChanShapes gold={gold} centre={centre} />
      </g>
    </svg>
  );
}

/* ─── Corner spray: flame-leaves rising along a J curve ───────────────── */

export function KbachCorner({ className = "w-16 h-16", flip = "" }: { className?: string; flip?: "" | "x" | "y" | "xy" }) {
  const gold = useGoldId("kk-gold");
  const ref = useKbachReveal<SVGSVGElement>();
  const transform = { "": "", x: "scaleX(-1)", y: "scaleY(-1)", xy: "scale(-1)" }[flip];
  // Stem from the bottom-left corner up and round along the top edge
  const P0: Pt = [10, 114], P1: Pt = [6, 50], P2: Pt = [44, 8], P3: Pt = [114, 10];
  const stem = `M${P0.join(" ")} C${P1.join(" ")} ${P2.join(" ")} ${P3.join(" ")}`;
  const outer = leavesAlong(P0, P1, P2, P3, 10, 0.06, 0.92, 26, 13, 0.6, 2);
  const inner = leavesAlong(P3, P2, P1, P0, 6, 0.12, 0.7, 15, 10, 0.6, 2); // smaller leaves on the inside
  return (
    <svg ref={ref} viewBox="-14 -14 140 140" className={`kb-anim ${className}`} style={{ transform }} aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="1" x2="1" y2="0">{GOLD}</linearGradient>
      </defs>
      <path d={stem} fill="none" stroke={SHADE} strokeOpacity="0.45" strokeWidth="4" transform="translate(0.8 1.1)" strokeLinecap="round" />
      <path className="kb-draw" pathLength={1} d={stem} fill="none" stroke={`url(#${gold})`} strokeWidth="3.2" strokeLinecap="round" />
      {inner.map((l, i) => <FlameLeaf key={`i${i}`} gold={gold} x={l.x} y={l.y} size={l.size} angle={l.angle} flip i={8 - i} />)}
      {outer.map((l, i) => <FlameLeaf key={`o${i}`} gold={gold} x={l.x} y={l.y} size={l.size} angle={l.angle} i={i} />)}
      <path d="M10 114 C2 106 6 94 15 96 C21 98 19 107 13 106" fill="none" stroke={`url(#${gold})`} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* --- Burst: a ring of flame-leaves round the wax seal ---------------------
   Hidden until the envelope opens (.is-opening on an ancestor), then the
   leaves fan outward from the seal and fade, like a blessing scattering */
export function KbachBurst({ className = "w-64 h-64" }: { className?: string }) {
  const gold = useGoldId("kx-gold");
  const n = 12;
  return (
    <svg viewBox="-100 -100 200 200" className={`kb-burst ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">{GOLD}</linearGradient>
      </defs>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`rotate(${(i / n) * 360})`}>
          <g className="kb-burst-leaf" style={{ "--i": i % 3 } as React.CSSProperties}>
            <FlameLeaf gold={gold} x={0} y={-30} size={i % 2 ? 26 : 34} angle={0} />
          </g>
        </g>
      ))}
    </svg>
  );
}

/* ─── Background lattice: tiny pka chan on a diagonal grid ─────────────
   As a tiled data-URI so whole sections can carry it at very low contrast,
   like the woven pattern of a sampot */
const LATTICE_TILE =
  "<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'>" +
  "<g fill='none' stroke='%23B8902E' stroke-opacity='.07' stroke-width='.6'><path d='M0 22 L22 0 L44 22 L22 44 Z'/></g>" +
  "<g fill='%23C59B27' fill-opacity='.11'>" +
  "<path d='M22 14 C20 17 20 19 22 22 C24 19 24 17 22 14 Z'/><path d='M22 30 C20 27 20 25 22 22 C24 25 24 27 22 30 Z'/>" +
  "<path d='M14 22 C17 20 19 20 22 22 C19 24 17 24 14 22 Z'/><path d='M30 22 C27 20 25 20 22 22 C25 24 27 24 30 22 Z'/>" +
  "<circle cx='22' cy='22' r='1.6'/><circle cx='0' cy='0' r='1.2'/><circle cx='44' cy='0' r='1.2'/><circle cx='0' cy='44' r='1.2'/><circle cx='44' cy='44' r='1.2'/></g></svg>";

export const KBACH_LATTICE_BG = `url("data:image/svg+xml;utf8,${LATTICE_TILE}")`;
