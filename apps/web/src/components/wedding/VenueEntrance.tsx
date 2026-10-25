"use client";

import React, { useEffect, useRef } from "react";

/* The opening of the invitation: arriving at a Khmer wedding hall.

   A layered 2.5D scene. Each depth plane (sky, distant horizon, the hall,
   the path, the carved gate; then inside: the far wall and stage, the
   middle columns, the near columns) is its own SVG on its own compositor
   layer, and the "camera" is a scroll-scrubbed GSAP timeline that scales
   and slides those planes at different rates around the doorway and then
   the stage. Transforms only, so the motion runs on the GPU.

   It is an original, stylised composition inspired by Khmer architecture
   (tiered roofs with chovea finials, a gilded pediment, lotus-capital
   columns, kbach-edged arches), not a reconstruction of a real building.
   The distant towers stay far on the horizon as scenery: the venue is a
   wedding hall, not a temple. Every word comes from the card's data. */

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
          <stop offset="0" stopColor="#CDB58C" />
          <stop offset="1" stopColor="#9C8058" />
        </linearGradient>
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
        <clipPath id="ve-portrait-clip">
          <ellipse cx="800" cy="408" rx="64" ry="84" />
        </clipPath>
      </defs>
    </svg>
  );
}

/* Flame-leaf (kbach phni tes) along a pediment edge, as a run of small arcs */
function kbachEdge(x0: number, y0: number, x1: number, y1: number, n: number) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n;
    const ax = x0 + (x1 - x0) * t0, ay = y0 + (y1 - y0) * t0;
    const bx = x0 + (x1 - x0) * t1, by = y0 + (y1 - y0) * t1;
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    // Curl outward from the edge then back, with a flame tip
    const nx = -(by - ay), ny = bx - ax;
    const len = Math.hypot(nx, ny) || 1;
    const k = 0.9;
    d += `M${ax.toFixed(1)} ${ay.toFixed(1)} Q${(mx + (nx / len) * 10 * k).toFixed(1)} ${(my + (ny / len) * 10 * k).toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)} `;
  }
  return d;
}

/* A flared Khmer roof tier: eaves sweeping up at both ends into chovea */
function roofTier(cx: number, top: number, bottom: number, halfTop: number, halfBottom: number) {
  const l = cx - halfBottom, r = cx + halfBottom;
  return {
    body: `M${l} ${bottom} Q${l + 30} ${bottom - 6} ${cx - halfTop} ${top} L${cx + halfTop} ${top} Q${r - 30} ${bottom - 6} ${r} ${bottom} Q${cx} ${bottom + 10} ${l} ${bottom} Z`,
    eave: `M${l} ${bottom} Q${cx} ${bottom + 10} ${r} ${bottom}`,
    // Chovea: the horn-like finial at each end of the ridge/eave
    chovea: [
      `M${l} ${bottom} C${l - 18} ${bottom - 6} ${l - 22} ${bottom - 30} ${l - 8} ${bottom - 42} C${l - 10} ${bottom - 28} ${l - 4} ${bottom - 14} ${l + 6} ${bottom - 6} Z`,
      `M${r} ${bottom} C${r + 18} ${bottom - 6} ${r + 22} ${bottom - 30} ${r + 8} ${bottom - 42} C${r + 10} ${bottom - 28} ${r + 4} ${bottom - 14} ${r - 6} ${bottom - 6} Z`,
    ],
  };
}

/* Tiered gilded spire */
function spire(cx: number, base: number, h: number, w: number) {
  const parts: string[] = [];
  const tiers = 6;
  for (let i = 0; i < tiers; i++) {
    const t0 = i / tiers, t1 = (i + 1) / tiers;
    const y0 = base - h * t0 * 0.82, y1 = base - h * t1 * 0.82;
    const w0 = w * (1 - t0 * 0.85), w1 = w * (1 - t1 * 0.85);
    parts.push(`M${cx - w0} ${y0} Q${cx - w0 * 1.15} ${(y0 + y1) / 2} ${cx - w1} ${y1 + 1} L${cx + w1} ${y1 + 1} Q${cx + w0 * 1.15} ${(y0 + y1) / 2} ${cx + w0} ${y0} Z`);
  }
  parts.push(`M${cx - 2} ${base - h * 0.82} L${cx} ${base - h} L${cx + 2} ${base - h * 0.82} Z`);
  return parts;
}

