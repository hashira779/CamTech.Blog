"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Destination } from "@/types";
import { useJourneyCopy } from "./copy";
import { JourneyImage } from "./JourneyImage";


/**
 * The hero's featured-province switcher: a row of province tabs and one preview card whose
 * photograph, names, overview and link change together. Data is the real destination rows; the
 * photographs stay card-sized because most of them are ~330px wide.
 */
export function HeroFeatured({ destinations }: { destinations: Destination[] }) {
  const { copy, lang } = useJourneyCopy();
  const [index, setIndex] = React.useState(0);
  const tabsRef = React.useRef<(HTMLButtonElement | null)[]>([]);
  if (destinations.length === 0) return null;
  const active = destinations[Math.min(index, destinations.length - 1)];
  const name = (d: Destination) => (lang === "km" && d.name_km ? d.name_km : d.name);
  const overview = lang === "km" && active.overview_km ? active.overview_km : active.overview;

  // Roving focus across the tabs: arrow keys move, Home/End jump.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const last = destinations.length - 1;
    let next = index;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setIndex(next);
    tabsRef.current[next]?.focus();
  };

  return (
    <div className="tv-featured w-full rounded-2xl p-3">
      <p id="tv-featured-label" className="tv-eyebrow px-1 pb-2 text-tv-gold-soft">
        {copy.featuredLabel}
      </p>
      <div role="tablist" aria-labelledby="tv-featured-label" className="flex gap-1.5" onKeyDown={onKeyDown}>
        {destinations.map((d, i) => (
          <button
            key={d.slug}
            ref={(el) => {
              tabsRef.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tv-featured-tab-${d.slug}`}
            aria-selected={i === index}
            aria-controls="tv-featured-panel"
            tabIndex={i === index ? 0 : -1}
            aria-label={copy.featuredPick(name(d))}
            onClick={() => setIndex(i)}
            className={`relative h-12 flex-1 overflow-hidden rounded-lg ring-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tv-gold-soft ${
              i === index ? "ring-tv-gold-soft" : "opacity-60 ring-tv-ivory/20 hover:opacity-100"
            }`}
          >
            <JourneyImage src={d.hero_image_url} alt="" sizes="72px" label={copy.photoMissing} />
          </button>
        ))}
      </div>

      <div
        id="tv-featured-panel"
        role="tabpanel"
        aria-labelledby={`tv-featured-tab-${active.slug}`}
        className="relative mt-3 overflow-hidden rounded-xl"
      >
          <div key={active.slug} className="tv-swap-in flex gap-3">
            <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-lg bg-tv-ink">
              <JourneyImage src={active.hero_image_url} alt={active.name} sizes="96px" label={copy.photoMissing} />
            </div>
            <div className="min-w-0 py-0.5">
              <p className="font-display text-xl leading-tight text-tv-ivory">{name(active)}</p>
              {lang !== "km" && active.name_km && <p className="text-xs text-tv-ivory/60">{active.name_km}</p>}
              {overview && <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-tv-ivory/75">{overview}</p>}
              <Link href={`/travel/${active.slug}`} className="tv-link-gold group mt-2 inline-flex items-center gap-1 text-xs font-semibold">
                {copy.featuredOpen}
                <ArrowRight size={13} aria-hidden="true" className="link-nudge" />
              </Link>
            </div>
          </div>
      </div>
    </div>
  );
}
