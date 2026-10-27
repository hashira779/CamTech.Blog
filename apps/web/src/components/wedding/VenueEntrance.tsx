"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import type { WeddingOrnaments } from "@/lib/wedding-ornaments";
import { CoupleNames } from "./CoupleNames";
import { FlowerBank, FlowerWall, Flower, Garland, MIX, PhotoFlowerDefs, PhotoFlowerStand } from "./VenuePhotoFlowers";
import { Band, KbachDefs, OrnamentContext, Piece, Strip, type OrnamentImage, type OrnamentImages } from "./VenueKbach";

/* The opening of the invitation: arriving at a Khmer wedding hall.

   A layered 2.5D scene. Each depth plane (sky, garden horizon, the hall,
   the path, the flower arch; then inside: the far wall and stage, the
   middle pillars, the near drapes) is its own SVG on its own compositor
   layer, and the "camera" is a scroll-scrubbed GSAP timeline that scales
   and slides those planes at different rates around the doorway and then
   the stage. Transforms only, so the motion runs on the GPU.

   The venue is a modern reception hall dressed the way Khmer weddings are:
   real flowers everywhere (cut-out photographs, see VenuePhotoFlowers), a
   flower wall behind the stage with crystal strands and white drapes, and
   the couple's names in gold. Kbach appears only where the couple upload
   their own ornament images; nothing is drawn in its place. */

const VB = "0 0 1600 900";

export interface VenueEntranceProps {
  groom: string;
  bride: string;
  /** Small line above the names, e.g. "The wedding of" */
  kicker: string;
  dateLine: string;
  timeLine?: string;
  venue?: string;
  guestLine?: string;
  /** A real photo of the couple; omitted when they haven't uploaded one */
  portrait?: string;
  khmerNames: boolean;
  scrollHint: string;
  /** The couple's own kbach ornament images, by place in the scene */
  ornaments?: WeddingOrnaments;
}

/* ─── Shared bits ───────────────────────────────────────────────────────── */

function Defs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ve-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E9D6B8" />
          <stop offset="0.45" stopColor="#F6DDB3" />
          <stop offset="0.62" stopColor="#FBE3BA" />
          <stop offset="1" stopColor="#E9CFA2" />
        </linearGradient>
        <radialGradient id="ve-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF4D6" stopOpacity="1" />
          <stop offset="0.35" stopColor="#FFE1A3" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFE1A3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ve-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EADFCB" />
          <stop offset="0.5" stopColor="#E2D3B8" />
          <stop offset="1" stopColor="#C9B490" />
        </linearGradient>
        <radialGradient id="ve-floor-shine" cx="0.5" cy="0" r="0.75">
          <stop offset="0" stopColor="#FFF4D8" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#FFF4D8" stopOpacity="0.25" />
          <stop offset="1" stopColor="#FFF4D8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ve-doorway-glow" cx="0.5" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#FFF8E6" />
          <stop offset="0.45" stopColor="#FFE2A8" />
          <stop offset="1" stopColor="#E9B36A" />
        </radialGradient>
        {/* The nearest plane is a little out of focus, like a camera
            looking past it at the hall */}
        <filter id="ve-near-soft" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        <linearGradient id="ve-path" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2E5CC" />
          <stop offset="1" stopColor="#D9C4A0" />
        </linearGradient>
        <linearGradient id="ve-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4EBDB" />
          <stop offset="1" stopColor="#D8C6A6" />
        </linearGradient>
        <linearGradient id="ve-stone-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E9DCC3" />
          <stop offset="0.5" stopColor="#F7EFE0" />
          <stop offset="1" stopColor="#C9B591" />
        </linearGradient>
        <linearGradient id="ve-roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9E3A26" />
          <stop offset="1" stopColor="#6E2116" />
        </linearGradient>
        <linearGradient id="ve-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F1D683" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#8C6D37" />
        </linearGradient>
        <linearGradient id="ve-gold-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8C6D37" />
          <stop offset="0.5" stopColor="#F1D683" />
          <stop offset="1" stopColor="#8C6D37" />
        </linearGradient>
        <radialGradient id="ve-door" cx="0.5" cy="0.62" r="0.7">
          <stop offset="0" stopColor="#FFF3D2" />
          <stop offset="0.5" stopColor="#FFD58F" />
          <stop offset="1" stopColor="#B86A2A" />
        </radialGradient>
        <linearGradient id="ve-bay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5B2E14" />
          <stop offset="1" stopColor="#B9783A" />
        </linearGradient>
        <radialGradient id="ve-lamp" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE9B5" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFC56E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ve-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF8EA" stopOpacity="0" />
          <stop offset="0.5" stopColor="#FFF8EA" stopOpacity="0.75" />
          <stop offset="1" stopColor="#FFF8EA" stopOpacity="0" />
        </linearGradient>
        {/* Interior */}
        <linearGradient id="ve-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F3E6CF" />
          <stop offset="1" stopColor="#E2CDA8" />
        </linearGradient>
        <linearGradient id="ve-wall-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#CDB48C" />
          <stop offset="1" stopColor="#EBDBBF" />
        </linearGradient>
        <linearGradient id="ve-wall-side-r" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#CDB48C" />
          <stop offset="1" stopColor="#EBDBBF" />
        </linearGradient>
        <radialGradient id="ve-wall-shade" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.35" stopColor="#1A0806" stopOpacity="0" />
          <stop offset="1" stopColor="#1A0806" stopOpacity="0.45" />
        </radialGradient>
        <linearGradient id="ve-ceiling" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B2414" />
          <stop offset="1" stopColor="#7A5634" />
        </linearGradient>
        <linearGradient id="ve-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8D7BA" />
          <stop offset="0.35" stopColor="#C9AE83" />
          <stop offset="1" stopColor="#8E7150" />
        </linearGradient>
        <linearGradient id="ve-floor-glow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE2A6" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FFE2A6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ve-aisle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8E1E24" />
          <stop offset="1" stopColor="#5A0F14" />
        </linearGradient>
        <linearGradient id="ve-silk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6E1418" />
          <stop offset="0.5" stopColor="#A42A2E" />
          <stop offset="1" stopColor="#6E1418" />
        </linearGradient>
        <radialGradient id="ve-stage-light" cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#FFF0C8" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFF0C8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ve-chandelier" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF6DC" stopOpacity="1" />
          <stop offset="0.4" stopColor="#FFDA92" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FFDA92" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ve-name-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF8EC" stopOpacity="0.92" />
          <stop offset="0.6" stopColor="#FFF8EC" stopOpacity="0.6" />
          <stop offset="1" stopColor="#FFF8EC" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ve-facade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFBF3" />
          <stop offset="1" stopColor="#EADBC1" />
        </linearGradient>
        <radialGradient id="ve-window" cx="0.5" cy="0.6" r="0.7">
          <stop offset="0" stopColor="#FFF1CF" />
          <stop offset="0.6" stopColor="#F6C978" />
          <stop offset="1" stopColor="#B87A36" />
        </radialGradient>
        {/* White fabric: soft folds repeated across the width of the cloth */}
        <linearGradient id="ve-fold" x1="0" y1="0" x2="0.09" y2="0" spreadMethod="repeat">
          <stop offset="0" stopColor="#FFFDF8" />
          <stop offset="0.45" stopColor="#F3EADC" />
          <stop offset="0.7" stopColor="#E2D5C0" />
          <stop offset="1" stopColor="#FFFDF8" />
        </linearGradient>
        <linearGradient id="ve-drape-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="1" stopColor="#B9A27E" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="ve-chair-cover" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E9DFCC" />
          <stop offset="0.4" stopColor="#FFFCF4" />
          <stop offset="1" stopColor="#D9CBB0" />
        </linearGradient>
        {/* Guest chair in an ivory cover, a gold sash tied in a bow at the
            back; feet at the origin, ~50 tall */}
        <g id="ve-chair">
          <ellipse cx="0" cy="-1" rx="19" ry="3" fill="#5E4520" fillOpacity="0.22" />
          <path d="M-15 -25 L15 -25 L17.5 -2 L-17.5 -2 Z" fill="url(#ve-chair-cover)" />
          <path d="M-7 -24 L-8 -3 M0 -24 L0 -3 M7 -24 L8 -3" stroke="#C9B898" strokeWidth="0.8" strokeOpacity="0.7" />
          <path d="M-13 -25 L-13 -44 C-13 -52 13 -52 13 -44 L13 -25 Z" fill="url(#ve-chair-cover)" stroke="#D3C19C" strokeWidth="0.6" />
          <rect x="-13" y="-33" width="26" height="6" fill="url(#ve-gold-h)" />
          <path d="M0 -30 C-6 -37 -12 -34 -9 -29 C-7 -26 -3 -28 0 -30 Z M0 -30 C6 -37 12 -34 9 -29 C7 -26 3 -28 0 -30 Z" fill="url(#ve-gold)" stroke="#8C6D37" strokeWidth="0.5" />
          <path d="M-1 -29 L-4 -16 L-1.5 -17.5 Z M1 -29 L4 -16 L1.5 -17.5 Z" fill="url(#ve-gold)" />
          <circle cx="0" cy="-30" r="1.8" fill="#F1D683" />
        </g>
        <PhotoFlowerDefs />
        <KbachDefs />
        <clipPath id="ve-portrait-clip">
          <ellipse cx="800" cy="450" rx="60" ry="80" />
        </clipPath>
        <clipPath id="ve-door-clip">
          <path d="M752 522 L752 438 Q800 404 848 438 L848 522 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

