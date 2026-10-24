"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Compass, Landmark, Waves, Mountain, ShieldCheck } from "lucide-react";
import { Place } from "@/types";
import { CategoryMark } from "@/components/ui/category-mark";
import { humanize } from "@/lib/format";
import travelConfig from "@/data/travel_config.json";
import { ATTRACTION_TAB_KM, PLACE_TYPE_KM, useJourneyCopy } from "@/components/travel/journey/copy";
import { JourneyImage } from "@/components/travel/journey/JourneyImage";

interface TouristAttractionsGridProps {
  places: Place[];
}

const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Landmark,
  Mountain,
  Waves,
};

const FILTER_TABS = travelConfig.attraction_filter_tabs.map((tab) => ({
  ...tab,
  icon: TAB_ICONS[tab.icon] || Compass,
}));

const ease = [0.16, 1, 0.3, 1] as const;

/** Each photograph drifts a few percent against the scroll inside its frame. */
function ParallaxPhoto({ place, alt, label }: { place: Place; alt: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  return (
    <div ref={ref} className="tv-reveal-mask relative h-full w-full overflow-hidden">
      <motion.div className="absolute inset-[-7%_0]" style={{ y }}>
        <div className="photo-zoom absolute inset-0">
          <JourneyImage
            src={place.hero_image_url}
            alt={alt}
            label={label}
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
          />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * The landmarks rail.
 *
 * Two honesty fixes beyond the palette. The seeded `rating` / `review_count` columns used to be
 * printed as stars with a "4.90" default when the value was missing — they are not reader feedback,
 * so they are gone. The footer also claimed "Open Daily" and a "$$" price for every card, and only
 * a handful of records carry opening hours at all; a card now states only what its row carries and
 * says so quietly when a field is absent.
 *
 * The journey redesign keeps the same rows, filters and links, and changes how they arrive:
 * photographs wipe in as they enter the viewport and drift slightly inside their frames, and
 * changing the filter re-flows the cards that stay instead of re-mounting the grid — cards are
 * keyed by place, not by filter, so layout animation can carry them to their new cells. There is
 * deliberately no oversized lead card: most directory photographs are ~330px wide and would
 * blur at double size.
 */
export function TouristAttractionsGrid({ places }: TouristAttractionsGridProps) {
  const { copy, lang } = useJourneyCopy();
  const [activeFilter, setActiveFilter] = useState("ALL");

  const filteredPlaces = useMemo(() => {
    let list = places;
    if (activeFilter === "TEMPLE") {
      list = places.filter((p) => p.place_type === "TEMPLE");
    } else if (activeFilter === "NATURE") {
      list = places.filter((p) => ["WATERFALL", "NATIONAL_PARK", "LAKE"].includes(p.place_type));
    } else if (activeFilter === "BEACH") {
      list = places.filter((p) => ["BEACH", "RESORT"].includes(p.place_type));
    }
    // Places with a verified photo lead; the rest keep their order after them, so
    // the grid no longer opens on a run of grey "not verified" tiles.
    return [...list].sort((a, b) => Number(!a.hero_image_url) - Number(!b.hero_image_url));
  }, [places, activeFilter]);

  const typeLabel = (t: string) => (lang === "km" && PLACE_TYPE_KM[t] ? PLACE_TYPE_KM[t] : humanize(t));

  return (
    <div className="space-y-8">
      <div className="no-scrollbar -mx-2 overflow-x-auto px-2 py-1">
        <div
          role="tablist"
          aria-label={copy.filterAttractions}
          className="flex w-max items-center gap-2"
        >
          {FILTER_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="tv-attractions-grid"
                onClick={() => setActiveFilter(tab.id)}
                className={`relative inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  isActive
                    ? "border-transparent text-tv-ivory"
                    : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="tv-attraction-tab"
                    className="absolute inset-0 rounded-full bg-tv-jungle"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative h-3.5 w-3.5" />
                <span className="relative">{lang === "km" ? ATTRACTION_TAB_KM[tab.id] ?? tab.label : tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div id="tv-attractions-grid" role="tabpanel" aria-live="polite">
        {filteredPlaces.length === 0 ? (
          <p className="border-y border-border py-12 text-center text-sm text-muted-foreground">
            {copy.nothingVerified}
          </p>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredPlaces.map((place, index) => {
                const description = lang === "km" && place.description_km ? place.description_km : place.description;
                return (
                  <motion.article
                    layout
                    key={place.id || place.slug}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                    transition={{ layout: { duration: 0.55, ease }, opacity: { duration: 0.4 }, scale: { duration: 0.5, ease } }}
                    className="tv-attraction group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card"
                  >
                    <Link
                      href={`/travel/place/${place.slug}`}
                      aria-label={place.name}
                      tabIndex={-1}
                      className="relative block aspect-[4/3]"
                    >
                      <motion.div
                        className="absolute inset-0"
                        initial={{ clipPath: "inset(0 0 100% 0)" }}
                        whileInView={{ clipPath: "inset(0 0 0% 0)" }}
                        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                        transition={{ duration: 1, ease, delay: Math.min(index, 6) * 0.06 }}
                      >
                        <ParallaxPhoto place={place} alt={place.name} label={copy.photoMissing} />
                      </motion.div>
                    </Link>

                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <div className="flex items-center justify-between gap-2">
                        <CategoryMark category="travel" tone="dot">
                          {typeLabel(place.place_type)}
                        </CategoryMark>
                        {place.verification_status && (
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            <ShieldCheck size={13} aria-hidden="true" className="text-success" />
                            {humanize(place.verification_status.toLowerCase())}
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-lg leading-snug tracking-tight text-foreground">
                        <Link
                          href={`/travel/place/${place.slug}`}
                          className="line-clamp-2 rounded-sm transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {place.name}
                        </Link>
                      </h3>

                      {place.local_name && (
                        <p className="text-xs text-muted-foreground">{place.local_name}</p>
                      )}

                      {description && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                        <span className="min-w-0 truncate text-muted-foreground">
                          {place.opening_hours
                            ? place.opening_hours
                            : place.address
                              ? place.address
                              : copy.addressMissing}
                        </span>
                        <Link
                          href={`/travel/place/${place.slug}`}
                          aria-label={`${copy.view} ${place.name}`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-sm font-semibold text-accent transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {copy.view}
                          <ArrowRight size={14} aria-hidden="true" className="link-nudge" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