/* Lotus-capital column: base, shaft with carved bands, lotus capital */
function Column({ x, top, bottom, w, shade = 1 }: { x: number; top: number; bottom: number; w: number; shade?: number }) {
  const capH = w * 0.9;
  const baseH = w * 0.55;
  return (
    <g opacity={shade}>
      <rect x={x - w * 0.62} y={bottom - baseH} width={w * 1.24} height={baseH} fill="url(#ve-gold)" />
      <rect x={x - w / 2} y={top + capH} width={w} height={bottom - baseH - top - capH} fill="url(#ve-stone-side)" />
      {/* Carved bands */}
      {[0.22, 0.5, 0.78].map((f) => (
        <rect key={f} x={x - w / 2} y={top + capH + (bottom - baseH - top - capH) * f} width={w} height={Math.max(2, w * 0.1)} fill="url(#ve-gold-h)" opacity="0.85" />
      ))}
      {/* Fluting shadow */}
      <rect x={x + w * 0.18} y={top + capH} width={w * 0.32} height={bottom - baseH - top - capH} fill="#8C6D37" opacity="0.18" />
      {/* Lotus capital: petals opening upward to the beam */}
      <path
        d={`M${x - w * 0.5} ${top + capH} C${x - w * 0.9} ${top + capH * 0.6} ${x - w * 0.85} ${top + capH * 0.15} ${x - w * 0.95} ${top} L${x + w * 0.95} ${top} C${x + w * 0.85} ${top + capH * 0.15} ${x + w * 0.9} ${top + capH * 0.6} ${x + w * 0.5} ${top + capH} Z`}
        fill="url(#ve-gold)"
      />
      <path d={`M${x - w * 0.3} ${top + capH} C${x - w * 0.35} ${top + capH * 0.5} ${x} ${top + capH * 0.2} ${x} ${top + capH * 0.1} C${x} ${top + capH * 0.2} ${x + w * 0.35} ${top + capH * 0.5} ${x + w * 0.3} ${top + capH}`} fill="none" stroke="#8C6D37" strokeWidth={Math.max(0.8, w * 0.04)} opacity="0.7" />
    </g>
  );
}