/* ─── Fabric, light and furniture ───────────────────────────────────────── */

const rr = (v: number) => Math.round(v * 100) / 100;

/* A white curtain hanging from (x, y), w wide and h long, tied back toward
   its outer edge (side -1: the left edge is outer) a little below the
   middle, with a cluster of flowers at the tie */
function Drape({ x, y, w, h, side = -1, seed = 1 }: { x: number; y: number; w: number; h: number; side?: -1 | 1; seed?: number }) {
  const d = `M0 0 L${w} 0 C${w} ${rr(h * 0.34)} ${rr(w * 0.3)} ${rr(h * 0.5)} ${rr(w * 0.2)} ${rr(h * 0.6)} C${rr(w * 0.3)} ${rr(h * 0.74)} ${rr(w * 0.58)} ${rr(h * 0.92)} ${rr(w * 0.52)} ${h} L0 ${h} Z`;
  const t = side < 0 ? `translate(${rr(x)} ${rr(y)})` : `translate(${rr(x + w)} ${rr(y)}) scale(-1 1)`;
  return (
    <g>
      <g transform={t}>
        <path d={d} fill="url(#ve-fold)" />
        <path d={d} fill="url(#ve-drape-shade)" />
      </g>
      <FlowerBank x={side < 0 ? x + w * 0.22 : x + w * 0.78} y={y + h * 0.63} w={Math.max(40, w * 0.6)} h={Math.max(24, w * 0.36)} n={7} seed={seed} />
    </g>
  );
}

/* Crystal strands hanging in front of the flower wall */
function Crystals({ x0, x1, y, len, gap = 11, seed = 1 }: { x0: number; x1: number; y: number; len: number; gap?: number; seed?: number }) {
  const n = Math.floor((x1 - x0) / gap);
  return (
    <g stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="0.8">
      {Array.from({ length: n }, (_, i) => {
        const v = ((Math.imul(i + seed * 97, 2654435761) >>> 0) % 1000) / 1000;
        const l = len * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(i * 0.55)) * (0.7 + 0.3 * v));
        const x = x0 + i * gap;
        return (
          <g key={i}>
            <line x1={x} y1={y} x2={x} y2={rr(y + l)} />
            {Array.from({ length: Math.floor(l / 14) }, (_, k) => (
              <circle key={k} cx={x} cy={rr(y + 8 + k * 14)} r="1.6" fill="#FFFFFF" fillOpacity="0.9" stroke="none" />
            ))}
          </g>
        );
      })}
    </g>
  );
}

/* A string of warm lights along a swag */
function Lights({ a, b, sag, n, r = 2.4 }: { a: [number, number]; b: [number, number]; sag: number; n: number; r?: number }) {
  return (
    <g>
      <path d={`M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 + sag * 2} ${b[0]} ${b[1]}`} fill="none" stroke="#5A4630" strokeOpacity="0.4" strokeWidth="0.8" />
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const x = a[0] + (b[0] - a[0]) * t;
        const y = a[1] + (b[1] - a[1]) * t + 4 * sag * t * (1 - t);
        return (
          <g key={i}>
            <circle cx={rr(x)} cy={rr(y)} r={r * 3} fill="url(#ve-lamp)" />
            <circle cx={rr(x)} cy={rr(y)} r={r} fill="#FFF3D0" />
          </g>
        );
      })}
    </g>
  );
}

/* A plain white column with a gold base and capital ring */
function WhiteColumn({ x, top, bottom, w }: { x: number; top: number; bottom: number; w: number }) {
  return (
    <g>
      <rect x={x - w * 0.62} y={bottom - w * 0.5} width={w * 1.24} height={w * 0.5} fill="url(#ve-stone)" />
      <rect x={x - w * 0.62} y={bottom - w * 0.56} width={w * 1.24} height={w * 0.08} fill="url(#ve-gold-h)" />
      <rect x={x - w / 2} y={top + w * 0.5} width={w} height={bottom - top - w * 1.06} fill="url(#ve-stone-side)" />
      <rect x={x - w * 0.62} y={top} width={w * 1.24} height={w * 0.5} fill="url(#ve-stone)" />
      <rect x={x - w * 0.62} y={top + w * 0.46} width={w * 1.24} height={w * 0.08} fill="url(#ve-gold-h)" />
    </g>
  );
}

