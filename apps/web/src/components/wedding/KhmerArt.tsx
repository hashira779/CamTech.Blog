/**
 * Khmer line art for the invitation: kbach ornament bands, Angkor Wat at dawn,
 * the red wedding thread and the ceremony icons.
 *
 * Everything is single-weight strokes in `currentColor` with pathLength="1",
 * so the stylesheet can draw it in like pen work: `.wc-draw` as it scrolls into
 * view, `.wc-draw-open` once the envelope has been opened.
 */

import type { ReactNode } from "react";

type DrawMode = "scroll" | "open";
const drawClass = (mode: DrawMode) => (mode === "open" ? "wc-draw-open" : "wc-draw");

/* ── Kbach band ───────────────────────────────────────────────────────────── */

/**
 * A run of kbach phni tes: paired flame-leaves curling toward a central bud,
 * repeated along a baseline. Used as section breaks and as the cover crest.
 */
export function KbachBand({
  tiles = 9,
  mode = "scroll",
  className = "w-full max-w-md h-7",
}: {
  tiles?: number;
  mode?: DrawMode;
  className?: string;
}) {
  const W = 48;
  return (
    <svg
      viewBox={`0 0 ${tiles * W} 30`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${drawClass(mode)} ${className}`}
      aria-hidden="true"
    >
      <path pathLength={1} d={`M2 27.5 H${tiles * W - 2}`} />
      {Array.from({ length: tiles }, (_, i) => {
        const x = i * W;
        return (
          <g key={i}>
            <path pathLength={1} d={`M${x + 5} 25 C${x + 11} 23 ${x + 15} 15 ${x + 12} 6 C${x + 19} 10 ${x + 21} 19 ${x + 17} 25`} />
            <path pathLength={1} d={`M${x + 43} 25 C${x + 37} 23 ${x + 33} 15 ${x + 36} 6 C${x + 29} 10 ${x + 27} 19 ${x + 31} 25`} />
            <path pathLength={1} d={`M${x + 24} 25 C${x + 19.5} 19 ${x + 20} 11 ${x + 24} 4 C${x + 28} 11 ${x + 28.5} 19 ${x + 24} 25 Z`} />
            <circle cx={x + 24} cy={1.8} r={1.1} fill="currentColor" stroke="none" />
          </g>
        );
      })}
    </svg>
  );
}

/* ── Angkor Wat at dawn ───────────────────────────────────────────────────── */

const GROUND = 196;

/** A prasat tower: the lotus-bud silhouette with its tier lines. */
function towerPaths(cx: number, base: number, w: number, h: number): string[] {
  const top = base - h;
  const half = w / 2;
  const out = [
    `M${cx - half} ${base} C${cx - half} ${base - h * 0.45} ${cx - w * 0.3} ${base - h * 0.82} ${cx} ${top} C${cx + w * 0.3} ${base - h * 0.82} ${cx + half} ${base - h * 0.45} ${cx + half} ${base}`,
  ];
  for (let k = 1; k <= 4; k++) {
    const y = base - (h * k) / 5.4;
    const hw = half * (1 - Math.pow(k / 5.4, 1.7)) * 0.98;
    out.push(`M${(cx - hw).toFixed(1)} ${y.toFixed(1)} Q${cx} ${(y - 3).toFixed(1)} ${(cx + hw).toFixed(1)} ${y.toFixed(1)}`);
  }
  // Finial
  out.push(`M${cx} ${top} V${top - 7}`);
  return out;
}

/** A sugar palm (ដើមត្នោត): a long slender trunk and a burst of fan fronds. */
function palmPaths(x: number, h: number, lean: number): string[] {
  const tx = x + lean;
  const ty = GROUND - h;
  const out = [`M${x} ${GROUND} C${x + lean * 0.2} ${GROUND - h * 0.5} ${x + lean * 0.7} ${GROUND - h * 0.8} ${tx} ${ty}`];
  const fronds: [number, number][] = [[-24, -2], [-20, -14], [-9, -22], [5, -23], [17, -16], [24, -4], [-21, 9], [20, 10]];
  for (const [dx, dy] of fronds) {
    out.push(`M${tx} ${ty} Q${tx + dx * 0.5} ${ty + dy * 0.5 - 7} ${tx + dx} ${ty + dy}`);
  }
  return out;
}

const ANGKOR_PATHS: string[] = [
  // Terraces
  `M70 ${GROUND} V${GROUND - 14} H570 V${GROUND}`,
  `M130 ${GROUND - 14} V${GROUND - 30} H510 V${GROUND - 14}`,
  `M205 ${GROUND - 30} V${GROUND - 44} H435 V${GROUND - 30}`,
  // Galleries between the towers
  `M150 ${GROUND - 30} H490`,
  `M232 ${GROUND - 44} Q320 ${GROUND - 50} 408 ${GROUND - 44}`,
  // Five towers: two outer, two inner, the central one tallest
  ...towerPaths(160, GROUND - 30, 36, 62),
  ...towerPaths(480, GROUND - 30, 36, 62),
  ...towerPaths(242, GROUND - 44, 40, 78),
  ...towerPaths(398, GROUND - 44, 40, 78),
  ...towerPaths(320, GROUND - 44, 52, 112),
  // Causeway toward the viewer
  `M290 ${GROUND} L268 ${GROUND + 44} M350 ${GROUND} L372 ${GROUND + 44}`,
];

const PALM_PATHS: string[] = [
  ...palmPaths(36, 118, -6),
  ...palmPaths(62, 92, 5),
  ...palmPaths(596, 124, 6),
  ...palmPaths(618, 88, -4),
];

/**
 * Angkor Wat at dawn: the five towers on their terraces, sugar palms either
 * side, the reflection in the moat and a sun rising behind the central tower.
 */
export function AngkorDawn({ className = "w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 260" fill="none" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="wc-sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--wc-light)" stopOpacity="0.9" />
          <stop offset="55%" stopColor="var(--wc-light)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--wc-light)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sun: rises with the scroll (.wc-sun in globals.css) */}
      <g className="wc-sun">
        <circle cx="320" cy="96" r="88" fill="url(#wc-sun-glow)" />
        <circle cx="320" cy="96" r="34" fill="var(--wc-light)" opacity="0.75" />
      </g>

      <g className="wc-draw" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        {[...ANGKOR_PATHS, ...PALM_PATHS].map((d, i) => (
          <path key={i} pathLength={1} d={d} />
        ))}
        {/* Water line and ripples */}
        <path pathLength={1} d={`M10 ${GROUND} H630`} />
        {[
          [120, 214, 60], [250, 222, 40], [400, 216, 70], [520, 228, 46], [180, 238, 34], [330, 244, 52],
        ].map(([x, y, w], i) => (
          <path key={`r${i}`} pathLength={1} d={`M${x} ${y} q${w / 4} -3 ${w / 2} 0 t${w / 2} 0`} strokeWidth="0.8" opacity="0.6" />
        ))}
      </g>

      {/* Reflection in the moat */}
      <g
        className="wc-draw"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.22"
        transform={`translate(0 ${GROUND * 2}) scale(1 -1)`}
      >
        {ANGKOR_PATHS.slice(0, -1).map((d, i) => (
          <path key={i} pathLength={1} d={d} />
        ))}
      </g>
    </svg>
  );
}

/* ── Red thread (ចងដៃ) ────────────────────────────────────────────────────── */

/**
 * Two strands of red cotton thread looping into a knot, as tied around the
 * couple’s wrists at the ចងដៃ ceremony, stretched across the space between
 * the two portraits.
 */
export function RedThread({ className = "" }: { className?: string }) {
  const strand =
    "M420 135 C470 135 500 165 518 188 C538 214 566 196 546 180 C526 164 504 204 534 222 C566 240 590 246 640 252";
  return (
    <svg viewBox="0 0 1000 400" preserveAspectRatio="none" fill="none" className={`wc-draw ${className}`} aria-hidden="true">
      <path pathLength={1} d={strand} stroke="#b3262d" strokeWidth="1.4" strokeLinecap="round" />
      <path pathLength={1} d={strand} transform="translate(0 6)" stroke="#c9453f" strokeWidth="0.9" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

/* ── Ceremony icons ───────────────────────────────────────────────────────── */

export type CeremonyIconName = "procession" | "blessing" | "haircut" | "popil" | "sampeah" | "chongdai" | "petals";

const ICONS: Record<CeremonyIconName, ReactNode> = {
  procession: (
    <>
      <path pathLength={1} d="M3 15 H21" />
      <path pathLength={1} d="M5 15 C5 19.5 19 19.5 19 15" />
      <circle pathLength={1} cx="9" cy="12" r="2.6" />
      <circle pathLength={1} cx="14.5" cy="11.5" r="3.1" />
      <path pathLength={1} d="M14.5 8.4 C14.5 6 16 4.5 18 4.4" />
    </>
  ),
  blessing: (
    <>
      <path pathLength={1} d="M12 18.5 C8 14.5 8 10 12 5.5 C16 10 16 14.5 12 18.5 Z" />
      <path pathLength={1} d="M12 18.5 C7 18.5 4 15.5 3 12.5 C7 12.5 10 14.5 12 18.5" />
      <path pathLength={1} d="M12 18.5 C17 18.5 20 15.5 21 12.5 C17 12.5 14 14.5 12 18.5" />
    </>
  ),
  haircut: (
    <>
      <circle pathLength={1} cx="6.5" cy="17.5" r="2.6" />
      <circle pathLength={1} cx="17.5" cy="17.5" r="2.6" />
      <path pathLength={1} d="M8.3 15.6 L16.5 3.5" />
      <path pathLength={1} d="M15.7 15.6 L7.5 3.5" />
    </>
  ),
  popil: (
    <>
      <path pathLength={1} d="M6 21 C8.5 18 15.5 18 18 21" />
      <path pathLength={1} d="M10.2 19.2 V11 H13.8 V19.2" />
      <path className="wc-flame" d="M12 9.2 C10.4 7.6 10.9 5.4 12 3.2 C13.1 5.4 13.6 7.6 12 9.2 Z" fill="currentColor" stroke="none" />
    </>
  ),
  sampeah: (
    <>
      <path pathLength={1} d="M12 3.5 C10.4 6.5 9.8 10.5 10.3 14.5 L8.8 21" />
      <path pathLength={1} d="M12 3.5 C13.6 6.5 14.2 10.5 13.7 14.5 L15.2 21" />
      <path pathLength={1} d="M10.3 14.5 H13.7" />
    </>
  ),
  chongdai: (
    <>
      <path pathLength={1} d="M3.5 12 C3.5 8.5 20.5 8.5 20.5 12 C20.5 15.5 3.5 15.5 3.5 12 Z" />
      <path pathLength={1} d="M12 10 C14 6 18.5 7 16.5 10 C14.5 13 11 12.2 12 10" stroke="#b3262d" />
      <path pathLength={1} d="M12.2 14.5 L10.2 20.5 M12.8 14.5 L15.2 20.5" stroke="#b3262d" />
    </>
  ),
  petals: (
    <>
      <path pathLength={1} d="M5.5 8 C6.5 5.5 9.5 5.5 9.5 8 C9.5 10.5 6.5 10.5 5.5 8 Z" />
      <path pathLength={1} d="M14 5 C15.5 3 18 3.5 17.5 6 C17 8.5 14.5 7.5 14 5 Z" />
      <path pathLength={1} d="M11 15 C12.5 13 15 13.5 14.5 16 C14 18.5 11.5 17.5 11 15 Z" />
      <path pathLength={1} d="M4 18 C5 16.5 7 16.8 6.8 18.6 C6.6 20.4 4.6 19.8 4 18 Z" />
      <circle cx="18.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="13" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
};

export function CeremonyIcon({ name, className = "w-10 h-10" }: { name: CeremonyIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={`wc-draw ${className}`} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}
