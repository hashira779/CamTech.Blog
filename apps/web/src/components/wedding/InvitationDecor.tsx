import React from "react";
import { KbachCorner } from "./KhmerKbach";

/* The invitation's shared dressing: real flowers (CC0 photographs, cut out,
   see public/wedding/flowers/SOURCES.txt) and a gilded kbach frame, used
   the same way from the invitation card down to the reply card, so every
   section belongs to one printed set.

   Flowers drift in from their side as their section scrolls into view
   (.pi-in-l / .pi-in-r in globals.css, scroll timelines where supported;
   simply shown elsewhere and under reduced motion). */

export type FlowerName = "rose-white" | "orchid-spray" | "orchid-white" | "jasmine" | "plumeria-pink" | "plumeria";

const SIZES: Record<FlowerName, [number, number]> = {
  "rose-white": [743, 900],
  "orchid-spray": [517, 900],
  "orchid-white": [900, 812],
  jasmine: [900, 588],
  "plumeria-pink": [900, 739],
  plumeria: [719, 900],
};

/** One cut-out flower, absolutely placed by `className` (position, width,
    rotation); `from` is the side it drifts in from, `delay` 0..1 staggers it */
export function Flower({ name, className, from = "l", delay = 0, sway = false }: { name: FlowerName; className: string; from?: "l" | "r"; delay?: number; sway?: boolean }) {
  const [w, h] = SIZES[name];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/wedding/flowers/${name}.webp`}
      alt=""
      aria-hidden="true"
      width={w}
      height={h}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`pi-flower ${sway ? "pi-sway origin-top" : from === "l" ? "pi-in-l" : "pi-in-r"} pointer-events-none select-none absolute h-auto ${className}`}
      style={{ "--pi-d": String(delay) } as React.CSSProperties}
    />
  );
}

/** A gilded frame inside its parent: a double rule with kbach sprays
    turning each corner. The parent must be positioned. `tone` picks gold
    that reads on light paper or on dark silk. */
export function GoldFrame({ tone = "light", corner = "w-14 h-14 sm:w-16 sm:h-16" }: { tone?: "light" | "dark"; corner?: string }) {
  const line = tone === "dark" ? "border-[#D9B45A]" : "border-[#C9A24A]";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className={`absolute inset-2 sm:inset-2.5 border-[1.5px] ${line}`} />
      <div className={`absolute inset-[13px] sm:inset-4 border ${line} opacity-50`} />
      <KbachCorner className={`absolute top-1 left-1 ${corner}`} />
      <KbachCorner flip="x" className={`absolute top-1 right-1 ${corner}`} />
      <KbachCorner flip="y" className={`absolute bottom-1 left-1 ${corner}`} />
      <KbachCorner flip="xy" className={`absolute bottom-1 right-1 ${corner}`} />
    </div>
  );
}