/* The couple's seat on the stage: a tall ivory chair framed in gold */
function CoupleChair({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const p = (v: number) => rr(v * s);
  return (
    <g transform={`translate(${rr(x)} ${rr(y)})`}>
      <ellipse cx="0" cy="0" rx={p(26)} ry={p(4)} fill="#2E1A10" fillOpacity="0.25" />
      <path d={`M${p(-22)} 0 L${p(-22)} ${p(-34)} L${p(22)} ${p(-34)} L${p(22)} 0`} fill="none" stroke="url(#ve-gold)" strokeWidth={p(3)} />
      <rect x={p(-22)} y={p(-40)} width={p(44)} height={p(10)} rx={p(3)} fill="#FBF6EC" stroke="url(#ve-gold)" strokeWidth={p(1.5)} />
      <path d={`M${p(-18)} ${p(-40)} L${p(-18)} ${p(-84)} C${p(-18)} ${p(-104)} ${p(18)} ${p(-104)} ${p(18)} ${p(-84)} L${p(18)} ${p(-40)} Z`} fill="#FBF6EC" stroke="url(#ve-gold)" strokeWidth={p(3)} />
      <path d={`M${p(-12)} ${p(-46)} L${p(-12)} ${p(-82)} C${p(-12)} ${p(-96)} ${p(12)} ${p(-96)} ${p(12)} ${p(-82)} L${p(12)} ${p(-46)} Z`} fill="none" stroke="#D9B45A" strokeWidth={p(1)} />
    </g>
  );
}

function Chandelier({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g>
      <circle cx={x} cy={y + 40 * s} r={90 * s} fill="url(#ve-chandelier)" />
      <line x1={x} y1={y - 120 * s} x2={x} y2={y} stroke="#C9A56A" strokeWidth={2 * s} />
      {[0, 1, 2].map((tier) => {
        const ry = y + tier * 18 * s;
        const rx = (46 - tier * 13) * s;
        return (
          <g key={tier}>
            <ellipse cx={x} cy={ry} rx={rx} ry={6 * s} fill="none" stroke="url(#ve-gold-h)" strokeWidth={2.4 * s} />
            {Array.from({ length: 9 - tier * 2 }, (_, k) => {
              const a = (k / (9 - tier * 2)) * Math.PI * 2;
              return (
                <g key={k}>
                  <line x1={rr(x + Math.cos(a) * rx)} y1={rr(ry + Math.sin(a) * 6 * s)} x2={rr(x + Math.cos(a) * rx)} y2={rr(ry + Math.sin(a) * 6 * s + 22 * s)} stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth={0.8 * s} />
                  <circle cx={rr(x + Math.cos(a) * rx)} cy={rr(ry + Math.sin(a) * 6 * s + 8 * s)} r={3 * s} fill="#FFF6DC" />
                </g>
              );
            })}
          </g>
        );
      })}
      <path d={`M${x - 10 * s} ${y + 54 * s} L${x} ${y + 76 * s} L${x + 10 * s} ${y + 54 * s} Z`} fill="#FFF0C8" />
    </g>
  );
}

/* Gold-on-red silk for the wall behind the stage when the couple uploaded
   their own tile */
function WallSilk(props: React.SVGProps<SVGRectElement>) {
  return <rect {...props} fill="url(#ve-o-wall)" />;
}

/* ─── Exterior planes ───────────────────────────────────────────────────── */

function SkyPlane() {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <rect width="1600" height="900" fill="url(#ve-sky)" />
      <circle cx="800" cy="300" r="300" fill="url(#ve-sun)" />
      <circle cx="800" cy="300" r="56" fill="#FFF3D0" fillOpacity="0.8" />
    </svg>
  );
}

/* Hazy garden on the horizon: sugar palms and trees */
function HorizonPlane() {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <g fill="#A8885E" fillOpacity="0.38">
        {[[60, 560, 1.2], [180, 548, 0.9], [300, 556, 0.8], [1300, 552, 0.85], [1420, 545, 1.1], [1540, 558, 1.25]].map(([x, y, s], i) => (
          <g key={i}>
            <rect x={x - 3 * s} y={y - 150 * s} width={6 * s} height={150 * s} />
            {Array.from({ length: 9 }, (_, k) => {
              const a = ((-170 + k * 20) * Math.PI) / 180;
              return <path key={k} d={`M${x} ${y - 150 * s} L${rr(x + Math.cos(a) * 46 * s)} ${rr(y - 150 * s + Math.sin(a) * 36 * s)} L${rr(x + Math.cos(a + 0.18) * 40 * s)} ${rr(y - 150 * s + Math.sin(a + 0.18) * 32 * s)} Z`} />;
            })}
          </g>
        ))}
        {[[420, 540, 70], [520, 545, 54], [1080, 545, 58], [1180, 540, 72]].map(([x, y, r], i) => (
          <ellipse key={i} cx={x} cy={y - r * 0.6} rx={r} ry={r * 0.7} />
        ))}
      </g>
      <rect x="0" y="470" width="1600" height="120" fill="url(#ve-haze)" />
    </svg>
  );
}

/* The wedding venue seen from the garden path: an ivory reception hall
   with tall lit windows, each with a box of flowers, a portico of white
   columns, and a grand entrance arch wreathed in flowers and white drapes */
function HallPlane() {
  const windows = [340, 440, 540, 1060, 1160, 1260];
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {/* A polished cream marble forecourt: seams in perspective and the
          lit hall reflected in it */}
      <rect x="0" y="560" width="1600" height="340" fill="url(#ve-ground)" />
      {Array.from({ length: 9 }, (_, i) => {
        const t = (i + 1) / 10, y = 560 + 340 * t * t;
        return <line key={`h${i}`} x1="0" y1={rr(y)} x2="1600" y2={rr(y)} stroke="#B9A47E" strokeOpacity={0.12 + t * 0.18} strokeWidth={0.6 + t * 1.4} />;
      })}
      {Array.from({ length: 17 }, (_, i) => {
        const x = -800 + i * 200;
        return <line key={`v${i}`} x1={800 + (x - 800) * 0.12} y1="560" x2={x} y2="900" stroke="#B9A47E" strokeOpacity="0.18" strokeWidth="1" />;
      })}
      <ellipse cx="800" cy="575" rx="560" ry="150" fill="url(#ve-floor-shine)" />
      <path d="M770 560 L830 560 L900 900 L700 900 Z" fill="url(#ve-aisle)" fillOpacity="0.92" />
      <path d="M770 560 L700 900 M830 560 L900 900" stroke="#D4AF37" strokeWidth="1.6" strokeOpacity="0.7" />
      {/* The building */}
      <rect x="280" y="250" width="1040" height="290" fill="url(#ve-facade)" />
      <rect x="270" y="236" width="1060" height="20" fill="#FBF6EC" />
      <rect x="270" y="254" width="1060" height="4" fill="url(#ve-gold-h)" />
      <rect x="280" y="258" width="1040" height="18" fill="#8A6A3A" fillOpacity="0.08" />
      {[290, 600, 1000, 1310].map((x) => <rect key={x} x={x - 8} y="258" width="16" height="282" fill="#FFFFFF" fillOpacity="0.35" />)}
      <Lights a={[280, 262]} b={[1320, 262]} sag={4} n={34} />
      {windows.map((x) => (
        <g key={x}>
          <path d={`M${x - 32} 488 L${x - 32} 350 A32 32 0 0 1 ${x + 32} 350 L${x + 32} 488 Z`} fill="url(#ve-window)" stroke="#FFFDF8" strokeWidth="5" />
          <path d={`M${x} 320 L${x} 488 M${x - 32} 400 L${x + 32} 400`} stroke="#FFFDF8" strokeWidth="2.5" />
          <rect x={x - 40} y="488" width="80" height="10" fill="#FBF6EC" />
          <FlowerBank x={x} y={492} w={84} h={26} n={9} seed={x} />
        </g>
      ))}
      {/* Portico and the grand entrance */}
      <rect x="620" y="210" width="360" height="330" fill="url(#ve-facade)" />
      <rect x="610" y="196" width="380" height="18" fill="#FBF6EC" />
      <rect x="610" y="212" width="380" height="4" fill="url(#ve-gold-h)" />
      <Piece id="rosette" slot="gable" x={800} y={170} s={0.36} />
      {[650, 950].map((x) => <WhiteColumn key={x} x={x} top={226} bottom={522} w={22} />)}
      <path d="M690 522 L690 400 A110 110 0 0 1 910 400 L910 522" fill="none" stroke="#FFFDF8" strokeWidth="16" />
      {/* Through the doorway: the lit hall, a chandelier glowing inside */}
      <path d="M752 522 L752 438 Q800 404 848 438 L848 522 Z" fill="url(#ve-doorway-glow)" />
      <g clipPath="url(#ve-door-clip)">
        <Chandelier x={800} y={436} s={0.32} />
        <path d="M752 522 L770 470 L830 470 L848 522 Z" fill="#E9C68A" fillOpacity="0.35" />
      </g>

      <Drape x={696} y={300} w={52} h={222} side={-1} seed={31} />
      <Drape x={852} y={300} w={52} h={222} side={1} seed={32} />
      {/* The arch wreathed in flowers */}
      {Array.from({ length: 26 }, (_, i) => {
        const a = Math.PI + (i / 25) * Math.PI;
        return <Flower key={i} kind={MIX.wedding[i % MIX.wedding.length]} x={rr(800 + Math.cos(a) * 112)} y={rr(400 + Math.sin(a) * 112)} size={30 + (i % 3) * 6} rot={(i * 37) % 60 - 30} />;
      })}
      <Garland a={[690, 400]} b={[690, 520]} sag={0} n={8} size={30} seed={33} />
      <Garland a={[910, 400]} b={[910, 520]} sag={0} n={8} size={30} seed={34} />
      {/* Steps and the flowers either side of them */}
      <rect x="410" y="522" width="780" height="40" fill="url(#ve-stone)" />
      <Band x={410} y={524} w={780} h={6} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={735 - i * 8} y={530 + i * 8} width={130 + i * 16} height="8" fill={i % 2 ? "#E6D6B9" : "#F3E8D3"} />
      ))}
      <PhotoFlowerStand x={712} y={560} s={0.55} seed={35} />
      <PhotoFlowerStand x={888} y={560} s={0.55} seed={36} />
    </svg>
  );
}

