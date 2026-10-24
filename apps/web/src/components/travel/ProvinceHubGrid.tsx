"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ArrowRight,
  Compass,
  Landmark,
  Waves,
  Mountain,
  MapPin,
} from "lucide-react";
import { Destination } from "@/types";
import regionData from "@/data/region_categories.json";
import { getProvinceSymbol } from "@/data/province_symbols";
import { REGION_LABEL_KM, useJourneyCopy } from "@/components/travel/journey/copy";
import { JourneyImage } from "@/components/travel/journey/JourneyImage";
import { MAP_H, MAP_W, landShapes, projectDestinations } from "@/components/travel/journey/geo";

interface ProvinceHubGridProps {
  destinations: Destination[];
}

const REGION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Landmark,
  Waves,
  Mountain,
  MapPin,
};

interface RegionCategory {
  id: string;
  label: string;
  count?: number;
  icon: React.ComponentType<{ className?: string }>;
  slugs: string[];
}

const REGION_CATEGORIES: RegionCategory[] = regionData.region_categories.map((c) => ({
  ...c,
  icon: REGION_ICONS[c.icon] || Compass,
  slugs: c.slugs as string[],
}));

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * The 25-province directory.
 *
 * Photography leads and the paper carries the type, exactly like the feature card on the front
 * page. A province whose photograph has not been verified gets the same honest "Photo not verified
 * yet" tile the places use — never a picture of Angkor Wat standing in for Battambang. `best_time`
 * and the provincial symbol render only when the record actually carries them.
 *
 * Beside the cards sits a marker map: every province with recorded coordinates is a link on a
 * stylised plane (see `journey/geo.ts` — the land shape is decorative), the region filter dims
 * the markers outside it, and hovering or focusing a card lights its marker and the reverse.
 */
