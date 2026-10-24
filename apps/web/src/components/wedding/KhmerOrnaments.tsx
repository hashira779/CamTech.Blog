"use client";

import React, { useId } from "react";

/* Solid gold ornaments in a Khmer-inspired vocabulary: a lotus blossom, an
   eight-petal medallion and curling vines with leaves and scrolls.

   These are original designs inspired by Khmer decorative motifs (the
   lotus, the floral rosette and flowing foliage), not copies of a
   documented carving. Each is built in three layers so it reads as raised
   metal rather than pen work: a dark underlay offset down-right (the edge
   in shadow), the gold body, and a light highlight on the upper-left. */

const GOLD_STOPS = (
  <>
    <stop offset="0" stopColor="#F1D683" />
    <stop offset="0.45" stopColor="#D4AF37" />
    <stop offset="1" stopColor="#8C6D37" />
  </>
);

function useGradientId(prefix: string) {
  return `${prefix}-${useId().replace(/[:]/g, "")}`;
}

/* ─── Medallion: eight layered petals round a raised centre ─────────────── */

const OUTER_PETAL = "M0 0 C-6 -9 -7 -24 0 -38 C7 -24 6 -9 0 0 Z";
const INNER_PETAL = "M0 0 C-5 -7 -5.5 -16 0 -25 C5.5 -16 5 -7 0 0 Z";

function MedallionShapes({ gold, centre }: { gold: string; centre: string }) {
  return (
    <>
      {/* Underlay: the shadowed edge of the raised petals */}
      <g transform="translate(1 1.4)" fill="#5E4520" opacity="0.55">
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={OUTER_PETAL} transform={`rotate(${i * 45})`} />)}
      </g>
      <g fill={`url(#${gold})`}>
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={OUTER_PETAL} transform={`rotate(${i * 45})`} />)}
      </g>
      <g fill={`url(#${gold})`} stroke="#8C6D37" strokeWidth="0.5" strokeOpacity="0.6">
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={INNER_PETAL} transform={`rotate(${i * 45 + 22.5})`} />)}
      </g>
      {/* Highlight along the upper-left of each outer petal */}
      <g fill="#FFF1C4" opacity="0.45">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d="M-1 -6 C-4 -14 -4.5 -24 -0.5 -33 C-2 -24 -1.6 -14 -1 -6 Z" transform={`rotate(${i * 45})`} />
        ))}
      </g>
      {/* Raised centre: a pistil ringed with seeds */}
      <circle r="9" fill="#6B4E1E" opacity="0.5" transform="translate(0.8 1)" />
      <circle r="9" fill={`url(#${centre})`} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <circle key={i} cx={Math.cos(a) * 5.4} cy={Math.sin(a) * 5.4} r="1.1" fill="#8C6D37" opacity="0.75" />;
      })}
    </>
  );
}

export function KhmerMedallion({ className = "w-12 h-12" }: { className?: string }) {
  const gold = useGradientId("km-gold");
  const centre = useGradientId("km-centre");
  return (
    <svg viewBox="-42 -42 84 84" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">{GOLD_STOPS}</linearGradient>
        <radialGradient id={centre} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#FFF0C0" />
          <stop offset="0.6" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#7A5A24" />
        </radialGradient>
      </defs>
      <MedallionShapes gold={gold} centre={centre} />
    </svg>
  );
}

/* ─── Lotus divider: a blossom with vines running out to either side ───── */

/* One side's vine (the right; the left is its mirror): a long S-curved stem
   with leaves on alternate sides and two scrolls curling back on it */
const STEM = "M18 0 C40 -10 66 10 92 2 C116 -6 138 6 160 0 C176 -4 188 2 196 0";
const LEAVES = [
  { x: 44, y: -4, r: -28, s: 1 },
  { x: 70, y: 5, r: 160, s: 0.9 },
  { x: 104, y: -2, r: -20, s: 0.95 },
  { x: 132, y: 4, r: 155, s: 0.8 },
  { x: 168, y: -2, r: -15, s: 0.7 },
];
const LEAF = "M0 0 C4 -4 12 -5 18 0 C12 5 4 4 0 0 Z";
const SCROLLS = ["M86 2 C86 -8 98 -12 102 -5 C105 0 99 4 96 0", "M150 1 C152 9 141 13 137 7 C134 2 140 -1 143 2"];

function Vine({ gold }: { gold: string }) {
  return (
    <g>
      <path d={STEM} fill="none" stroke="#5E4520" strokeOpacity="0.5" strokeWidth="3.2" strokeLinecap="round" transform="translate(0.6 0.9)" />
      <path d={STEM} fill="none" stroke={`url(#${gold})`} strokeWidth="2.4" strokeLinecap="round" />
      <path d={STEM} fill="none" stroke="#FFF1C4" strokeOpacity="0.45" strokeWidth="0.7" strokeLinecap="round" transform="translate(-0.4 -0.6)" />
      {SCROLLS.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="#5E4520" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" transform="translate(0.5 0.7)" />
          <path d={d} fill="none" stroke={`url(#${gold})`} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
      {LEAVES.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r}) scale(${l.s})`}>
          <path d={LEAF} fill="#5E4520" opacity="0.5" transform="translate(0.6 0.9)" />
          <path d={LEAF} fill={`url(#${gold})`} />
          <path d="M1 0 C6 -1 12 -1 17 0" fill="none" stroke="#8C6D37" strokeWidth="0.5" />
        </g>
      ))}
      <circle cx="198" cy="0" r="2.4" fill={`url(#${gold})`} />
    </g>
  );
}