/* Lamps along the garden path, and flowers lining it */
function PathPlane() {
  const posts = [0.25, 0.5, 0.78].flatMap((t) => {
    const y = 560 + 340 * t * t;
    const half = 50 + 290 * t * t;
    const s = 0.35 + t * 1.1;
    return [{ x: 800 - half, y, s }, { x: 800 + half, y, s }];
  });
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {/* Flowers lining both edges of the path, larger as they come near */}
      {[-1, 1].map((side) =>
        Array.from({ length: 6 }, (_, i) => {
          const t = 0.14 + (i / 5) * 0.8;
          const y = 560 + 340 * t * t;
          const half = 40 + 220 * t * t;
          const s = 0.3 + t * 1.2;
          return <FlowerBank key={`${side}-${i}`} x={800 + side * (half + 26 * s)} y={y} w={70 * s} h={30 * s} n={6} seed={200 + i * 2 + (side > 0 ? 1 : 0)} />;
        })
      )}
      {posts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y - 112 * p.s} r={34 * p.s} fill="url(#ve-lamp)" />
          <rect x={p.x - 3 * p.s} y={p.y - 100 * p.s} width={6 * p.s} height={100 * p.s} fill="url(#ve-gold)" />
          <path d={`M${p.x - 12 * p.s} ${p.y - 100 * p.s} L${p.x} ${p.y - 128 * p.s} L${p.x + 12 * p.s} ${p.y - 100 * p.s} Z`} fill="url(#ve-gold)" />
          <rect x={p.x - 9 * p.s} y={p.y - 122 * p.s} width={18 * p.s} height={20 * p.s} fill="#FFE7B0" fillOpacity="0.9" />
          {/* A ribbon and a posy tied to each lamp post */}
        </g>
      ))}
      {/* A canopy of warm lights strung across the path between the lamp posts */}
      {[0, 2, 4].map((k) => {
        const a = posts[k], b = posts[k + 1];
        const ya = a.y - 104 * a.s, sag = 40 * a.s;
        return (
          <g key={k}>
            <Lights a={[a.x, ya]} b={[b.x, ya]} sag={sag} n={14 + k * 3} r={1.6 + a.s} />
          </g>
        );
      })}
    </svg>
  );
}

/* The flower arch in the foreground: two pillars of flowers, a deep swag
   of blooms across the top, and white drapes, framing the view */
function GatePlane() {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <g filter="url(#ve-near-soft)">
      <Drape x={60} y={110} w={260} h={790} side={-1} seed={41} />
      <Drape x={1280} y={110} w={260} h={790} side={1} seed={42} />
      {[170, 1430].map((x, i) => (
        <g key={x}>
          <WhiteColumn x={x} top={130} bottom={900} w={96} />
          <Strip x={x - 30} y={200} w={60} h={620} />
          <Garland a={[x - 30, 200]} b={[x + 30, 820]} sag={0} n={13} size={78} seed={43 + i} />
          <FlowerBank x={x} y={900} w={220} h={120} n={16} seed={47 + i} />
        </g>
      ))}
      <path d="M0 0 L1600 0 L1600 96 Q800 200 0 96 Z" fill="url(#ve-fold)" />
      <path d="M0 0 L1600 0 L1600 96 Q800 200 0 96 Z" fill="url(#ve-drape-shade)" />
      <Garland a={[170, 120]} b={[1430, 120]} sag={90} n={38} size={60} seed={46} />
      <Flower kind="spray" x={330} y={262} size={90} rot={-6} />
      <Flower kind="spray" x={1270} y={262} size={90} rot={6} flip />
      {Array.from({ length: 21 }, (_, i) => 120 + i * 68).map((x) => (
        <Piece key={x} id="pendant" x={x} y={160} s={0.55} />
      ))}
      </g>
    </svg>
  );
}

/* ─── Interior planes ───────────────────────────────────────────────────── */

/* The left wall (the right is its mirror): white drapes between pillars of
   flowers, in perspective. The wall runs from x=0 (near, 900 tall) to
   x=520 (far, 390 tall) */
function SideWall({ seed }: { seed: number }) {
  const top = (x: number) => (250 * x) / 520;
  const bot = (x: number) => 900 - (260 * x) / 520;
  const panels = [[30, 170], [230, 320], [372, 430], [458, 500]];
  const pillars = [200, 346, 444, 510];
  return (
    <g>
      {panels.map(([x1, x2]) => (
        <path key={x1} d={`M${x1} ${rr(top(x1) + 6)} L${x2} ${rr(top(x2) + 4)} L${x2} ${rr(bot(x2) - 6)} L${x1} ${rr(bot(x1) - 10)} Z`} fill="url(#ve-fold)" />
      ))}
      {panels.map(([x1, x2]) => {
        const cx = (x1 + x2) / 2, ch = bot(cx) - top(cx);
        return <Piece key={`p${x1}`} id="tear" x={cx} y={top(cx) + ch * 0.47} s={ch / 580} />;
      })}
      {pillars.map((x, i) => {
        const t = top(x), b = bot(x), s = (b - t) / 640;
        return (
          <g key={x}>
            {Array.from({ length: 11 }, (_, k) => (
              <Flower key={k} kind={MIX.wedding[(k + i * 3 + seed) % MIX.wedding.length]} x={rr(x + ((k % 2) - 0.5) * 10 * s)} y={rr(t + 30 * s + k * ((b - t - 60 * s) / 10))} size={rr(64 * s)} rot={(k * 47) % 60 - 30} />
            ))}
          </g>
        );
      })}
    </g>
  );
}

