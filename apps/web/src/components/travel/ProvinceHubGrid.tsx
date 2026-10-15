"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
import { Reveal } from "@/components/ui/reveal";
import { Photo } from "@/components/ui/photo";
import regionData from "@/data/region_categories.json";
import { getProvinceSymbol } from "@/data/province_symbols";

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

/**
 * The 25-province directory.
 *
 * Photography leads and the paper carries the type, exactly like the feature card on the front
 * page. A province whose photograph has not been verified gets the same honest "Photo not verified
 * yet" tile the places use — never a picture of Angkor Wat standing in for Battambang. `best_time`
 * and the provincial symbol render only when the record actually carries them.
 */
export function ProvinceHubGrid({ destinations }: ProvinceHubGridProps) {
  const [activeCategory, setActiveCategory] = useState("ALL");

  const filteredDestinations = useMemo(() => {
    if (activeCategory === "ALL") return destinations;
    const cat = REGION_CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat || !cat.slugs || cat.slugs.length === 0) return destinations;
    return destinations.filter((d) => cat.slugs.includes(d.slug));
  }, [destinations, activeCategory]);

  return (
    <div className="space-y-8">
      {/* Region filter — hairline chips on paper, one accent state */}
      <div className="no-scrollbar -mx-2 overflow-x-auto px-2">
        <div
          role="tablist"
          aria-label="Filter provinces by region"
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
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex min-h-8 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  isActive
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
                {cat.id === "ALL" && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                      isActive
                        ? "bg-primary-foreground/15 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {destinations.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {filteredDestinations.length === 0 ? (
        <p className="border-y border-border py-12 text-center text-sm text-muted-foreground">
          No province is listed under this region yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDestinations.map((dest, index) => {
            const symbol = getProvinceSymbol(dest.slug, dest);
            return (
              <Reveal
                as="article"
                key={`${activeCategory}-${dest.id || dest.slug}`}
                index={index}
                className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong"
              >
                <Link href={`/travel/${dest.slug}`} aria-label={dest.name} className="block">
                  <Photo zoom
                    src={dest.hero_image_url}
                    alt={dest.name}
                    ratio="3/2"
                    radius="none"
                    showCredit={false}
                    placeholderLabel="Photo not verified yet"
                  />
                </Link>

                <div className="flex flex-1 flex-col gap-2.5 p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl leading-snug tracking-tight text-foreground">
                      <Link
                        href={`/travel/${dest.slug}`}
                        className="transition-colors hover:text-accent"
                      >
                        {dest.name}
                      </Link>
                    </h3>
                    {dest.name_km && (
                      <span className="shrink-0 pt-1 text-xs text-muted-foreground">
                        {dest.name_km}
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {dest.overview}
                  </p>

                  {symbol.symbolName && (
                    <p className="mt-auto flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                      <span aria-hidden="true">{symbol.emoji}</span>
                      <span className="truncate">{symbol.symbolName}</span>
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3 text-xs">
                    {dest.best_time_to_visit ? (
                      <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
                        <Calendar size={13} aria-hidden="true" className="shrink-0" />
                        <span className="truncate">{dest.best_time_to_visit}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground/70">Best time not recorded</span>
                    )}

                    <Link
                      href={`/travel/${dest.slug}`}
                      className="inline-flex shrink-0 items-center gap-1 font-semibold text-accent transition-colors hover:text-foreground"
                    >
                      Explore hub
                      <ArrowRight
                        size={14}
                        aria-hidden="true"
                        className="link-nudge"
                      />
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
