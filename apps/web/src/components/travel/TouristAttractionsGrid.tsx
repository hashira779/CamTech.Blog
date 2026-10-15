"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Compass, Landmark, Waves, Mountain, ShieldCheck } from "lucide-react";
import { Place } from "@/types";
import { Photo } from "@/components/ui/photo";
import { CategoryMark } from "@/components/ui/category-mark";
import { humanize } from "@/lib/format";
import travelConfig from "@/data/travel_config.json";

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

/**
 * The landmarks rail.
 *
 * Two honesty fixes beyond the palette. The seeded `rating` / `review_count` columns used to be
 * printed as stars with a "4.90" default when the value was missing — they are not reader feedback,
 * so they are gone. The footer also claimed "Open Daily" and a "$$" price for every card, and only
 * a handful of records carry opening hours at all; a card now states only what its row carries and
 * says so quietly when a field is absent.
 */
export function TouristAttractionsGrid({ places }: TouristAttractionsGridProps) {
  const [activeFilter, setActiveFilter] = useState("ALL");

  const filteredPlaces = useMemo(() => {
    if (activeFilter === "ALL") return places;
    if (activeFilter === "TEMPLE") {
      return places.filter((p) => p.place_type === "TEMPLE");
    }
    if (activeFilter === "NATURE") {
      return places.filter((p) => ["WATERFALL", "NATIONAL_PARK", "LAKE"].includes(p.place_type));
    }
    if (activeFilter === "BEACH") {
      return places.filter((p) => ["BEACH", "RESORT"].includes(p.place_type));
    }
    return places;
  }, [places, activeFilter]);

  return (
    <div className="space-y-8">
      <div className="no-scrollbar -mx-2 overflow-x-auto px-2">
        <div
          role="tablist"
          aria-label="Filter attractions by type"
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
                onClick={() => setActiveFilter(tab.id)}
                className={`inline-flex min-h-8 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  isActive
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredPlaces.length === 0 ? (
        <p className="border-y border-border py-12 text-center text-sm text-muted-foreground">
          Nothing in this category has been verified yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredPlaces.map((place) => (
            <article
              key={`${activeFilter}-${place.id || place.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong"
            >
              <Link href={`/travel/place/${place.slug}`} aria-label={place.name} className="block">
                <Photo
                  src={place.hero_image_url}
                  alt={place.name}
                  ratio="4/3"
                  radius="none"
                  showCredit={false}
                  placeholderLabel="Photo not verified yet"
                />
              </Link>

              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <CategoryMark category="travel" tone="dot">
                    {humanize(place.place_type)}
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
                    className="line-clamp-2 transition-colors hover:text-accent"
                  >
                    {place.name}
                  </Link>
                </h3>

                {place.local_name && (
                  <p className="text-xs text-muted-foreground">{place.local_name}</p>
                )}

                {place.description && (
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {place.description}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {place.opening_hours
                      ? place.opening_hours
                      : place.address
                        ? place.address
                        : "Address not recorded"}
                  </span>
                  <Link
                    href={`/travel/place/${place.slug}`}
                    className="inline-flex shrink-0 items-center gap-1 font-semibold text-accent transition-colors hover:text-foreground"
                  >
                    View
                    <ArrowRight
                      size={14}
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