/* Far plane: draped ceiling, walls, the flower wall and the stage */
function HallInteriorPlane({ portrait }: { portrait?: string }) {
  const own = useContext(OrnamentContext);
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {/* Ceiling, draped in swags of white fabric strung with lights */}
      <path d="M0 0 L1600 0 L1080 250 L520 250 Z" fill="url(#ve-ceiling)" />
      {[[0, 0, 1600, 0, 120], [180, 86, 1420, 86, 70], [340, 162, 1260, 162, 44], [460, 220, 1140, 220, 24]].map(([x1, y1, x2, y2, sag], i) => (
        <g key={i}>
          <path d={`M${x1} ${y1} Q800 ${y1 + sag * 2} ${x2} ${y2} Q800 ${y1 + sag * 2 - 26 + i * 4} ${x1} ${y1} Z`} fill="#F6EFE4" fillOpacity="0.9" />
          <Lights a={[x1, y1]} b={[x2, y2]} sag={sag} n={22 - i * 3} r={2.2 - i * 0.3} />
        </g>
      ))}
      {own.flower && [60, 130, 190].flatMap((y, row) =>
        Array.from({ length: 7 }, (_, k) => {
          const i = k + 1, t = y / 250;
          const x = (1600 / 8) * i + (520 + (560 / 8) * i - (1600 / 8) * i) * t;
          return <Piece key={`${row}-${i}`} id="chan" x={x} y={y} s={0.75 - t * 0.45} />;
        })
      )}
      <path d="M0 0 L520 250 L520 640 L0 900 Z" fill="url(#ve-wall-side)" />
      <path d="M1600 0 L1080 250 L1080 640 L1600 900 Z" fill="url(#ve-wall-side-r)" />
      <SideWall seed={0} />
      <g transform="matrix(-1 0 0 1 1600 0)"><SideWall seed={4} /></g>
      {/* The back wall: a wall of flowers (or the couple's own tile) */}
      {own.wall_pattern ? <WallSilk x="520" y="250" width="560" height="390" /> : <FlowerWall x={520} y={250} w={560} h={390} cell={30} seed={7} />}
      <rect x="520" y="250" width="560" height="390" fill="#FFF6EA" fillOpacity="0.32" />
      <ellipse cx="800" cy="330" rx="200" ry="92" fill="url(#ve-name-glow)" />
      <rect x="520" y="250" width="560" height="390" fill="url(#ve-wall-shade)" />
      <Crystals x0={606} x1={1000} y={250} len={150} seed={3} />
      <Drape x={520} y={250} w={110} h={390} side={-1} seed={51} />
      <Drape x={970} y={250} w={110} h={390} side={1} seed={52} />
      <path d="M0 900 L520 640 L1080 640 L1600 900 Z" fill="url(#ve-floor)" />
      <path d="M640 640 L960 640 L1100 900 L500 900 Z" fill="url(#ve-floor-glow)" />
      {Array.from({ length: 7 }, (_, i) => {
        const t = (i + 1) / 8;
        const y = 640 + 260 * t * t;
        return <line key={i} x1={520 - 520 * t * t} y1={y} x2={1080 + 520 * t * t} y2={y} stroke="#8C6D37" strokeWidth="0.8" strokeOpacity="0.25" />;
      })}
      {/* Aisle runner to the stage, flowers at the end of every row */}
      <path d="M760 640 L840 640 L960 900 L640 900 Z" fill="url(#ve-aisle)" />
      <path d="M760 640 L640 900 M840 640 L960 900" stroke="#D4AF37" strokeWidth="2" strokeOpacity="0.8" />
      {[0.25, 0.42, 0.6, 0.8].flatMap((t, row) => {
        const y = 640 + 260 * t * t;
        const s = 0.45 + t * 1.1;
        const halfAisle = 40 + 120 * t * t;
        return [-1, 1].flatMap((side) => [
          ...Array.from({ length: 4 }, (_, k) => {
            const x = 800 + side * (halfAisle + 26 * s + k * 52 * s);
            return <use key={`${row}-${side}-${k}`} href="#ve-chair" transform={`translate(${rr(x)} ${rr(y)}) scale(${Math.round(s * 1000) / 1000})`} />;
          }),
          <FlowerBank key={`${row}-${side}-f`} x={800 + side * (halfAisle + 4 * s)} y={y + 3} w={44 * s} h={26 * s} n={7} seed={60 + row * 2 + (side > 0 ? 1 : 0)} />,
        ]);
      })}
      {/* The stage */}
      <rect x="590" y="590" width="420" height="52" fill="url(#ve-stone)" />
      <Band x={590} y={596} w={420} h={16} />
      <rect x="590" y="588" width="420" height="5" fill="url(#ve-gold-h)" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={730 - i * 10} y={612 + i * 10} width={140 + i * 20} height="10" fill={i % 2 ? "#E9DCC3" : "#F6EEDD"} />
      ))}
      <circle cx="800" cy="420" r="260" fill="url(#ve-stage-light)" />
      <Piece id="gable" x={800} y={592} s={155} />
      <Piece id="naga" x={614} y={508} s={1.5} />
      <Piece id="naga" x={986} y={508} s={1.5} flip />
      {portrait ? (
        <g>
          {Array.from({ length: 20 }, (_, i) => {
            const a = (i / 20) * Math.PI * 2;
            return <Flower key={i} kind={MIX.wedding[i % MIX.wedding.length]} x={rr(800 + Math.sin(a) * 72)} y={rr(450 - Math.cos(a) * 92)} size={34} rot={(i * 41) % 60 - 30} />;
          })}
          <ellipse cx="800" cy="450" rx="64" ry="84" fill="url(#ve-gold)" />
          <image href={portrait} x="740" y="370" width="120" height="160" preserveAspectRatio="xMidYMid slice" clipPath="url(#ve-portrait-clip)" />
        </g>
      ) : (
        <Piece id="rosette" slot="stage_center" x={800} y={482} s={1.08} />
      )}
      <CoupleChair x={768} y={590} s={0.9} />
      <CoupleChair x={832} y={590} s={0.9} />
      {/* Flowers: stands either side, and banks along the stage's edge */}
      <PhotoFlowerStand x={548} y={642} s={1.1} seed={21} />
      <PhotoFlowerStand x={1052} y={642} s={1.1} seed={22} />
      <FlowerBank x={652} y={594} w={130} h={64} n={18} seed={23} />
      <FlowerBank x={948} y={594} w={130} h={64} n={18} seed={24} />
      <FlowerBank x={712} y={598} w={70} h={30} n={9} seed={25} mix={MIX.white} />
      <FlowerBank x={888} y={598} w={70} h={30} n={9} seed={26} mix={MIX.white} />
    </svg>
  );
}

/* The couple's names on the stage, in HTML over the far plane so they are
   real text in the invitation's fonts, in gold letters over the flower
   wall the way a wedding backdrop carries them. Positions are in the
   plane's 1600 x 900 frame, which is drawn sliced (cover), so one unit on
   screen is max(width / 1600, height / 900) */
const UNIT = "max(100cqw / 1600, 100cqh / 900)";
const at = (x: number, y: number, w: number) => ({
  left: `calc(50% + ${x - 800} * ${UNIT})`,
  top: `calc(50% + ${y - 450} * ${UNIT})`,
  width: `calc(${w} * ${UNIT})`,
});

function StageNames({ groom, bride, portrait }: { groom: string; bride: string; portrait: boolean }) {
  const gold = "bg-[linear-gradient(170deg,#D9A845_0%,#B07F27_50%,#7E5617_100%)] bg-clip-text text-transparent";
  const lines = (cls: string) => (
    <>
      <span className={`block ${cls}`}>{groom}</span>
      <span className={`block ${cls}`} style={{ fontSize: "0.7em", lineHeight: 1.2 }}>&amp;</span>
      <span className={`block ${cls}`}>{bride}</span>
    </>
  );
  /* The shadow is the same words, see-through, casting a text-shadow, with
     the gold words laid exactly over them. (A drop-shadow filter on the gold
     looked the same but made the compositor redraw it as the camera moved.)
     Their own layer, so the far plane's picture never repaints for them. */
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] [container-type:size] will-change-transform">
      <div className="absolute text-center font-moul" style={{ ...at(560, portrait ? 268 : 312, 480), fontSize: `calc(${portrait ? 17 : 24} * ${UNIT})`, lineHeight: 1.7 }}>
        <div className="text-transparent [text-shadow:0_0_8px_rgba(255,248,236,0.95)]">{lines("")}</div>
        <div className="absolute inset-0">{lines(gold)}</div>
      </div>
    </div>
  );
}

