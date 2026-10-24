"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Compass, Landmark, Waves, Mountain, ShieldCheck, ShieldAlert, Search, X, Loader2 } from "lucide-react";
import { Place } from "@/types";
import { API_BASE } from "@/lib/api";
import { CategoryMark } from "@/components/ui/category-mark";
import { humanize } from "@/lib/format";
import travelConfig from "@/data/travel_config.json";
import { ATTRACTION_TAB_KM, PLACE_TYPE_KM, useJourneyCopy } from "@/components/travel/journey/copy";
import { JourneyImage } from "@/components/travel/journey/JourneyImage";
import { AddToTripButton } from "@/components/travel/trip/AddToTripButton";
import { isLargeImage } from "@/lib/travel/image-size";
import { isProvinceStandIn, isVerifiedStatus } from "@/lib/travel/photo";

interface TouristAttractionsGridProps {
  places: Place[];
  /** Total rows the API reported for the base query, for "Showing n of total". */
  total?: number;
  imageWidths?: Record<string, number>;
  destinationSlugById?: Record<string, string>;
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

/** The place types each tab asks the API for — the same groups the old client-side filter used. */
const TAB_TYPES: Record<string, string> = {
  ALL: "ATTRACTION,TEMPLE,WATERFALL,BEACH,NATIONAL_PARK,LAKE",
  TEMPLE: "TEMPLE",
  NATURE: "WATERFALL,NATIONAL_PARK,LAKE",
  BEACH: "BEACH,RESORT",
};

const PAGE = 16;
const ease = [0.16, 1, 0.3, 1] as const;

/** Verified photographs lead; the rest keep their order after them. */
const photoFirst = (list: Place[]) => [...list].sort((a, b) => Number(!a.hero_image_url) - Number(!b.hero_image_url));

function localFilter(places: Place[], tab: string, q: string) {
  const types = TAB_TYPES[tab].split(",");
  const needle = q.trim().toLowerCase();
  return places.filter(
    (p) =>
      types.includes(p.place_type) &&
      (!needle || `${p.name} ${p.local_name ?? ""} ${p.description ?? ""}`.toLowerCase().includes(needle))
  );
}

/** Each photograph drifts a few percent against the scroll inside its frame. */
function ParallaxPhoto({ place, alt, label, sizes }: { place: Place; alt: string; label: string; sizes: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden">
      <motion.div className="absolute inset-[-7%_0]" style={{ y }}>
        <div className="photo-zoom absolute inset-0">
          <JourneyImage src={place.hero_image_url} alt={alt} label={label} sizes={sizes} />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * The landmarks directory.
 *
 * Two honesty fixes beyond the palette. The seeded `rating` / `review_count` columns used to be
 * printed as stars with a "4.90" default when the value was missing — they are not reader feedback,
 * so they are gone. The footer also claimed "Open Daily" and a "$$" price for every card, and only
 * a handful of records carry opening hours at all; a card now states only what its row carries and
 * says so quietly when a field is absent.
 *
 * Category tabs and the search box query the API (`/travel/places?type=&search=`), and "Load
 * more" pages through the same query, so the directory is no longer capped at the first 16 rows.
 * If the API cannot be reached, the grid falls back to filtering what is already loaded and says
 * so. One card leads as a feature — only when its photograph is large enough to fill the slot.
 */
export function TouristAttractionsGrid({ places, total, imageWidths = {}, destinationSlugById = {} }: TouristAttractionsGridProps) {
  const { copy, lang } = useJourneyCopy();
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  // The server-rendered first page is the base; any other tab/search (or a "load more") lives in
  // `result`, keyed by the query it answers so a stale response can never overwrite a newer one.
  const [result, setResult] = useState<{ key: string; items: Place[]; count: number; offline?: boolean } | null>(null);
  const [paging, setPaging] = useState<"idle" | "more" | "error">("idle");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const key = `${activeFilter}|${debounced}`;
  const isBase = key === "ALL|";
  const current = result?.key === key ? result : null;
  const loading = !isBase && !current;
  const baseItems = useMemo(() => photoFirst(places), [places]);
  const items = useMemo(() => (current ? current.items : isBase ? baseItems : result?.items ?? []), [current, isBase, baseItems, result]);
  const count = current ? current.count : isBase ? total ?? places.length : result?.count ?? 0;
  const offline = Boolean(current?.offline);

  const fetchPage = useCallback(async (tab: string, q: string, offset: number) => {
    const params = new URLSearchParams({ type: TAB_TYPES[tab], limit: String(PAGE), offset: String(offset) });
    if (q) params.set("search", q);
    const res = await fetch(`${API_BASE}/travel/places?${params}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as { items: Place[]; total: number };
  }, []);

  // A new tab or search term fetches the first page of the new query.
  useEffect(() => {
    if (isBase) return;
    let cancelled = false;
    const [tab, q] = [activeFilter, debounced];
    fetchPage(tab, q, 0)
      .then((data) => {
        if (!cancelled) setResult({ key: `${tab}|${q}`, items: photoFirst(data.items), count: data.total });
      })
      .catch(() => {
        if (cancelled) return;
        // API unreachable: filter what this page already holds, and say so.
        const fallback = photoFirst(localFilter(places, tab, q));
        setResult({ key: `${tab}|${q}`, items: fallback, count: fallback.length, offline: true });
      });
    return () => {
      cancelled = true;
    };
  }, [isBase, activeFilter, debounced, places, fetchPage]);

  const loadMore = async () => {
    const requestKey = key;
    setPaging("more");
    try {
      const data = await fetchPage(activeFilter, debounced, items.length);
      const seen = new Set(items.map((p) => p.slug));
      setResult({ key: requestKey, items: [...items, ...photoFirst(data.items.filter((p) => !seen.has(p.slug)))], count: data.total });
      setPaging("idle");
    } catch {
      setPaging("error");
    }
  };

  // A feature needs a large photograph of the place itself — never a province cover standing in for it.
  const featuredSlug = useMemo(
    () => items.find((p) => isLargeImage(imageWidths, p.hero_image_url) && !isProvinceStandIn(p.hero_image_url))?.slug,
    [items, imageWidths]
  );
  const typeLabel = (t: string) => (lang === "km" && PLACE_TYPE_KM[t] ? PLACE_TYPE_KM[t] : humanize(t));
  const canLoadMore = !offline && !loading && items.length < count;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-2 overflow-x-auto px-2 py-1">
          <div role="tablist" aria-label={copy.filterAttractions} className="flex w-max items-center gap-2">
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

        <div className="relative w-full lg:w-80" role="search">
          <label htmlFor="tv-attraction-search" className="sr-only">
            {copy.searchAttractions}
          </label>
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            id="tv-attraction-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={copy.searchAttractionsPh}
            autoComplete="off"
            className="min-h-11 w-full rounded-full border border-border bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          {loading ? (
            <Loader2 size={16} aria-hidden="true" className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : (
            query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label={copy.clearSearch}
                className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )
          )}
        </div>
      </div>

      {offline && (
        <p role="status" className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
          {copy.searchFailed}
        </p>
      )}

      <div id="tv-attractions-grid" role="tabpanel" aria-live="polite" aria-busy={loading}>
        {items.length === 0 ? (
          <p className="border-y border-border py-12 text-center text-sm text-muted-foreground">
            {debounced ? copy.noAttractionMatch(debounced) : copy.nothingVerified}
          </p>
        ) : (
          <motion.div layout className={`grid grid-flow-dense grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 ${loading ? "opacity-60" : ""}`}>
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((place, index) => {
                const featured = place.slug === featuredSlug;
                const description = lang === "km" && place.description_km ? place.description_km : place.description;
                const saved = {
                  slug: place.slug,
                  name: place.name,
                  destination_slug: destinationSlugById[place.destination_id] ?? place.destination?.slug ?? null,
                  hero_image_url: place.hero_image_url ?? null,
                };
                return (
                  <motion.article
                    layout
                    key={place.id || place.slug}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                    transition={{ layout: { duration: 0.55, ease }, opacity: { duration: 0.4 }, scale: { duration: 0.5, ease } }}
                    className={`tv-attraction group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card ${
                      featured ? "sm:col-span-2 lg:row-span-2" : ""
                    }`}
                  >
                    <Link
                      href={`/travel/place/${place.slug}`}
                      aria-label={place.name}
                      tabIndex={-1}
                      className={`relative block ${featured ? "aspect-[4/3] lg:aspect-auto lg:min-h-[320px] lg:flex-1" : "aspect-[4/3]"}`}
                    >
                      <motion.div
                        className="absolute inset-0"
                        initial={{ clipPath: "inset(0 0 100% 0)" }}
                        whileInView={{ clipPath: "inset(0 0 0% 0)" }}
                        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                        transition={{ duration: 1, ease, delay: Math.min(index % PAGE, 6) * 0.06 }}
                      >
                        <ParallaxPhoto
                          place={place}
                          alt={place.name}
                          label={copy.photoMissing}
                          sizes={featured ? "(min-width: 1024px) 640px, (min-width: 640px) 100vw, 100vw" : "(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"}
                        />
                      </motion.div>
                      {featured && (
                        <span className="absolute left-4 top-4 rounded-full bg-tv-night/75 px-3 py-1 text-xs font-semibold text-tv-gold-soft backdrop-blur-sm">
                          {copy.featured}
                        </span>
                      )}
                      {isProvinceStandIn(place.hero_image_url) && (
                        <span className="absolute inset-x-2 bottom-2 truncate rounded-md bg-tv-night/75 px-2 py-1 text-[0.68rem] font-medium text-tv-ivory backdrop-blur-sm">
                          {copy.provincePhoto}
                        </span>
                      )}
                    </Link>

                    <div className={`flex flex-1 flex-col gap-2 ${featured ? "p-6 sm:p-7" : "p-5"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <CategoryMark category="travel" tone="dot">
                          {typeLabel(place.place_type)}
                        </CategoryMark>
                        {place.verification_status && (
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            {isVerifiedStatus(place.verification_status) ? (
                              <ShieldCheck size={13} aria-hidden="true" className="text-success" />
                            ) : (
                              <ShieldAlert size={13} aria-hidden="true" className="text-warning" />
                            )}
                            {place.verification_status === "AI_GENERATED"
                              ? copy.aiUnverified
                              : humanize(place.verification_status.toLowerCase())}
                          </span>
                        )}
                      </div>

                      <h3 className={`font-display leading-snug tracking-tight text-foreground ${featured ? "text-2xl sm:text-3xl" : "text-lg"}`}>
                        <Link
                          href={`/travel/place/${place.slug}`}
                          className="line-clamp-2 rounded-sm transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          {place.name}
                        </Link>
                      </h3>

                      {place.local_name && <p className="text-xs text-muted-foreground">{place.local_name}</p>}

                      {description && (
                        <p className={`text-sm leading-relaxed text-muted-foreground ${featured ? "line-clamp-4" : "line-clamp-2"}`}>{description}</p>
                      )}

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border pt-3 text-xs">
                        <span className="min-w-0 max-w-full truncate text-muted-foreground">
                          {place.opening_hours ? place.opening_hours : place.address ? place.address : copy.addressMissing}
                        </span>
                        <span className="flex items-center gap-2">
                          <AddToTripButton place={saved} />
                          <Link
                            href={`/travel/place/${place.slug}`}
                            aria-label={`${copy.view} ${place.name}`}
                            className="inline-flex min-h-6 shrink-0 items-center gap-1 rounded-sm font-semibold text-accent transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            {copy.view}
                            <ArrowRight size={14} aria-hidden="true" className="link-nudge" />
                          </Link>
                        </span>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {copy.showingOf(items.length, count)}
        </p>
        {paging === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {copy.loadFailed}
          </p>
        )}
        {canLoadMore && (
          <button
            type="button"
            onClick={loadMore}
            disabled={paging === "more"}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong bg-card px-6 text-sm font-semibold text-foreground hover:border-foreground/40 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {paging === "more" && <Loader2 size={15} aria-hidden="true" className="animate-spin" />}
            {paging === "more" ? copy.loadingMore : paging === "error" ? copy.retry : copy.loadMore}
          </button>
        )}
      </div>
    </div>
  );
}
