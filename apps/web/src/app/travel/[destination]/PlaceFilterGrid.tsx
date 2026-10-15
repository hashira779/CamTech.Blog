"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Hotel, Landmark, Search, Sparkles, ShoppingBag, Utensils, Waves, X } from "lucide-react";
import { Place } from "@/types";
import { Photo } from "@/components/ui/photo";
import { CategoryMark } from "@/components/ui/category-mark";
import { humanize } from "@/lib/format";

interface Props {
  places: Place[];
  destinationSlug: string;
}

const CATEGORY_TABS: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "ALL", label: "All places", icon: Search },
  { id: "TEMPLE", label: "Temples & shrines", icon: Landmark },
  { id: "ACCOMMODATION", label: "Hotels & resorts", icon: Hotel },
  { id: "RESTAURANT", label: "Dining & cafes", icon: Utensils },
  { id: "MARKET", label: "Markets & crafts", icon: ShoppingBag },
  { id: "WATERFALL", label: "Nature & waterfalls", icon: Waves },
  { id: "ACTIVITY", label: "Nightlife & activities", icon: Sparkles },
];

/**
 * The place rail on a destination page.
 *
 * Rebuilt on the shared primitives. Beyond the palette: the seeded `rating` column used to print a
 * star and a number on every tile — it is not reader feedback, so it is gone, along with the
 * invented indigo "hotel" banner that appeared on records with no price data. A card states only
 * what its row actually carries.
 */
export function PlaceFilterGrid({ places, destinationSlug }: Props) {
  const [activeType, setActiveType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredPlaces = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return places.filter((p) => {
      const matchesType = activeType === "ALL" || p.place_type === activeType;
      if (!matchesType) return false;
      if (!term) return true;
      return [p.name, p.local_name, p.description, p.place_type]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [places, activeType, searchTerm]);

  const isFiltered = activeType !== "ALL" || searchTerm.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
        <div className="no-scrollbar -mx-2 overflow-x-auto px-2">
          <div
            role="tablist"
            aria-label="Filter places by type"
            className="flex w-max items-center gap-2"
          >
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveType(tab.id)}
                  className={`inline-flex min-h-8 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    isActive
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative sm:min-w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Filter by name or keyword"
            aria-label="Filter places by name or keyword"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-9 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear keyword filter"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {filteredPlaces.length} of {places.length} places
        {isFiltered ? " match the current filter" : " recorded for this destination"}
      </p>

      {filteredPlaces.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-muted/50 px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {places.length === 0
              ? "No places have been recorded for this destination yet."
              : "Nothing matches that filter."}
          </p>
          {isFiltered && places.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveType("ALL");
                setSearchTerm("");
              }}
              className="mt-3 text-sm font-medium text-accent underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((place) => (
            <article
              key={`${activeType}-${place.id || place.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong"
            >
              <Link href={`/travel/place/${place.slug}`} aria-label={place.name} className="block">
                <Photo
                  src={place.hero_image_url}
                  alt={place.name}
                  ratio="3/2"
                  radius="none"
                  showCredit={false}
                  placeholderLabel="Photo not verified yet"
                />
              </Link>

              <div className="flex flex-1 flex-col gap-2 p-5">
                <CategoryMark category="travel" tone="dot">
                  {humanize(place.place_type)}
                </CategoryMark>

                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg leading-snug tracking-tight text-foreground">
                    <Link
                      href={`/travel/place/${place.slug}`}
                      className="line-clamp-2 transition-colors hover:text-accent"
                    >
                      {place.name}
                    </Link>
                  </h3>
                  {place.local_name && (
                    <span className="shrink-0 text-xs text-muted-foreground">{place.local_name}</span>
                  )}
                </div>

                {place.description && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {place.description}
                  </p>
                )}

                {place.accommodation?.star_rating && (
                  <p className="text-xs text-muted-foreground">
                    {place.accommodation.star_rating}-star{" "}
                    {place.accommodation.property_type
                      ? humanize(String(place.accommodation.property_type).toLowerCase())
                      : "property"}
                    {place.accommodation.price_range ? ` · ${place.accommodation.price_range}` : ""}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {place.address || destinationSlug}
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    {place.price_level && place.price_level !== "FREE" && (
                      <span className="font-medium text-foreground">{place.price_level}</span>
                    )}
                    <Link
                      href={`/travel/place/${place.slug}`}
                      className="inline-flex items-center gap-1 font-semibold text-accent transition-colors hover:text-foreground"
                    >
                      View
                      <ArrowRight
                        size={14}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                      />
                    </Link>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