/* Middle plane: pillars of flowers and two chandeliers */
function HallMidPlane() {
  const pillars = [[430, 248, 652, 30], [1170, 248, 652, 30], [330, 215, 690, 40], [1270, 215, 690, 40]] as const;
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {pillars.map(([x, t, b, w], i) => (
        <g key={x}>
          <FlowerWall x={x - w / 2} y={t} w={w} h={b - t - w * 0.5} cell={w * 0.62} seed={70 + i} ground="#D9C3B4" />
          <rect x={x - w * 0.7} y={b - w * 0.5} width={w * 1.4} height={w * 0.5} fill="url(#ve-gold)" />
        </g>
      ))}
      {[[590, 236, 0.6], [1010, 236, 0.6]].map(([x, y, s], i) => (
        <Chandelier key={i} x={x} y={y} s={s} />
      ))}
    </svg>
  );
}

/* Near plane: great white drapes either side and a swag of flowers across
   the top, which the camera passes through, and the big chandelier */
function HallNearPlane() {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <Drape x={-20} y={60} w={300} h={840} side={-1} seed={81} />
      <Drape x={1320} y={60} w={300} h={840} side={1} seed={82} />
      <path d="M0 0 L1600 0 L1600 70 Q800 190 0 70 Z" fill="url(#ve-fold)" />
      <path d="M0 0 L1600 0 L1600 70 Q800 190 0 70 Z" fill="url(#ve-drape-shade)" />
      <Garland a={[0, 70]} b={[1600, 70]} sag={60} n={40} size={60} seed={83} />
      {Array.from({ length: 24 }, (_, i) => 34 + i * 68).map((x) => (
        <Piece key={x} id="pendant" x={x} y={126} s={1.5} />
      ))}
      <Chandelier x={800} y={150} s={1.2} />
    </svg>
  );
}

/* Jasmine petals that drift down once inside the hall: left in %, delay
   and fall time in s, size factor (.ve-petal in globals.css) */
export const PETALS = [
  [6, 0, 13, 1], [14, 5.5, 11, 0.8], [23, 2.2, 15, 1.2], [31, 8, 12, 0.9], [40, 3.6, 14, 1],
  [48, 9.5, 13, 0.75], [57, 1.2, 12, 1.1], [64, 6.8, 15, 0.85], [72, 4.4, 11, 1.25], [80, 10.6, 13, 0.9],
  [88, 2.9, 14, 1], [95, 7.6, 12, 0.8], [19, 11.8, 16, 0.7], [69, 12.6, 15, 0.95],
] as const;

/* ─── Flattening ────────────────────────────────────────────────────────── */

/* Hand the compositor pictures instead of shapes.

   Each depth layer is an inline SVG of hundreds of shapes, and while the
   camera moves, the browser restyles and re-layerizes every one of them on
   every frame: on a throttled phone that alone overran the frame (median
   136 ms, worst 1.9 s while scrolling through the hall). Once the scene has
   drawn, each layer is copied into a self-contained SVG image, carrying the
   shared defs it uses, and shown as a single <img>: the same pixels, one
   paint item (median 68 ms, worst 0.2 s on the same run). The live SVG stays
   in the DOM, only hidden, so nothing React owns is removed, and a layer is
   left live if anything in it can't go into the copy (a reference not yet
   drawn, a photo that can't be fetched). */
const ALIGN: Record<string, string> = { Min: "0%", Mid: "50%", Max: "100%" };

function fitFor(svg: SVGSVGElement) {
  const m = /x(Min|Mid|Max)Y(Min|Mid|Max)\s*(meet|slice)?/.exec(svg.getAttribute("preserveAspectRatio") || "xMidYMid meet");
  if (!m) return null;
  return { fit: m[3] === "slice" ? "cover" : "contain", position: `${ALIGN[m[1]]} ${ALIGN[m[2]]}` };
}

/* Each image is fetched once and reused by every layer that shows it */
const dataUrls = new Map<string, Promise<string>>();
function toDataUrl(href: string) {
  let pending = dataUrls.get(href);
  if (!pending) {
    pending = fetch(href)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          })
      );
    pending.catch(() => dataUrls.delete(href));
    dataUrls.set(href, pending);
  }
  return pending;
}

/* Ids an element's markup points at: <use href="#id"> and url(#id) */
const REF = /(?:href="#|url\(#)([^")]+)/g;
function refsIn(markup: string) {
  return [...markup.matchAll(REF)].map((m) => m[1]);
}

/** Flattens what it can; returns how many layers are still live (waiting on
    a reference) and a function that puts every layer back */
