"use client";

import * as React from "react";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";

export interface TickerItem {
  id: string;
  title: string;
  href: string;
  /** Section name as the API spells it; only used to pick the hue. */
  section?: string | null;
}

/**
 * The live rail.
 *
 * A moving strip of headlines is the most recognisable thing a news front page can do, and it is
 * also the easiest to get wrong. These are the rules this one follows:
 *
 * - The track holds the same list twice and travels exactly -50%, so the loop has no seam.
 * - Hover, keyboard focus and the button all stop it. Motion you cannot stop is a
 *   WCAG 2.2.2 failure, and on a rail of links it is also just rude.
 * - `prefers-reduced-motion` (globals.css) kills the travel and turns the strip into an ordinary
 *   horizontal scroll, so no headline is only reachable while it happens to be moving past.
 * - The duplicated copy is `aria-hidden`, so a screen reader hears each headline once.
 * - Duration scales with the number of items: five headlines crawl, twenty do not sprint, and
 *   nobody has to chase a link to click it.
 *
 * Nothing is invented here. The caller passes real headlines from the feed; with no items the rail
 * renders nothing at all rather than a placeholder.
 */
export function NewsTicker({
  items,
  label = "Just in",
  className,
}: {
  items: TickerItem[];
  label?: string;
  className?: string;
}) {
  const [paused, setPaused] = React.useState(false);

  if (items.length === 0) return null;

  // ~7s per headline, floored so a short list never looks stuck and capped so a long one stays legible.
  const seconds = Math.min(180, Math.max(34, items.length * 7));

  return (
    <section
      role="region"
      aria-label={label}
      className={cn("border-y border-border bg-surface", className)}
    >
      <Container className="flex items-center gap-3 py-2.5">
        <span className="kicker shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          {label}
        </span>

        <div className="ticker-rail edge-fade min-w-0 flex-1">
          <ul
            className="marquee-track items-center"
            data-paused={paused ? "true" : "false"}
            style={{ "--marquee-duration": `${seconds}s` } as React.CSSProperties}
          >
            {[false, true].map((isDuplicate) => (
              <li
                key={isDuplicate ? "echo" : "live"}
                aria-hidden={isDuplicate || undefined}
                className="flex shrink-0 items-center"
              >
                {items.map((item) => (
                  <Link
                    key={`${isDuplicate ? "echo" : "live"}-${item.id}`}
                    href={item.href}
                    tabIndex={isDuplicate ? -1 : undefined}
                    className="group flex shrink-0 items-center gap-2.5 px-4 py-1 text-sm text-foreground/85 transition-colors hover:text-accent focus-visible:text-accent"
                  >
                    <CategoryMark category={categoryKey(item.section)} tone="dot">
                      {item.section || "News"}
                    </CategoryMark>
                    <span className="title-sweep max-w-[42ch] truncate font-medium leading-snug">
                      {item.title}
                    </span>
                    <span aria-hidden="true" className="text-border-strong">
                      /
                    </span>
                  </Link>
                ))}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setPaused((prev) => !prev)}
          aria-pressed={paused}
          aria-label={paused ? "Pause the headlines rail" : "Play the headlines rail"}
          title={paused ? "Pause headlines" : "Play headlines"}
          className="pressable shrink-0 rounded-md border border-border bg-surface-muted/60 p-1.5 text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
        >
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
        </button>
      </Container>
    </section>
  );
}
