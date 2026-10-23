/**
 * Fine-line ornaments for the invitation, drawn as single-weight strokes so
 * they read like pen work on paper. Every stroke carries pathLength="1" so the
 * .wc-draw rule in globals.css can draw it in as it scrolls into view.
 */

type InkProps = { className?: string };

/** Lotus bud between two hairlines, for section breaks. */
export function LotusDivider({ className = "w-56 h-10" }: InkProps) {
  return (
    <svg viewBox="0 0 240 40" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={`wc-draw ${className}`} aria-hidden="true">
      <path pathLength={1} d="M6 26 C40 25 70 26 92 25" />
      <path pathLength={1} d="M148 25 C170 26 200 25 234 26" />
      <path pathLength={1} d="M120 5 C111 13 109 22 120 33 C131 22 129 13 120 5 Z" />
      <path pathLength={1} d="M120 33 C107 31 98 24 95 14 C105 15 115 21 120 33" />
      <path pathLength={1} d="M120 33 C133 31 142 24 145 14 C135 15 125 21 120 33" />
      <path pathLength={1} d="M100 30 C106 35 113 36 120 35 C127 36 134 35 140 30" />
      <circle cx="82" cy="25.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="158" cy="25.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Corner flourish for the letter card; mirror it with the `flip` prop. */
export function CornerFlourish({
  className = "w-14 h-14",
  flip = "",
}: InkProps & { flip?: "" | "x" | "y" | "xy" }) {
  const transform = { "": "", x: "scaleX(-1)", y: "scaleY(-1)", xy: "scale(-1)" }[flip];
  return (
    <svg viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className={`wc-draw ${className}`} style={{ transform }} aria-hidden="true">
      <path pathLength={1} d="M3 56 C3 26 22 5 54 3" />
      <path pathLength={1} d="M10 56 C11 34 26 13 54 10" />
      <path pathLength={1} d="M16 17 C22 9 31 7 38 11 C30 13 23 16 16 17 Z" />
      <path pathLength={1} d="M17 16 C9 22 7 31 11 38 C13 30 16 23 17 16 Z" />
      <path pathLength={1} d="M20 20 C25 24 27 29 26 34" />
    </svg>
  );
}

/** A loose pen circle, deliberately not closed, to mark the day on the calendar. */
export function HandCircle({ className = "w-14 h-14" }: InkProps) {
  return (
    <svg viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className={`wc-draw ${className}`} aria-hidden="true">
      <path pathLength={1} d="M34 6 C48 7 56 19 54 32 C52 46 38 55 24 52 C10 49 3 36 6 23 C9 12 19 5 31 6 C36 6 40 8 43 10" />
    </svg>
  );
}

/** Pen tick for the reply card; drawn in by `.wc-check` when its button is pressed. */
export function HandCheck({ className = "w-5 h-5" }: InkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`wc-check ${className}`} aria-hidden="true">
      <path pathLength={1} d="M3 13 C6 15 8 18 9.5 21 C12.5 13 16.5 7 22 2.5" />
    </svg>
  );
}