async function flattenLayers(root: HTMLElement, isCancelled: () => boolean) {
  const restore: (() => void)[] = [];
  // Every shared definition by id, so each layer copies only what it uses.
  // An id nested inside a definition (a gradient inside a flower's <g>)
  // leads to the top-level definition holding it, which is copied whole
  const byId = new Map<string, Element>();
  for (const defs of root.querySelectorAll("defs")) {
    for (const top of defs.children) {
      if (top.id) byId.set(top.id, top);
      for (const inner of top.querySelectorAll("[id]")) if (!byId.has(inner.id)) byId.set(inner.id, top);
    }
  }
  let pending = 0;
  for (const layer of root.querySelectorAll<HTMLElement>("[data-layer]")) {
    const svg = layer.querySelector<SVGSVGElement>(":scope > svg");
    if (!svg || svg.style.display === "none") continue;
    const fit = fitFor(svg);
    const vb = svg.viewBox.baseVal;
    if (!fit || !vb || !vb.width) continue;
    // Follow references from the layer through the definitions it reaches
    const used = new Set<Element>();
    const seen = new Set<string>();
    const queue = refsIn(svg.outerHTML);
    let missing = false;
    while (queue.length) {
      const id = queue.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const def = byId.get(id);
      if (def) {
        if (!used.has(def)) queue.push(...refsIn(def.outerHTML));
        used.add(def);
      } else if (!svg.querySelector(`[id="${CSS.escape(id)}"]`)) {
        missing = true;
      }
    }
    if (missing) {
      pending++;
      continue;
    }
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.insertAdjacentHTML("afterbegin", `<defs>${[...used].map((d) => d.outerHTML).join("")}</defs>`);
    // An SVG image can't load anything itself: photos and ornament images
    // go in as data, and a layer whose image can't be fetched stays live
    let ok = true;
    for (const im of clone.querySelectorAll("image")) {
      const href = im.getAttribute("href") || im.getAttribute("xlink:href") || "";
      if (!href || href.startsWith("data:")) continue;
      try {
        im.setAttribute("href", await toDataUrl(href));
      } catch {
        ok = false;
        break;
      }
    }
    if (!ok || isCancelled()) continue;
    clone.removeAttribute("class");
    clone.setAttribute("width", String(vb.width));
    clone.setAttribute("height", String(vb.height));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }));
    const img = new Image();
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:${fit.fit};object-position:${fit.position};pointer-events:none`;
    img.src = url;
    try {
      await img.decode();
    } catch {
      URL.revokeObjectURL(url);
      continue;
    }
    if (isCancelled()) {
      URL.revokeObjectURL(url);
      break;
    }
    // Swap only once the picture is ready, so nothing flashes
    // The drawing itself leaves the page while the picture stands in for
    // it: hidden but present, its thousands of <use> clones were still
    // restyled on every frame of the camera move. React keeps the node and
    // only ever updates or removes it through its parent, so it can go back
    // exactly where it was.
    layer.replaceChild(img, svg);
    restore.push(() => {
      if (img.parentNode === layer) layer.replaceChild(svg, img);
      else img.remove();
      URL.revokeObjectURL(url);
    });
  }
  return { pending, undo: () => restore.splice(0).forEach((f) => f()) };
}

/* The couple's ornament images, loaded to learn each one's proportions.
   Until a new set has loaded the scene keeps what it was showing; an image
   that fails to load leaves its place to the drawing */
const NO_ORNAMENTS: OrnamentImages = {};
function useOrnamentImages(ornaments?: WeddingOrnaments) {
  const key = JSON.stringify(ornaments ?? {});
  const [loaded, setLoaded] = useState<{ key: string; images: OrnamentImages }>({ key: "{}", images: NO_ORNAMENTS });
  useEffect(() => {
    if (key === "{}") return;
    let alive = true;
    const entries = Object.entries(JSON.parse(key) as Record<string, string>);
    Promise.all(
      entries.map(
        ([slot, url]) =>
          new Promise<[string, OrnamentImage | null]>((resolve) => {
            const img = new Image();
            img.onload = () => resolve([slot, img.naturalWidth && img.naturalHeight ? { url, w: img.naturalWidth, h: img.naturalHeight } : null]);
            img.onerror = () => resolve([slot, null]);
            img.src = url;
          })
      )
    ).then((pairs) => {
      if (alive) setLoaded({ key, images: Object.fromEntries(pairs.filter(([, v]) => v)) as OrnamentImages });
    });
    return () => {
      alive = false;
    };
  }, [key]);
  return key === "{}" ? NO_ORNAMENTS : loaded.images;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

/* Memoised: the scene is thousands of shapes and its props are plain
   strings (and the ornament links, compared by content), so the
   invitation's own state changes never re-render it */
function sameProps(a: VenueEntranceProps, b: VenueEntranceProps) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)] as (keyof VenueEntranceProps)[]);
  for (const k of keys) {
    if (k === "ornaments" ? JSON.stringify(a.ornaments ?? {}) !== JSON.stringify(b.ornaments ?? {}) : a[k] !== b[k]) return false;
  }
  return true;
}

export const VenueEntrance = React.memo(function VenueEntrance(props: VenueEntranceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const ornaments = useOrnamentImages(props.ornaments);
  const ornamentsKey = JSON.stringify(ornaments);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No camera move: show the hall and stage with every detail at once
      root.style.height = "100svh";
      root.querySelector<HTMLElement>("[data-exterior]")!.style.visibility = "hidden";
      root.querySelector<HTMLElement>("[data-title]")!.style.visibility = "hidden";
      root.querySelector<HTMLElement>("[data-hint]")!.style.visibility = "hidden";
      root.querySelector<HTMLElement>("[data-petals]")!.style.visibility = "hidden";
      root.querySelector<HTMLElement>("[data-glint]")!.style.visibility = "hidden";
      root.querySelector<HTMLElement>("[data-interior]")!.style.visibility = "visible";
      root.querySelector<HTMLElement>("[data-stage-text]")!.style.visibility = "visible";
      return;
    }

    let cancelled = false;
    let cleanup = () => {};
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const q = gsap.utils.selector(root);
      // Portrait phones see a narrow slice of the 16:9 scene: travel less
      // far inside, so the stage stays framed instead of filling the screen
      const z = window.innerWidth / window.innerHeight < 0.8 ? 0.55 : 1;
      const zs = (v: number) => 1 + (v - 1) * z;
      const ctx = gsap.context(() => {
        // Starting state: outside, on the path, the gate framing the hall
        gsap.set(q("[data-interior]"), { autoAlpha: 0 });
        gsap.set(q("[data-exterior]"), { autoAlpha: 1 });
        gsap.set(q("[data-in-far]"), { scale: zs(1.18) });
        gsap.set(q("[data-in-mid]"), { scale: zs(1.4) });
        gsap.set(q("[data-in-near]"), { scale: 1.8 });
        gsap.set(q("[data-doorlight]"), { opacity: 0 });
        gsap.set(q("[data-stage-text]"), { autoAlpha: 0, y: 24 });
        gsap.set(q("[data-hint]"), { autoAlpha: 1 });
        // Petals stay paused while hidden, so they don't animate unseen
        gsap.set(q("[data-petals]"), { autoAlpha: 0, "--ve-petals": "paused" });
        gsap.set(q("[data-glint]"), { autoAlpha: 0, xPercent: 0 });

        /* One continuous camera move per layer, each with a single ease, so
           the speed never jumps where one phase hands over to the next; a
           heavier scrub lets the camera glide on after the finger stops.
           The door is a crossfade through warm light, not a cut. */
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: "venue-entrance",
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.4,
            invalidateOnRefresh: true,
          },
        });
        tl.addLabel("approach", 0)
          .to(q("[data-hint]"), { autoAlpha: 0, duration: 4 }, "approach")
          .to(q("[data-title]"), { autoAlpha: 0, y: -40, duration: 12, ease: "power1.in" }, "approach+=3")
          // The gate opens past either side of the camera, fading as it goes
          .to(q("[data-gate]"), { scale: 2.8, duration: 26, ease: "power2.in" }, "approach")
          .to(q("[data-gate]"), { autoAlpha: 0, duration: 10, ease: "power1.in" }, "approach+=14")
          // Walking up the path and the steps: the hall grows slowly, then
          // faster as the doorway nears, and the eye rises with the steps
          .to(q("[data-hall]"), { scale: 5.6, yPercent: -3, duration: 48, ease: "power3.in" }, "approach")
          .to(q("[data-path]"), { scale: 4.2, yPercent: 4, duration: 44, ease: "power3.in" }, "approach")
          .to(q("[data-path]"), { autoAlpha: 0, duration: 8 }, "approach+=34")
          .to(q("[data-horizon]"), { scale: 1.14, duration: 48, ease: "power1.in" }, "approach")
          .to(q("[data-sky]"), { scale: 1.08, duration: 48, ease: "power1.in" }, "approach")
          .addLabel("door", 34)
          // Light floods out of the doorway; the hall appears through it
          .to(q("[data-doorlight]"), { opacity: 1, duration: 12, ease: "sine.inOut" }, "door")
          .to(q("[data-interior]"), { autoAlpha: 1, duration: 10, ease: "sine.inOut" }, "door+=8")
          .addLabel("inside", 48)
          .set(q("[data-exterior]"), { autoAlpha: 0 }, "inside+=2")
          .to(q("[data-doorlight]"), { opacity: 0, duration: 14, ease: "sine.inOut" }, "inside")
          .set(q("[data-petals]"), { "--ve-petals": "running" }, "inside")
          .to(q("[data-petals]"), { autoAlpha: 1, duration: 10 }, "inside")
          // Down the aisle: one smooth move per depth, near planes faster
          .fromTo(q("[data-in-far]"), { scale: zs(1.18) }, { scale: zs(1.62), duration: 44, ease: "sine.inOut", immediateRender: false }, "door+=8")
          .fromTo(q("[data-in-mid]"), { scale: zs(1.4) }, { scale: zs(2.15), duration: 44, ease: "sine.inOut", immediateRender: false }, "door+=8")
          .fromTo(q("[data-in-near]"), { scale: 1.8 }, { scale: 3.4, duration: 40, ease: "sine.in", immediateRender: false }, "door+=8")
          .to(q("[data-in-near]"), { autoAlpha: 0, duration: 12, ease: "power1.in" }, "door+=36")
          .addLabel("stage", 86)
          // Arriving: the camera eases back a touch, as if stopping before
          // the stage, and the words rise
          .to(q("[data-in-far]"), { scale: zs(1.56), duration: 14, ease: "sine.out" }, "stage")
          .to(q("[data-stage-text]"), { autoAlpha: 1, y: 0, duration: 10, stagger: 2, ease: "power2.out" }, "stage+=2")
          // A band of light passes over the gilding as the stage arrives
          .to(q("[data-glint]"), { autoAlpha: 1, duration: 2 }, "stage")
          .to(q("[data-glint]"), { xPercent: 270, duration: 14, ease: "power1.inOut" }, "stage")
          .to(q("[data-glint]"), { autoAlpha: 0, duration: 3 }, "stage+=11");
      }, root);
      cleanup = () => ctx.revert();
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  // Flatten the layers in idle time once the scene has drawn; parts drawn
  // client-only may land a moment later, so layers waiting on them retry
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let timer = 0;
    const undos: (() => void)[] = [];
    const idle = (fn: () => void) =>
      "requestIdleCallback" in window ? window.requestIdleCallback(fn, { timeout: 2000 }) : globalThis.setTimeout(fn, 300);
    const run = (attempt: number) =>
      idle(async () => {
        if (cancelled) return;
        const { pending, undo } = await flattenLayers(root, () => cancelled);
        undos.push(undo);
        if (cancelled) undo();
        else if (pending && attempt < 6) timer = window.setTimeout(() => run(attempt + 1), 500);
      });
    run(0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      undos.splice(0).forEach((f) => f());
    };
  }, [props.portrait, ornamentsKey]);

  const titleCls = props.khmerNames
    ? "wc-khmer font-semibold text-[clamp(22px,3.4vw,40px)] leading-[1.4]"
    : "wc-display text-[clamp(24px,3.6vw,44px)] leading-tight";

  /* Layers are scaled around the doorway (exterior) and the stage (interior);
     transform-origin in % of the sliced 1600×900 frame lands on those points */
  const layer = "absolute inset-0 will-change-transform";
  return (
    <section ref={rootRef} className="relative h-[420vh]" aria-label={`${props.groom} & ${props.bride}`}>
      <OrnamentContext.Provider value={ornaments}>
      <div className="sticky top-0 h-[100svh] min-h-[560px] overflow-hidden bg-[#2a1a0e]">
        <Defs />
        {/* Exterior */}
        <div data-exterior className="absolute inset-0">
          <div data-sky data-layer className={layer} style={{ transformOrigin: "50% 55%" }}><SkyPlane /></div>
          <div data-horizon data-layer className={layer} style={{ transformOrigin: "50% 58%" }}><HorizonPlane /></div>
          <div data-hall data-layer className={layer} style={{ transformOrigin: "50% 53.5%" }}><HallPlane /></div>
          <div data-path data-layer className={layer} style={{ transformOrigin: "50% 62%" }}><PathPlane /></div>
          <div data-gate data-layer className={layer} style={{ transformOrigin: "50% 55%" }}><GatePlane /></div>
          {/* Warm evening light from the doorway, and the edges of the view falling into soft shadow */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_50%,rgba(255,226,170,0.22),transparent_70%),radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgba(60,35,15,0.28)_100%)]" />
        </div>
        {/* Interior: hidden until the camera passes the doorway */}
        <div data-interior className="absolute inset-0 invisible">
          <div data-in-far data-layer className={layer} style={{ transformOrigin: "50% 50%" }}>
            <HallInteriorPlane portrait={props.portrait} />
            <StageNames groom={props.groom} bride={props.bride} portrait={!!props.portrait} />
          </div>
          <div data-in-mid data-layer className={layer} style={{ transformOrigin: "50% 50%" }}><HallMidPlane /></div>
          <div data-in-near data-layer className={layer} style={{ transformOrigin: "50% 45%" }}><HallNearPlane /></div>
        </div>
        {/* Jasmine petals drifting down inside the hall */}
        <div data-petals aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden invisible">
          {PETALS.map(([x, d, t, sz], i) => (
            <span key={i} className={i % 3 === 1 ? "ve-petal ve-petal--rose" : i % 3 === 2 ? "ve-petal ve-petal--rumduol" : "ve-petal"} style={{ left: `${x}%`, animationDelay: `${-d}s`, animationDuration: `${t}s`, animationPlayState: "var(--ve-petals, running)", "--s": sz } as React.CSSProperties} />
          ))}
        </div>
        {/* A band of light sweeping across the gilding as the stage comes into view */}
        <div data-glint aria-hidden="true" className="absolute inset-y-0 left-[-60%] w-[60%] pointer-events-none opacity-0 bg-[linear-gradient(100deg,rgba(255,244,214,0)_15%,rgba(255,244,214,0.38)_50%,rgba(255,244,214,0)_85%)]" />
        {/* Warm light through the doorway */}
        <div data-doorlight className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_55%,#fff6dc_0%,#ffd893_45%,rgba(255,216,147,0.0)_80%)] opacity-0" />

        {/* Words: names on arrival, then the details on the stage */}
        {/* Arrival: the names on an ivory plaque hung from the gate's lintel,
            above the hall's spire so no word sits on the architecture */}
        <div data-title className="absolute inset-x-0 top-[72px] sm:top-[4%] px-4 flex justify-center">
          <div className="max-w-[92vw] rounded-b-[18px] rounded-t-md bg-[#fffaf0]/90 border border-[#d4af37]/60 shadow-[0_14px_30px_-18px_rgba(60,40,10,0.6)] px-5 sm:px-8 pt-2 pb-3 text-center text-[#3a2410]">
            <p className={props.khmerNames ? "wc-khmer font-medium text-[13px] text-[#8B1E24] wc-km-lh" : "wc-smallcaps text-[#7a4d0c]"}>{props.kicker}</p>
            <h1 className={titleCls}>
              <CoupleNames groom={props.groom} bride={props.bride} ampClassName="text-[#B08A3E]" />
            </h1>
          </div>
        </div>
        <div data-stage-text className="invisible absolute inset-x-0 bottom-0 px-5 pt-24 pb-[max(5vh,28px)] text-center bg-[linear-gradient(180deg,rgba(26,10,6,0)_0%,rgba(26,10,6,0.62)_38%,rgba(26,10,6,0.86)_100%)]">
          <div className="mx-auto max-w-[720px] text-[#fbf1dc] [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]">
            <p className={props.khmerNames ? "wc-khmer font-semibold text-[clamp(24px,5vw,42px)] leading-[1.4]" : "wc-display text-[clamp(28px,5vw,48px)] leading-tight"}>
              <CoupleNames groom={props.groom} bride={props.bride} ampClassName="text-[#E5C158]" />
            </p>
            <div aria-hidden="true" className="mx-auto my-3 flex w-40 items-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D9B45A]" />
              <span className="h-1.5 w-1.5 rotate-45 bg-[#E5C158]" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D9B45A]" />
            </div>
            <p className="wc-khmer text-[15px] text-[#f3dfb5] wc-km-lh">
              {props.dateLine}
              {props.timeLine ? ` · ${props.timeLine}` : ""}
            </p>
            {props.venue && <p className="mt-1 wc-khmer text-[14px] text-[#e9d6b2]/90 wc-km-lh">{props.venue}</p>}
            {props.guestLine && <p className="mt-2 wc-khmer text-[14px] text-[#f1d683] wc-km-lh">{props.guestLine}</p>}
          </div>
        </div>
        <p data-hint className="absolute bottom-4 inset-x-0 text-center text-[12px] text-[#5a3a1a]/70">{props.scrollHint} ↓</p>
      </div>
      </OrnamentContext.Provider>
    </section>
  );
}, sameProps);
