"use client";

import React, { useState, useMemo, useDeferredValue } from "react";
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
  Navigation,
  Search,
  X,
} from "lucide-react";
import { Destination } from "@/types";
import regionData from "@/data/region_categories.json";
import { getProvinceSymbol } from "@/data/province_symbols";
import { REGION_LABEL_KM, useJourneyCopy } from "@/components/travel/journey/copy";
import { JourneyImage } from "@/components/travel/journey/JourneyImage";
import { isLargeImage } from "@/lib/travel/image-size";

interface ProvinceHubGridProps {
  destinations: Destination[];
  /** Pixel widths of local hero images, so only large photographs get large tiles. */
  imageWidths?: Record<string, number>;
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

const regionOf = (slug: string) => REGION_CATEGORIES.find((c) => c.id !== "ALL" && c.slugs.includes(slug));

const ease = [0.16, 1, 0.3, 1] as const;
const INITIAL = 9;

/**
 * Explore Cambodia — the 25-province directory as an editorial spread.
 *
 * Photography leads and the paper carries the type. A province whose photograph has not been
 * verified gets the same honest "Photo not verified yet" tile the places use — never a picture of
 * Angkor Wat standing in for Battambang. `best_time` and the provincial symbol render only when
 * the record carries them.
 *
 * The spread mixes two tile kinds: an image-led feature (photo full-bleed, type over it) and the
 * paper card. Feature tiles go only to provinces whose photograph is actually large — measured
 * from the file, not assumed — because most directory photos are ~330px wide and would blur.
 * Region chips and the search box really narrow the list; search matches English and Khmer names.
 */
export function ProvinceHubGrid({ destinations, imageWidths = {} }: ProvinceHubGridProps) {
  const { copy, lang, num } = useJourneyCopy();
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const filteredDestinations = useMemo(() => {
    let list = destinations;
    if (activeCategory !== "ALL") {
      const cat = REGION_CATEGORIES.find((c) => c.id === activeCategory);
      if (cat && cat.slugs.length > 0) list = list.filter((d) => cat.slugs.includes(d.slug));
    }
    const q = deferredQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) => d.name.toLowerCase().includes(q) || d.slug.includes(q) || (d.name_km ?? "").includes(deferredQuery.trim())
      );
    }
    return list;
  }, [destinations, activeCategory, deferredQuery]);

  const filtering = activeCategory !== "ALL" || deferredQuery.trim() !== "";
  const visible = expanded || filtering ? filteredDestinations : filteredDestinations.slice(0, INITIAL);
  const name = (d: Destination) => (lang === "km" && d.name_km ? d.name_km : d.name);
  const regionLabel = (c: RegionCategory) => (lang === "km" ? REGION_LABEL_KM[c.id] ?? c.label : c.label);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Region filter */}
        <div className="no-scrollbar -mx-2 overflow-x-auto px-2 py-1">
          <div role="tablist" aria-label={copy.filterProvinces} className="flex w-max items-center gap-2">
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
                  <span className="relative">{regionLabel(cat)}</span>
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

        {/* Search */}
        <div className="relative w-full lg:w-80" role="search">
          <label htmlFor="tv-province-search" className="sr-only">
            {copy.searchProvinces}
          </label>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            id="tv-province-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.searchProvincesPh}
            autoComplete="off"
            className="min-h-11 w-full rounded-full border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={copy.clearSearch}
              className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div id="tv-province-grid" role="tabpanel" aria-live="polite">
        {filteredDestinations.length === 0 ? (
          <div className="border-y border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">{deferredQuery.trim() ? copy.noSearchMatch(deferredQuery.trim()) : copy.noProvince}</p>
            {(deferredQuery || activeCategory !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("ALL");
                }}
                className="mt-3 text-sm font-semibold text-accent hover:text-foreground"
              >
                {copy.showAll}
              </button>
            )}
          </div>
        ) : (
          <motion.div layout className="grid grid-flow-dense grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {visible.map((dest, index) => {
                const symbol = getProvinceSymbol(dest.slug, dest);
                const overview = lang === "km" && dest.overview_km ? dest.overview_km : dest.overview;
                const symbolName = lang === "km" ? symbol.symbolNameKm : symbol.symbolName;
                const region = regionOf(dest.slug);
                const feature = isLargeImage(imageWidths, dest.hero_image_url);
                return (
                  <motion.article
                    layout
                    key={dest.id || dest.slug}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
                    transition={{ layout: { duration: 0.5, ease }, duration: 0.5, ease, delay: Math.min(index % 6, 5) * 0.04 }}
                    className={
                      feature
                        ? "tv-feature group relative overflow-hidden rounded-2xl sm:col-span-2 lg:row-span-2"
                        : "tv-attraction group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card"
                    }
                  >
                    {feature ? (
                      <>
                        <div className="photo-zoom absolute inset-0">
                          <JourneyImage src={dest.hero_image_url} alt={dest.name} sizes="(min-width: 1024px) 820px, 100vw" label={copy.photoMissing} />
                        </div>
                        <div aria-hidden="true" className="tv-feature-shade absolute inset-0" />
                        <div className="relative flex h-full min-h-[420px] flex-col justify-end gap-3 p-6 text-tv-ivory sm:p-8 lg:min-h-[560px]">
                          {region && <p className="tv-eyebrow text-tv-gold-soft">{regionLabel(region)}</p>}
                          <h3 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
                            <Link href={`/travel/${dest.slug}`} className="rounded-sm after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tv-gold-soft">
                              {name(dest)}
                            </Link>
                          </h3>
                          {lang !== "km" && dest.name_km && <p className="text-sm text-tv-ivory/70">{dest.name_km}</p>}
                          {overview && <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-tv-ivory/85">{overview}</p>}
                          <div className="relative z-10 mt-1 flex flex-wrap items-center gap-2">
                            <Link href={`/travel/${dest.slug}`} className="tv-btn tv-btn-gold group/b">
                              {copy.exploreHub}
                              <ArrowRight size={15} aria-hidden="true" className="transition-transform group-hover/b:translate-x-0.5" />
                            </Link>
                            <Link href={`/travel/planner?destination=${dest.slug}`} className="tv-btn tv-btn-ghost">
                              <Navigation size={14} aria-hidden="true" />
                              {copy.planHere}
                            </Link>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <Link href={`/travel/${dest.slug}`} aria-label={dest.name} tabIndex={-1} className="relative block aspect-[16/10] overflow-hidden">
                          <div className="photo-zoom absolute inset-0">
                            <JourneyImage src={dest.hero_image_url} alt={dest.name} label={copy.photoMissing} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" />
                          </div>
                        </Link>

                        <div className="flex flex-1 flex-col gap-2.5 p-5">
                          {region && <p className="tv-eyebrow text-category-travel">{regionLabel(region)}</p>}
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-display text-xl leading-snug tracking-tight text-foreground">
                              <Link
                                href={`/travel/${dest.slug}`}
                                className="rounded-sm transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                              >
                                {name(dest)}
                              </Link>
                            </h3>
                            {dest.name_km && lang !== "km" && <span className="shrink-0 pt-1 text-xs text-muted-foreground">{dest.name_km}</span>}
                          </div>

                          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{overview}</p>

                          {symbol.symbolName && (
                            <p className="mt-auto flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                              <span aria-hidden="true">{symbol.emoji}</span>
                              <span className="truncate">{symbolName}</span>
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs">
                            {dest.best_time_to_visit ? (
                              <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                                <Calendar size={13} aria-hidden="true" className="shrink-0" />
                                <span className="truncate">{dest.best_time_to_visit}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground/70">{copy.bestTimeMissing}</span>
                            )}
                            <span className="flex items-center gap-3">
                              <Link
                                href={`/travel/planner?destination=${dest.slug}`}
                                className="inline-flex min-h-6 shrink-0 items-center gap-1 rounded-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                              >
                                <Navigation size={12} aria-hidden="true" />
                                {copy.planHere}
                              </Link>
                              <Link
                                href={`/travel/${dest.slug}`}
                                aria-label={`${copy.exploreHub}: ${dest.name}`}
                                className="inline-flex min-h-6 shrink-0 items-center gap-1 rounded-sm font-semibold text-accent transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                              >
                                {copy.exploreHub}
                                <ArrowRight size={14} aria-hidden="true" className="link-nudge" />
                              </Link>
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {!filtering && filteredDestinations.length > INITIAL && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls="tv-province-grid"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong bg-card px-6 text-sm font-semibold text-foreground hover:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {expanded ? copy.showFewer : `${copy.showAll} (${num(filteredDestinations.length)})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