/* A cluster of blooms: roses and jasmine over greenery */
function Flowers({ x, y, s = 1, seed = 1 }: { x: number; y: number; s?: number; seed?: number }) {
  // Deterministic scatter from an integer hash: identical on the server and
  // in every browser (Math.sin differs in the last digits between engines,
  // which made the server HTML and the client disagree)
  const h = (i: number) => {
    let x = Math.imul(seed + 0x9e3779b9, 0x85ebca6b) ^ Math.imul(i + 1, 0xc2b2ae35);
    x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
    x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const colors = ["#FFF7EE", "#F6D5D2", "#F2B9B0", "#FFFDF8", "#EDC9A0"];
  const blooms = Array.from({ length: 16 }, (_, i) => ({
    dx: r2((h(i * 4) - 0.5) * 60 * s), dy: r2((h(i * 4 + 1) - 0.7) * 34 * s), rr: r2((6 + h(i * 4 + 2) * 7) * s), c: colors[Math.floor(h(i * 4 + 3) * colors.length)],
  }));
  return (
    <g>
      <ellipse cx={x} cy={y + 6 * s} rx={40 * s} ry={16 * s} fill="#3F5A2E" />
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${x} ${y} q${(i - 3) * 9 * s} ${-14 * s} ${(i - 3) * 16 * s} ${-6 * s}`} stroke="#4E6B36" strokeWidth={3 * s} fill="none" />
      ))}
      {blooms.map((b, i) => (
        <g key={i}>
          <circle cx={x + b.dx} cy={y + b.dy} r={b.rr} fill={b.c} />
          <circle cx={x + b.dx - b.rr * 0.25} cy={y + b.dy - b.rr * 0.25} r={b.rr * 0.45} fill="#fff" opacity="0.5" />
          <circle cx={x + b.dx + b.rr * 0.2} cy={y + b.dy + b.rr * 0.3} r={b.rr * 0.35} fill="#B7826A" opacity="0.25" />
        </g>
      ))}
    </g>
  );
}

/* ─── Exterior planes ───────────────────────────────────────────────────── */

function SkyPlane() {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <rect width="1600" height="900" fill="url(#ve-sky)" />
      <circle cx="800" cy="300" r="300" fill="url(#ve-sun)" />
      <circle cx="800" cy="300" r="56" fill="#FFF3D0" opacity="0.8" />
    </svg>
  );
}

/* Hazy horizon: distant towers and palms far behind, scenery only */
function HorizonPlane() {
  const tower = (cx: number, base: number, h: number, w: number) =>
    spire(cx, base, h, w).join(" ");
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <g fill="#C7A77B" opacity="0.38">
        <path d={tower(800, 520, 150, 22)} />
        <path d={tower(735, 525, 112, 17)} />
        <path d={tower(865, 525, 112, 17)} />
        <path d={tower(680, 532, 84, 14)} />
        <path d={tower(920, 532, 84, 14)} />
        <rect x="640" y="515" width="320" height="20" />
      </g>
      {/* Sugar palms on the horizon */}
      {[[140, 540, 1.1], [260, 548, 0.8], [1340, 545, 1], [1470, 540, 1.2]].map(([x, y, s], i) => (
        <g key={i} fill="#A8885E" opacity="0.45">
          <rect x={x - 3 * s} y={y - 150 * s} width={6 * s} height={150 * s} />
          {Array.from({ length: 9 }, (_, k) => {
            const a = ((-170 + k * 20) * Math.PI) / 180;
            return <path key={k} d={`M${x} ${y - 150 * s} L${x + Math.cos(a) * 46 * s} ${y - 150 * s + Math.sin(a) * 36 * s} L${x + Math.cos(a + 0.18) * 40 * s} ${y - 150 * s + Math.sin(a + 0.18) * 32 * s} Z`} />;
          })}
        </g>
      ))}
      <rect x="0" y="470" width="1600" height="120" fill="url(#ve-haze)" />
    </svg>
  );
}

/* The wedding hall seen from the path: platform, colonnade, glowing doorway,
   three flared roof tiers, gilded pediment and spire */
function HallPlane() {
  const roofs = [roofTier(800, 342, 404, 330, 420), roofTier(800, 286, 344, 250, 330), roofTier(800, 236, 290, 170, 245)];
  const colsX = [452, 532, 612, 692, 908, 988, 1068, 1148];
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {/* Ground and path */}
      <rect x="0" y="560" width="1600" height="340" fill="url(#ve-ground)" />
      <path d="M560 900 L770 560 L830 560 L1040 900 Z" fill="url(#ve-path)" />
      {Array.from({ length: 10 }, (_, i) => {
        const t = (i + 1) / 11;
        const y = 560 + 340 * t * t;
        const half = 30 + 210 * t * t;
        return <line key={i} x1={800 - half} y1={y} x2={800 + half} y2={y} stroke="#B99E74" strokeWidth={0.6 + t * 1.6} opacity="0.55" />;
      })}
      {/* Platform and steps */}
      <rect x="410" y="520" width="780" height="42" fill="url(#ve-stone)" />
      <rect x="410" y="520" width="780" height="5" fill="url(#ve-gold-h)" opacity="0.8" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={735 - i * 8} y={530 + i * 8} width={130 + i * 16} height="8" fill={i % 2 ? "#E6D6B9" : "#F3E8D3"} />
      ))}
      {/* Colonnade: warm interior between the columns, the doorway brightest */}
      <rect x="440" y="404" width="720" height="118" fill="url(#ve-bay)" />
      <path d="M752 522 L752 438 Q800 404 848 438 L848 522 Z" fill="url(#ve-door)" />
      {colsX.map((x) => (
        <Column key={x} x={x} top={404} bottom={522} w={18} />
      ))}
      <Column x={740} top={404} bottom={522} w={22} />
      <Column x={860} top={404} bottom={522} w={22} />
      {/* Beam with kbach frieze */}
      <rect x="420" y="396" width="760" height="12" fill="url(#ve-gold-h)" />
      <path d={kbachEdge(430, 408, 1170, 408, 46)} fill="none" stroke="#8C6D37" strokeWidth="1.4" />
      {/* Roof tiers, back to front, with gold eaves and chovea */}
      {roofs.slice().reverse().map((rf, i) => (
        <g key={i}>
          <path d={rf.body} fill="url(#ve-roof)" />
          <path d={rf.eave} fill="none" stroke="url(#ve-gold-h)" strokeWidth="5" />
          {rf.chovea.map((c, k) => <path key={k} d={c} fill="url(#ve-gold)" />)}
        </g>
      ))}
      {/* Roof tiles: fine lines following the slope */}
      {Array.from({ length: 22 }, (_, i) => {
        const x = 420 + i * 36;
        return <line key={i} x1={x} y1={404} x2={800 + (x - 800) * 0.8} y2={344} stroke="#5A1A10" strokeWidth="1" opacity="0.35" />;
      })}
      {/* Pediment: gilded triangle with kbach edge and lotus boss */}
      <path d="M690 344 L800 238 L910 344 Z" fill="url(#ve-gold)" />
      <path d="M708 338 L800 252 L892 338 Z" fill="#7A2A1A" />
      <path d={kbachEdge(708, 338, 800, 252, 9) + kbachEdge(800, 252, 892, 338, 9)} fill="none" stroke="#F1D683" strokeWidth="1.6" />
      <circle cx="800" cy="306" r="17" fill="url(#ve-gold)" />
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx="800" cy="294" rx="4" ry="10" fill="#F1D683" transform={`rotate(${i * 45} 800 306)`} />
      ))}
      {/* Spire */}
      {spire(800, 240, 120, 18).map((d, i) => <path key={i} d={d} fill="url(#ve-gold)" />)}
    </svg>
  );
}

/* Lanterns and flower urns along the path */
function PathPlane() {
  const posts = [0.25, 0.5, 0.78].flatMap((t) => {
    const y = 560 + 340 * t * t;
    const half = 50 + 290 * t * t;
    const s = 0.35 + t * 1.1;
    return [{ x: 800 - half, y, s }, { x: 800 + half, y, s }];
  });
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {posts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y - 112 * p.s} r={34 * p.s} fill="url(#ve-lamp)" />
          <rect x={p.x - 3 * p.s} y={p.y - 100 * p.s} width={6 * p.s} height={100 * p.s} fill="url(#ve-gold)" />
          <path d={`M${p.x - 12 * p.s} ${p.y - 100 * p.s} L${p.x} ${p.y - 128 * p.s} L${p.x + 12 * p.s} ${p.y - 100 * p.s} Z`} fill="url(#ve-gold)" />
          <rect x={p.x - 9 * p.s} y={p.y - 122 * p.s} width={18 * p.s} height={20 * p.s} fill="#FFE7B0" opacity="0.9" />
          <ellipse cx={p.x} cy={p.y} rx={16 * p.s} ry={4 * p.s} fill="#5E4520" opacity="0.25" />
        </g>
      ))}
      <Flowers x={700} y={548} s={0.7} seed={3} />
      <Flowers x={900} y={548} s={0.7} seed={5} />
    </svg>
  );
}

/* The carved gate in the foreground, framing the view */
function GatePlane() {
  const pillar = (x: number) => (
    <g>
      <rect x={x - 70} y="150" width="140" height="750" fill="url(#ve-stone-side)" />
      <rect x={x - 82} y="820" width="164" height="80" fill="url(#ve-stone)" />
      {[260, 420, 580, 740].map((y) => (
        <g key={y}>
          <rect x={x - 70} y={y} width="140" height="10" fill="url(#ve-gold-h)" />
          <path d={kbachEdge(x - 66, y + 10, x + 66, y + 10, 8)} fill="none" stroke="#8C6D37" strokeWidth="1.4" />
        </g>
      ))}
      {/* Apsara-panel recess: a carved niche with a lotus */}
      <path d={`M${x - 40} 640 L${x - 40} 470 Q${x} 430 ${x + 40} 470 L${x + 40} 640 Z`} fill="#CDB792" />
      <path d={`M${x} 600 C${x - 18} 580 ${x - 16} 548 ${x} 520 C${x + 16} 548 ${x + 18} 580 ${x} 600 Z`} fill="url(#ve-gold)" />
      <rect x={x - 70} y="150" width="18" height="750" fill="#7E6542" opacity="0.18" />
    </g>
  );
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {pillar(160)}
      {pillar(1440)}
      {/* Lintel with a tiered kbach pediment */}
      <rect x="80" y="110" width="1440" height="56" fill="url(#ve-stone)" />
      <rect x="80" y="160" width="1440" height="8" fill="url(#ve-gold-h)" />
      <path d={kbachEdge(90, 110, 1510, 110, 70)} fill="none" stroke="#8C6D37" strokeWidth="2" />
      <path d="M560 112 Q800 -20 1040 112 Z" fill="url(#ve-stone)" />
      <path d={kbachEdge(570, 110, 800, 8, 14) + kbachEdge(800, 8, 1030, 110, 14)} fill="none" stroke="url(#ve-gold-h)" strokeWidth="3" />
      {/* Jasmine garland swagged under the lintel */}
      {[[230, 800], [800, 1370]].map(([a, b], i) => (
        <g key={i}>
          {Array.from({ length: 36 }, (_, k) => {
            const t = k / 35;
            const x = a + (b - a) * t;
            const y = 172 + Math.sin(t * Math.PI) * 70;
            return <circle key={k} cx={x} cy={y} r={k % 6 === 0 ? 7 : 4.5} fill={k % 6 === 0 ? "#E8A9A0" : "#FFFDF5"} stroke="#D7C9AE" strokeWidth="0.6" />;
          })}
        </g>
      ))}
    </svg>
  );
}

/* ─── Interior planes ───────────────────────────────────────────────────── */

/* Far plane: walls, coffered ceiling, polished floor, aisle and the stage */
function HallInteriorPlane({ portrait }: { portrait?: string }) {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {/* Ceiling, side walls, back wall, floor in one-point perspective */}
      <path d="M0 0 L1600 0 L1080 250 L520 250 Z" fill="url(#ve-ceiling)" />
      {Array.from({ length: 9 }, (_, i) => {
        const x = (1600 / 8) * i;
        return <line key={i} x1={x} y1="0" x2={520 + (560 / 8) * i} y2="250" stroke="#C9A56A" strokeWidth="1.2" opacity="0.4" />;
      })}
      {[60, 130, 190].map((y, i) => {
        const t = y / 250;
        return <line key={i} x1={520 * t} y1={y} x2={1600 - 520 * t} y2={y} stroke="#C9A56A" strokeWidth="1.2" opacity="0.4" />;
      })}
      <path d="M0 0 L520 250 L520 640 L0 900 Z" fill="url(#ve-wall-side)" />
      <path d="M1600 0 L1080 250 L1080 640 L1600 900 Z" fill="url(#ve-wall-side-r)" />
      <rect x="520" y="250" width="560" height="390" fill="url(#ve-wall)" />
      <path d="M0 900 L520 640 L1080 640 L1600 900 Z" fill="url(#ve-floor)" />
      {/* Polished floor: the stage light reflected */}
      <path d="M640 640 L960 640 L1100 900 L500 900 Z" fill="url(#ve-floor-glow)" />
      {Array.from({ length: 7 }, (_, i) => {
        const t = (i + 1) / 8;
        const y = 640 + 260 * t * t;
        return <line key={i} x1={520 - 520 * t * t} y1={y} x2={1080 + 520 * t * t} y2={y} stroke="#8C6D37" strokeWidth="0.8" opacity="0.25" />;
      })}
      {/* Aisle runner to the stage */}
      <path d="M760 640 L840 640 L960 900 L640 900 Z" fill="url(#ve-aisle)" />
      <path d="M760 640 L640 900 M840 640 L960 900" stroke="#D4AF37" strokeWidth="2" opacity="0.8" />
      {/* Guest chairs in rows either side of the aisle */}
      {[0.25, 0.42, 0.6, 0.8].flatMap((t, row) => {
        const y = 640 + 260 * t * t;
        const s = 0.45 + t * 1.1;
        const halfAisle = 40 + 120 * t * t;
        return [-1, 1].flatMap((side) =>
          Array.from({ length: 4 }, (_, k) => {
            const x = 800 + side * (halfAisle + 26 * s + k * 52 * s);
            return (
              <g key={`${row}-${side}-${k}`}>
                <rect x={x - 16 * s} y={y - 48 * s} width={32 * s} height={44 * s} rx={6 * s} fill="#FBF6EC" stroke="#D8C49C" strokeWidth={0.8} />
                <rect x={x - 16 * s} y={y - 48 * s} width={32 * s} height={8 * s} rx={4 * s} fill="url(#ve-gold-h)" opacity="0.7" />
              </g>
            );
          })
        );
      })}
      {/* Stage: raised platform with steps */}
      <rect x="590" y="590" width="420" height="52" fill="url(#ve-stone)" />
      <rect x="590" y="588" width="420" height="5" fill="url(#ve-gold-h)" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={730 - i * 10} y={612 + i * 10} width={140 + i * 20} height="10" fill={i % 2 ? "#E9DCC3" : "#F6EEDD"} />
      ))}
      {/* Backdrop: a Khmer arch, gold frame over deep red silk */}
      <circle cx="800" cy="420" r="240" fill="url(#ve-stage-light)" />
      <path d="M640 588 L640 380 Q640 300 720 268 Q776 246 800 196 Q824 246 880 268 Q960 300 960 380 L960 588 Z" fill="url(#ve-gold)" />
      <path d="M660 588 L660 384 Q660 316 728 288 Q780 266 800 226 Q820 266 872 288 Q940 316 940 384 L940 588 Z" fill="url(#ve-silk)" />
      <path d={kbachEdge(640, 380, 720, 268, 6) + kbachEdge(720, 268, 800, 196, 6) + kbachEdge(800, 196, 880, 268, 6) + kbachEdge(880, 268, 960, 380, 6)} fill="none" stroke="#F1D683" strokeWidth="2" />
      {/* The couple's portrait, if they've given one; otherwise a lotus medallion */}
      <ellipse cx="800" cy="408" rx="72" ry="92" fill="url(#ve-gold)" />
      {portrait ? (
        <image href={portrait} x="736" y="324" width="128" height="168" preserveAspectRatio="xMidYMid slice" clipPath="url(#ve-portrait-clip)" />
      ) : (
        <g>
          <ellipse cx="800" cy="408" rx="64" ry="84" fill="#7A1A1E" />
          {Array.from({ length: 8 }, (_, i) => (
            <ellipse key={i} cx="800" cy="384" rx="9" ry="24" fill="url(#ve-gold)" transform={`rotate(${i * 45} 800 408)`} />
          ))}
          <circle cx="800" cy="408" r="12" fill="#F1D683" />
        </g>
      )}
      {/* Flowers banked along the stage and at its corners */}
      <Flowers x={650} y={586} s={1.2} seed={7} />
      <Flowers x={950} y={586} s={1.2} seed={11} />
      <Flowers x={730} y={592} s={0.8} seed={13} />
      <Flowers x={870} y={592} s={0.8} seed={17} />
    </svg>
  );
}

/* Middle plane: the farther columns and smaller chandeliers */
function HallMidPlane() {
  const cols = [[430, 248, 652, 22], [1170, 248, 652, 22], [330, 215, 690, 30], [1270, 215, 690, 30]] as const;
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      {cols.map(([x, t, b, w]) => (
        <Column key={x} x={x} top={t} bottom={b} w={w} />
      ))}
      {[[800, 262, 0.55], [800, 200, 0.75]].map(([x, y, s], i) => (
        <Chandelier key={i} x={x} y={y} s={s} />
      ))}
    </svg>
  );
}

/* Near plane: the nearest columns and the big chandelier, which slide past */
function HallNearPlane() {
  return (
    <svg viewBox={VB} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
      <Column x={150} top={120} bottom={900} w={70} />
      <Column x={1450} top={120} bottom={900} w={70} />
      <rect x="0" y="80" width="1600" height="40" fill="url(#ve-gold-h)" opacity="0.9" />
      <path d={kbachEdge(0, 120, 1600, 120, 64)} fill="none" stroke="#8C6D37" strokeWidth="2" />
      <Chandelier x={800} y={120} s={1.2} />
    </svg>
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
              return <circle key={k} cx={x + Math.cos(a) * rx} cy={ry + Math.sin(a) * 6 * s + 8 * s} r={3 * s} fill="#FFF6DC" />;
            })}
          </g>
        );
      })}
      <path d={`M${x - 10 * s} ${y + 54 * s} L${x} ${y + 76 * s} L${x + 10 * s} ${y + 54 * s} Z`} fill="#FFF0C8" />
    </g>
  );
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function VenueEntrance(props: VenueEntranceProps) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // No camera move: show the hall and stage with every detail at once
      root.style.height = "100svh";
      root.querySelector<HTMLElement>("[data-exterior]")!.style.visibility = "hidden";
      root.querySelector<HTMLElement>("[data-title]")!.style.visibility = "hidden";
      root.querySelector<HTMLElement>("[data-hint]")!.style.visibility = "hidden";
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
        gsap.set(q("[data-in-far]"), { scale: zs(1.25) });
        gsap.set(q("[data-in-mid]"), { scale: 1.5 });
        gsap.set(q("[data-in-near]"), { scale: 1.9 });
        gsap.set(q("[data-doorlight]"), { opacity: 0 });
        gsap.set(q("[data-stage-text]"), { autoAlpha: 0, y: 24 });
        gsap.set(q("[data-hint]"), { autoAlpha: 1 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: "venue-entrance",
            trigger: root,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        tl.addLabel("approach", 0)
          .to(q("[data-hint]"), { autoAlpha: 0, duration: 4 }, "approach")
          .to(q("[data-title]"), { autoAlpha: 0, y: -30, duration: 10 }, "approach+=4")
          // The gate passes either side of the camera
          .to(q("[data-gate]"), { scale: 2.6, autoAlpha: 0, duration: 24, ease: "power1.in" }, "approach")
          .to(q("[data-path]"), { scale: 1.9, duration: 30 }, "approach")
          .to(q("[data-hall]"), { scale: 1.7, duration: 30 }, "approach")
          .to(q("[data-horizon]"), { scale: 1.08, duration: 30 }, "approach")
          .to(q("[data-sky]"), { scale: 1.05, duration: 30 }, "approach")
          .addLabel("door", 30)
          // Up the steps until the doorway fills the view, warm light floods in
          .to(q("[data-hall]"), { scale: 5.5, duration: 16, ease: "power2.in" }, "door")
          .to(q("[data-path]"), { scale: 4, autoAlpha: 0, duration: 12, ease: "power2.in" }, "door")
          .to(q("[data-doorlight]"), { opacity: 1, duration: 10, ease: "power1.in" }, "door+=8")
          .addLabel("inside", 46)
          .set(q("[data-exterior]"), { autoAlpha: 0 }, "inside")
          .set(q("[data-interior]"), { autoAlpha: 1 }, "inside")
          .to(q("[data-doorlight]"), { opacity: 0, duration: 10, ease: "power1.out" }, "inside")
          // Walking down the aisle: near planes slide past faster than far ones
          .to(q("[data-in-far]"), { scale: zs(1.35), duration: 40, ease: "power1.out" }, "inside")
          .to(q("[data-in-mid]"), { scale: zs(1.35), duration: 40, ease: "power1.out" }, "inside")
          .to(q("[data-in-near]"), { scale: zs(1.6), duration: 40, ease: "power1.out" }, "inside")
          .to(q("[data-in-far]"), { scale: zs(1.6), duration: 30, ease: "power1.inOut" }, "inside+=40")
          .to(q("[data-in-mid]"), { scale: zs(2.1), duration: 30, ease: "power1.inOut" }, "inside+=40")
          .to(q("[data-in-near]"), { scale: 3.2, autoAlpha: 0, duration: 24, ease: "power1.in" }, "inside+=40")
          .addLabel("stage", 84)
          .to(q("[data-stage-text]"), { autoAlpha: 1, y: 0, duration: 10, stagger: 2, ease: "power2.out" }, "stage");
      }, root);
      cleanup = () => ctx.revert();
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  const titleCls = props.khmerNames
    ? "font-moul text-[clamp(17px,3vw,34px)] leading-[1.75]"
    : "wc-display text-[clamp(24px,3.6vw,44px)] leading-tight";

  /* Layers are scaled around the doorway (exterior) and the stage (interior);
     transform-origin in % of the sliced 1600×900 frame lands on those points */
  const layer = "absolute inset-0 will-change-transform";
  return (
    <section ref={rootRef} className="relative h-[340vh]" aria-label={`${props.groom} & ${props.bride}`}>
      <div className="sticky top-0 h-[100svh] min-h-[560px] overflow-hidden bg-[#2a1a0e]">
        <Defs />
        {/* Exterior */}
        <div data-exterior className="absolute inset-0">
          <div data-sky className={layer} style={{ transformOrigin: "50% 55%" }}><SkyPlane /></div>
          <div data-horizon className={layer} style={{ transformOrigin: "50% 58%" }}><HorizonPlane /></div>
          <div data-hall className={layer} style={{ transformOrigin: "50% 53.5%" }}><HallPlane /></div>
          <div data-path className={layer} style={{ transformOrigin: "50% 62%" }}><PathPlane /></div>
          <div data-gate className={layer} style={{ transformOrigin: "50% 55%" }}><GatePlane /></div>
        </div>
        {/* Interior: hidden until the camera passes the doorway */}
        <div data-interior className="absolute inset-0 invisible">
          <div data-in-far className={layer} style={{ transformOrigin: "50% 50%" }}><HallInteriorPlane portrait={props.portrait} /></div>
          <div data-in-mid className={layer} style={{ transformOrigin: "50% 50%" }}><HallMidPlane /></div>
          <div data-in-near className={layer} style={{ transformOrigin: "50% 45%" }}><HallNearPlane /></div>
        </div>
        {/* Warm light through the doorway */}
        <div data-doorlight className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_55%,#fff6dc_0%,#ffd893_45%,rgba(255,216,147,0.0)_80%)] opacity-0" />

        {/* Words: names on arrival, then the details on the stage */}
        {/* Arrival: the names on an ivory plaque hung from the gate's lintel,
            above the hall's spire so no word sits on the architecture */}
        <div data-title className="absolute inset-x-0 top-[72px] sm:top-[4%] px-4 flex justify-center">
          <div className="max-w-[92vw] rounded-b-[18px] rounded-t-md bg-[#fffaf0]/90 backdrop-blur-[2px] border border-[#d4af37]/60 shadow-[0_14px_30px_-18px_rgba(60,40,10,0.6)] px-5 sm:px-8 pt-2 pb-3 text-center text-[#3a2410]">
            <p className={props.khmerNames ? "text-[12px] text-[#7a4d0c] wc-km-lh" : "wc-smallcaps text-[#7a4d0c]"}>{props.kicker}</p>
            <h1 className={titleCls}>
              {props.groom} <span className="text-[#B08A3E]">&amp;</span> {props.bride}
            </h1>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-[6%] sm:bottom-[7%] px-5 text-center">
          <div data-stage-text className="invisible mx-auto max-w-[680px] rounded-2xl bg-[#1d130b]/55 backdrop-blur-sm px-5 py-4 text-[#fbf1dc] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]">
            <p className={props.khmerNames ? "font-moul text-[clamp(20px,4.2vw,36px)] leading-[1.75]" : "wc-display text-[clamp(28px,5vw,48px)] leading-tight"}>
              {props.groom} <span className="text-[#E5C158]">&amp;</span> {props.bride}
            </p>
            <p className="mt-1 text-[15px] text-[#f3dfb5] wc-km-lh">
              {props.dateLine}
              {props.timeLine ? ` · ${props.timeLine}` : ""}
            </p>
            {props.venue && <p className="mt-1 text-[14px] text-[#e9d6b2]/90 wc-km-lh">{props.venue}</p>}
            {props.guestLine && <p className="mt-2 text-[14px] text-[#f1d683] wc-km-lh">{props.guestLine}</p>}
          </div>
        </div>
        <p data-hint className="absolute bottom-4 inset-x-0 text-center text-[12px] text-[#5a3a1a]/70">{props.scrollHint} ↓</p>
      </div>
    </section>
  );
}