/* The blossom, seen from the side: a tall centre petal, two pairs opening
   outward and a cupped base, each petal with its own shadowed edge */
const BLOSSOM = [
  "M0 6 C-7 -4 -7 -16 0 -28 C7 -16 7 -4 0 6 Z",
  "M0 6 C-8 0 -16 -8 -19 -20 C-10 -18 -3 -9 0 6 Z",
  "M0 6 C8 0 16 -8 19 -20 C10 -18 3 -9 0 6 Z",
  "M0 6 C-10 4 -22 -1 -27 -10 C-16 -11 -6 -5 0 6 Z",
  "M0 6 C10 4 22 -1 27 -10 C16 -11 6 -5 0 6 Z",
  "M-14 6 C-8 12 8 12 14 6 C8 8 -8 8 -14 6 Z",
];

export function LotusMedallionDivider({ className = "w-80 h-auto" }: { className?: string }) {
  const gold = useGradientId("lmd-gold");
  return (
    <svg viewBox="-210 -36 420 56" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">{GOLD_STOPS}</linearGradient>
      </defs>
      <Vine gold={gold} />
      <g transform="scale(-1 1)">
        <Vine gold={gold} />
      </g>
      {/* Blossom: back petals first, centre petal last */}
      {[3, 4, 1, 2, 0, 5].map((i) => (
        <g key={i}>
          <path d={BLOSSOM[i]} fill="#5E4520" opacity="0.5" transform="translate(0.8 1.1)" />
          <path d={BLOSSOM[i]} fill={`url(#${gold})`} stroke="#8C6D37" strokeWidth="0.45" strokeOpacity="0.7" />
        </g>
      ))}
      <path d="M-1 2 C-4 -6 -4.5 -14 -0.8 -24 C-2 -14 -1.8 -6 -1 2 Z" fill="#FFF1C4" opacity="0.55" />
    </svg>
  );
}

/* ─── Vine corner: foliage turning round a card corner ──────────────────── */

const CORNER_STEM = "M6 116 C4 80 10 48 30 28 C48 10 80 4 116 6";
const CORNER_INNER = "M16 116 C15 88 22 62 38 44";
const CORNER_SCROLLS = ["M30 28 C22 34 18 26 24 22 C28 19 32 23 29 26", "M60 11 C66 18 58 24 54 18 C51 14 56 11 58 14", "M10 70 C18 72 18 62 12 62 C8 62 8 67 11 67"];
const CORNER_LEAVES = [
  { x: 8, y: 92, r: -60 }, { x: 18, y: 50, r: -40 }, { x: 44, y: 20, r: -20 }, { x: 84, y: 7, r: 10 }, { x: 22, y: 82, r: 40 }, { x: 70, y: 16, r: 60 },
];

export function VineCorner({ className = "w-16 h-16", flip = "" }: { className?: string; flip?: "" | "x" | "y" | "xy" }) {
  const gold = useGradientId("vc-gold");
  const transform = { "": "", x: "scaleX(-1)", y: "scaleY(-1)", xy: "scale(-1)" }[flip];
  return (
    <svg viewBox="0 0 120 120" className={className} style={{ transform }} aria-hidden="true">
      <defs>
        <linearGradient id={gold} x1="0" y1="1" x2="1" y2="0">{GOLD_STOPS}</linearGradient>
      </defs>
      {[CORNER_STEM, CORNER_INNER].map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="#5E4520" strokeOpacity="0.45" strokeWidth={i ? 1.8 : 2.8} strokeLinecap="round" transform="translate(0.6 0.9)" />
          <path d={d} fill="none" stroke={`url(#${gold})`} strokeWidth={i ? 1.3 : 2.1} strokeLinecap="round" />
        </g>
      ))}
      {CORNER_SCROLLS.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={`url(#${gold})`} strokeWidth="1.3" strokeLinecap="round" />
      ))}
      {CORNER_LEAVES.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r})`}>
          <path d={LEAF} fill="#5E4520" opacity="0.45" transform="translate(0.5 0.8)" />
          <path d={LEAF} fill={`url(#${gold})`} />
          <path d="M1 0 C6 -1 12 -1 17 0" fill="none" stroke="#8C6D37" strokeWidth="0.5" />
        </g>
      ))}
      <g transform="translate(116 6) scale(0.16)">
        <MedallionShapes gold={gold} centre={gold} />
      </g>
    </svg>
  );
}
