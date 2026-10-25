import React from "react";

/* Gold ornaments for the invitations.

   The couple upload their own kbach (see the editor's Kbach tab); until
   they do, nothing hand-drawn stands in for it. These keep the names the
   card has always used, so every place that once showed a drawn ornament
   now shows plain gold: a fine rule with a diamond, a gold diamond, or
   nothing at all. */

/** A small gold diamond in a fine outline */
export function KbachChan({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="-10 -10 20 20" className={className} aria-hidden="true">
      <path d="M0 -3.6 L3.6 0 L0 3.6 L-3.6 0 Z" fill="#D4AF37" />
      <path d="M0 -6.4 L6.4 0 L0 6.4 L-6.4 0 Z" fill="none" stroke="#D4AF37" strokeOpacity="0.55" strokeWidth="0.6" />
    </svg>
  );
}

/** A fine gold rule fading out to each side of a diamond */
export function KbachBorder({ className = "w-72 h-auto" }: { className?: string }) {
  return (
    <svg viewBox="-232 -10 464 20" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="kb-rule-l" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#D4AF37" stopOpacity="0" />
          <stop offset="1" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      <rect x="-222" y="-0.6" width="206" height="1.2" fill="url(#kb-rule-l)" />
      <rect x="-222" y="-0.6" width="206" height="1.2" fill="url(#kb-rule-l)" transform="scale(-1 1)" />
      <path d="M0 -5 L5 0 L0 5 L-5 0 Z" fill="#D4AF37" />
      <circle cx="-11" cy="0" r="1.6" fill="#D4AF37" />
      <circle cx="11" cy="0" r="1.6" fill="#D4AF37" />
    </svg>
  );
}

/* Places that held a drawn arch, corner spray or burst now hold nothing */
export function KbachArch(props: { className?: string }) {
  void props;
  return null;
}
export function KbachCorner(props: { className?: string; flip?: "" | "x" | "y" | "xy" }) {
  void props;
  return null;
}
export function KbachBurst(props: { className?: string }) {
  void props;
  return null;
}

/* A faint diamond grid, tiled, for section backgrounds */
const LATTICE_TILE =
  "<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'>" +
  "<g fill='none' stroke='%23B8902E' stroke-opacity='.07' stroke-width='.6'><path d='M0 22 L22 0 L44 22 L22 44 Z'/></g></svg>";

export const KBACH_LATTICE_BG = `url("data:image/svg+xml;utf8,${LATTICE_TILE}")`;

/* Leaves along a curve, on its outer side (used to place uploaded kbach
   along the hall's edges) */
export type Pt = readonly [number, number];
function cubic(t: number, a: number, b: number, c: number, d: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}
function cubicD(t: number, a: number, b: number, c: number, d: number) {
  const u = 1 - t;
  return 3 * u * u * (b - a) + 6 * u * t * (c - b) + 3 * t * t * (d - c);
}
export function leavesAlong(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n: number, from: number, to: number, big: number, small: number, lean: number, offset: number) {
  return Array.from({ length: n }, (_, i) => {
    const t = from + ((to - from) * i) / (n - 1);
    const x = cubic(t, p0[0], p1[0], p2[0], p3[0]);
    const y = cubic(t, p0[1], p1[1], p2[1], p3[1]);
    const phi = Math.atan2(cubicD(t, p0[1], p1[1], p2[1], p3[1]), cubicD(t, p0[0], p1[0], p2[0], p3[0]));
    return { x: x + Math.sin(phi) * offset, y: y - Math.cos(phi) * offset, size: big - ((big - small) * i) / (n - 1), angle: ((phi * 180) / Math.PI) * lean };
  });
}