export function ProvinceHubGrid({ destinations }: ProvinceHubGridProps) {
  const { copy, lang, num } = useJourneyCopy();
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [highlight, setHighlight] = useState<string | null>(null);

  const filteredDestinations = useMemo(() => {
    if (activeCategory === "ALL") return destinations;
    const cat = REGION_CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat || !cat.slugs || cat.slugs.length === 0) return destinations;
    return destinations.filter((d) => cat.slugs.includes(d.slug));
  }, [destinations, activeCategory]);

  const inView = useMemo(() => new Set(filteredDestinations.map((d) => d.slug)), [filteredDestinations]);
  const projected = useMemo(() => projectDestinations(destinations), [destinations]);
  const points = useMemo(() => Array.from(projected.values()), [projected]);
  const { land, contours } = useMemo(() => landShapes(points, 70, 5), [points]);
  const name = (d: Destination) => (lang === "km" && d.name_km ? d.name_km : d.name);

  return (
    <div className="space-y-8">
      {/* Region filter — hairline chips on paper, one accent state */}
      <div className="no-scrollbar -mx-2 overflow-x-auto px-2 py-1">
        <div
          role="tablist"
          aria-label={copy.filterProvinces}
          className="flex w-max items-center gap-2"
        >
          {REGION_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls="tv-province-grid"
                onClick={() => setActiveCategory(cat.id)}
                className={`relative inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  isActive
                    ? "border-transparent text-tv-ivory"
                    : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="tv-region-tab"
                    className="absolute inset-0 rounded-full bg-tv-jungle"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative h-3.5 w-3.5" />
                <span className="relative">{lang === "km" ? REGION_LABEL_KM[cat.id] ?? cat.label : cat.label}</span>
                {cat.id === "ALL" && (
                  <span
                    className={`relative rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                      isActive ? "bg-tv-ivory/15 text-tv-ivory" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {num(destinations.length)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* ── Marker map ─────────────────────────────────────────────────── */}
        {points.length > 2 && (
          <div className="lg:col-span-5">
            <div className="tv-province-map lg:sticky lg:top-24">
              <div className="relative w-full" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
                <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
                  <path d={land} className="tv-pm-land" />
                  {contours.map((c, i) => (
                    <path key={i} d={c} className="tv-pm-contour" style={{ opacity: 0.35 + i * 0.1 }} />
                  ))}
                </svg>
                <nav aria-label={copy.provinceMapLabel} className="absolute inset-0">
                  <ul>
                    {destinations.map((d) => {
                      const p = projected.get(d.slug);
                      if (!p) return null;
                      const dim = !inView.has(d.slug);
                      const lit = highlight === d.slug;
                      return (
                        <li
                          key={d.slug}
                          className="absolute"
                          style={{ left: `${(p.x / MAP_W) * 100}%`, top: `${(p.y / MAP_H) * 100}%` }}
                        >
                          <Link
                            href={`/travel/${d.slug}`}
                            aria-label={name(d)}
                            data-dim={dim ? "true" : "false"}
                            data-lit={lit ? "true" : "false"}
                            onMouseEnter={() => setHighlight(d.slug)}
                            onMouseLeave={() => setHighlight(null)}
                            onFocus={() => setHighlight(d.slug)}
                            onBlur={() => setHighlight(null)}
                            className="tv-pm-marker"
                          >
                            <span className="tv-pm-dot" aria-hidden="true" />
                            <span className="tv-pm-label">{name(d)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span className="tabular-nums">{copy.inRegion(filteredDestinations.length)}</span>
                <span className="max-w-[70%] text-right leading-snug">{copy.mapNote}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Cards ──────────────────────────────────────────────────────── */}
        <div id="tv-province-grid" role="tabpanel" aria-live="polite" className={points.length > 2 ? "lg:col-span-7" : "lg:col-span-12"}>
          {filteredDestinations.length === 0 ? (
            <p className="border-y border-border py-12 text-center text-sm text-muted-foreground">
              {copy.noProvince}
            </p>
          ) : (
            <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredDestinations.map((dest, index) => {
                  const symbol = getProvinceSymbol(dest.slug, dest);
                  const overview = lang === "km" && dest.overview_km ? dest.overview_km : dest.overview;
                  const symbolName = lang === "km" ? symbol.symbolNameKm : symbol.symbolName;
                  return (
                    <motion.article
                      layout
                      key={dest.id || dest.slug}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "0px 0px -6% 0px" }}
                      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
                      transition={{ layout: { duration: 0.5, ease }, duration: 0.6, ease, delay: Math.min(index % 6, 5) * 0.05 }}
                      onMouseEnter={() => setHighlight(dest.slug)}
                      onMouseLeave={() => setHighlight(null)}
                      onFocusCapture={() => setHighlight(dest.slug)}
                      onBlurCapture={() => setHighlight(null)}
                      className="tv-attraction group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card"
                    >
                      <Link href={`/travel/${dest.slug}`} aria-label={dest.name} tabIndex={-1} className="relative block aspect-[16/9] overflow-hidden">
                        <div className="photo-zoom absolute inset-0">
                          <JourneyImage
                            src={dest.hero_image_url}
                            alt={dest.name}
                            label={copy.photoMissing}
                            sizes="(min-width: 1024px) 340px, (min-width: 640px) 50vw, 100vw"
                          />
                        </div>
                      </Link>

                      <div className="flex flex-1 flex-col gap-2.5 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-display text-xl leading-snug tracking-tight text-foreground">
                            <Link
                              href={`/travel/${dest.slug}`}
                              className="rounded-sm transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                              {name(dest)}
                            </Link>
                          </h3>
                          {dest.name_km && lang !== "km" && (
                            <span className="shrink-0 pt-1 text-xs text-muted-foreground">
                              {dest.name_km}
                            </span>
                          )}
                        </div>

                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {overview}
                        </p>

                        {symbol.symbolName && (
                          <p className="mt-auto flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                            <span aria-hidden="true">{symbol.emoji}</span>
                            <span className="truncate">{symbolName}</span>
                          </p>
                        )}

                        <div className="flex items-center justify-between gap-3 text-xs">
                          {dest.best_time_to_visit ? (
                            <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                              <Calendar size={13} aria-hidden="true" className="shrink-0" />
                              <span className="truncate">{dest.best_time_to_visit}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/70">{copy.bestTimeMissing}</span>
                          )}

                          <Link
                            href={`/travel/${dest.slug}`}
                            aria-label={`${copy.exploreHub}: ${dest.name}`}
                            className="inline-flex shrink-0 items-center gap-1 rounded-sm font-semibold text-accent transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            {copy.exploreHub}
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
    </div>
  );
}
