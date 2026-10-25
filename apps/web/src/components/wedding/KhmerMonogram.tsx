import React, { useId } from "react";
import { bez, bezAngle, flame, lancet, pkaChan, place, tongue, type Cubic, type Shape } from "./kbachGeometry";

/* The couple's monogram in a gilded kbach teardrop (kbach phni), the way
   Khmer wedding stationery sets the initials of the bride and groom: the
   two initials stacked inside a teardrop fringed with flame-leaves, a pair
   of great flames curling out from its foot, and the two given names on a
   flourish below.

   Drawn in code from the same strokes as the hall's kbach (see
   kbachGeometry.ts); the letters are real text, so they follow the card's
   data. Sizes follow the box: give it a width and it keeps its shape. */

const mirror = (s: Shape[]) => [...s, ...place(s, 0, 0, 0, -1, 1)];

/* The teardrop's left edge, from the foot up to the tip */
const EDGE: Cubic = [[0, 1], [-0.78, 1], [-0.8, -0.05], [0, -1.2]];
const OUTER = "M0 1 C-0.78 1 -0.8 -0.05 0 -1.2 C0.8 -0.05 0.78 1 0 1 Z";
const INNER = "M0 0.88 C-0.66 0.88 -0.68 -0.03 0 -1.04 C0.68 -0.03 0.66 0.88 0 0.88 Z";
const HAIR = "M0 0.82 C-0.6 0.82 -0.62 -0.02 0 -0.96 C0.62 -0.02 0.6 0.82 0 0.82 Z";

function frame(): Shape[] {
  const out: Shape[] = [];
  // Flame-leaves fringing the edge, tips thrown outward
  const fringe: Shape[] = [];
  for (let i = 0; i < 11; i++) {
    const t = 0.06 + (i * 0.86) / 10;
    const [x, y] = bez(EDGE, t);
    const phi = (bezAngle(EDGE, t) * 180) / Math.PI;
    const s = 0.34 - i * 0.012;
    fringe.push(...place(i % 2 ? tongue() : flame(), x, y, phi * 0.55 + 8, -s, s));
  }
  out.push(...mirror(fringe));
  out.push(...place(lancet(), 0, -1.16, 0, 0.42));
  // Two great flames curling out from the foot, a pka chan between them
  out.push(...mirror(place(flame(), -0.1, 0.98, -78, -0.72, 0.72)));
  out.push(...mirror(place(tongue(), -0.06, 1.0, -128, -0.44, 0.44)));
  // The gilded body, cut back to the ground inside, and a hairline
  out.push({ d: OUTER, role: "gold", w: 0.02 });
  out.push({ d: INNER, role: "ground" });
  out.push({ d: HAIR, role: "line", w: 0.012 });
  out.push(...place(pkaChan(), 0, 1.0, 45, 0.17));
  // Flourish under the names: a flame lying out to each side
  out.push(...mirror(place(flame(), -0.2, 1.9, -96, -0.5, 0.5)));
  out.push(...mirror(place(tongue(), -0.62, 1.86, -84, 0.28)));
  return out;
}

const SHAPES = frame();

/** First letter of the given name (the last word; Khmer names put the
    family name first), as a bare consonant where it is Khmer */
function initial(name: string) {
  const given = (name || "").trim().split(/\s+/).pop() || "";
  const cp = given.codePointAt(0);
  if (cp === undefined) return "";
  return String.fromCodePoint(cp);
}

export function givenName(name: string) {
  return (name || "").trim().split(/\s+/).pop() || "";
}

export function KhmerMonogram({ groom, bride, ground = "#FBF3E2", ink = "dark", className = "" }: { groom: string; bride: string; ground?: string; ink?: "dark" | "light"; className?: string }) {
  const id = useId().replace(/[:]/g, "");
  const gold = `km-gold-${id}`;
  const edge = ink === "dark" ? "#8A6424" : "#6E4A12";
  const goldText = "bg-[linear-gradient(170deg,#F7E3A0_0%,#D9AE4A_45%,#A9792B_100%)] bg-clip-text text-transparent";
  return (
    <div className={`relative [container-type:inline-size] ${className}`}>
      <svg viewBox="-1.3 -1.7 2.6 3.8" className="block w-full h-auto overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFF4CC" />
            <stop offset="0.35" stopColor="#EBC766" />
            <stop offset="0.7" stopColor="#C4923A" />
            <stop offset="1" stopColor="#8E6526" />
          </linearGradient>
        </defs>
        {SHAPES.map((s, i) => {
          switch (s.role) {
            case "gold":
              return <path key={i} d={s.d} fill={`url(#${gold})`} stroke={edge} strokeWidth={(s.w ?? 0.02) * 0.5} strokeLinejoin="round" />;
            case "ground":
              return <path key={i} d={s.d} fill={ground} />;
            case "line":
              return <path key={i} d={s.d} fill="none" stroke={edge} strokeOpacity="0.75" strokeWidth={(s.w ?? 0.02) * 0.7} strokeLinecap="round" />;
            case "shine":
              return <path key={i} d={s.d} fill="#FFF4CC" fillOpacity="0.5" />;
            default:
              return <path key={i} d={s.d} fill="none" stroke={`url(#${gold})`} strokeWidth={s.w} strokeLinecap="round" />;
          }
        })}
      </svg>
      {/* The initials, stacked in the teardrop */}
      <div className="absolute inset-x-0 top-[25%] h-[41%] flex flex-col items-center justify-center leading-[1.25]">
        <span className={`font-moul text-[17cqw] ${goldText}`}>{initial(groom)}</span>
        <span className={`font-moul text-[17cqw] ${goldText}`}>{initial(bride)}</span>
      </div>
      {/* The two given names on the flourish */}
      <div className="absolute inset-x-[-8%] top-[83%] flex items-baseline justify-center gap-[5cqw] font-moul text-[7.5cqw] leading-[1.6] whitespace-nowrap">
        <span className={goldText}>{givenName(groom)}</span>
        <span className={goldText}>{givenName(bride)}</span>
      </div>
    </div>
  );
}
