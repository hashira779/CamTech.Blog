"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type RevealVariant = "up" | "left" | "right" | "zoom";

const VARIANT_CLASS: Record<RevealVariant, string> = {
  up: "",
  left: "dd-reveal-left",
  right: "dd-reveal-right",
  zoom: "dd-reveal-zoom",
};

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  /** Position within a group of siblings; each step adds 70ms so a grid arrives in a wave. */
  index?: number;
  variant?: RevealVariant;
  /** Render as another element - `li` in a list, `article` in a feed. */
  as?: React.ElementType;
  /** Above the fold: skip the observer and show immediately instead of waiting to intersect. */
  immediate?: boolean;
}

/*
 * One controller for every `<Reveal>` on the page. A shared observer is cheaper than one per
 * card, and it keeps the two ways an element can qualify in the same place.
 */

const revealMargin = () => (typeof window === "undefined" ? 0 : window.innerHeight * 0.92);

const pending = new Map<HTMLElement, () => void>();
let shared: IntersectionObserver | null = null;
let frame = 0;

function stopWatching() {
  if (pending.size > 0 || typeof window === "undefined") return;
  window.removeEventListener("scroll", onScroll);
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

function finish(el: HTMLElement) {
  const show = pending.get(el);
  if (!show) return;
  pending.delete(el);
  shared?.unobserve(el);
  show();
  stopWatching();
}

function onScroll() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    for (const el of Array.from(pending.keys())) {
      const rect = el.getBoundingClientRect();
      // Anything at or above the fold, or already scrolled past, is on screen now.
      if (rect.top < revealMargin()) finish(el);
    }
  });
}

/**
 * Reveal content as it scrolls into view.
 *
 * The site already shipped `animate-fade-up` and `.stagger-*`, and nothing used them, so
 * every page still appeared all at once in one flat block. Those keyframes also run on mount,
 * which means a card far down the page finished animating long before the reader got there.
 *
 * Two paths flip `data-revealed`, because one is not enough:
 *
 * 1. The observer handles the normal case — the reader scrolls and a card arrives.
 * 2. The scroll pass is the safety net. IntersectionObserver only reports a *change* of
 *    intersection, so a jump (hash link, restored scroll position, End key) moves a card from
 *    "below, not intersecting" to "above, not intersecting" without crossing a threshold and
 *    delivers nothing. Measured on /travel after one jump: 19 article cards ended up styled
 *    `opacity: 0` above the reader for the rest of the visit. The pass also covers a card
 *    mounted after the jump, which the observer only reports once it re-enters the viewport.
 *
 * Motion is CSS only (`translate` + `opacity`, never `top`/`left`), and the stylesheet clears
 * it under `prefers-reduced-motion`, so the content is simply there for those readers.
 */
export function Reveal({
  index = 0,
  variant = "up",
  as: Tag = "div",
  immediate = false,
  className,
  style,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = React.useState(immediate);

  React.useEffect(() => {
    if (immediate || revealed) return;
    const el = ref.current;
    // No observer (a server render, or a very old browser) must never hide content.
    if (!el || typeof IntersectionObserver === "undefined" || typeof window === "undefined") {
      setRevealed(true);
      return;
    }

    if (!shared) {
      shared = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            if (!pending.has(target)) continue;
            if (entry.isIntersecting || entry.boundingClientRect.top < 0) finish(target);
          }
        },
        // `threshold: 0` on purpose - a wrapper around a long list is taller than the
        // viewport and could never reach a 5% ratio, which would hide it forever.
        { rootMargin: "0px 0px -8% 0px", threshold: 0 }
      );
    }

    pending.set(el, () => setRevealed(true));
    shared.observe(el);
    if (pending.size === 1) window.addEventListener("scroll", onScroll, { passive: true });
    // Cover a jump that happened before this element mounted, and a page loaded already
    // scrolled to a saved position.
    onScroll();

    return () => {
      pending.delete(el);
      shared?.unobserve(el);
      stopWatching();
    };
  }, [immediate, revealed]);

  return (
    <Tag
      ref={ref}
      data-revealed={revealed ? "true" : "false"}
      className={cn("dd-reveal", VARIANT_CLASS[variant], className)}
      style={{ ...style, "--reveal-delay": `${Math.min(index, 8) * 70}ms` } as React.CSSProperties}
      {...props}
    />
  );
}
