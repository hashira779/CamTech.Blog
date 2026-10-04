"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Star,
  ArrowRight,
  Sparkles,
  Compass,
  Landmark,
  Waves,
  Mountain,
  ShieldCheck,
} from "lucide-react";
import { Place } from "@/types";
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

export function TouristAttractionsGrid({ places }: TouristAttractionsGridProps) {
  const [activeFilter, setActiveFilter] = useState("ALL");

  const filteredPlaces = useMemo(() => {
    if (activeFilter === "ALL") return places;
    if (activeFilter === "TEMPLE") {
      return places.filter((p) => p.place_type === "TEMPLE");
    }
    if (activeFilter === "NATURE") {
      return places.filter((p) =>
        ["WATERFALL", "NATIONAL_PARK", "LAKE"].includes(p.place_type)
      );
    }
    if (activeFilter === "BEACH") {
      return places.filter((p) =>
        ["BEACH", "RESORT"].includes(p.place_type)
      );
    }
    return places;
  }, [places, activeFilter]);

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {FILTER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap
                transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Responsive Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filteredPlaces.map((place, i) => (
          <Link
            key={`${activeFilter}-${place.id || place.slug}`}
            href={`/travel/place/${place.slug}`}
            style={{ animationDelay: `${(i % 8) * 0.05}s` }}
            className="animate-fade-up group rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
          >
            {/* Visual Aspect Ratio */}
            <div className="relative aspect-[4/3] overflow-hidden bg-zinc-800">
              {place.hero_image_url ? (
                <img
                  src={place.hero_image_url}
                  alt={place.name}
                  loading={i < 4 ? "eager" : "lazy"}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <Landmark className="h-8 w-8 text-zinc-600" />
                </div>
              )}

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-70" />

              {/* Floating Badges */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-950/80 backdrop-blur-md text-zinc-200 border border-zinc-700/60">
                  {place.place_type}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-950/80 backdrop-blur-md text-zinc-300 border border-zinc-700/60">
                  <ShieldCheck className="h-3 w-3 text-zinc-300" /> Verified
                </span>
              </div>

              {/* Destination Pill at Bottom Left */}
              <div className="absolute bottom-2.5 left-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-200 drop-shadow-xs">
                  <MapPin className="h-3 w-3 text-zinc-400" />
                  {place.destination?.name || "Cambodia"}
                </span>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <div>
                {/* Rating & Review */}
                <div className="flex items-center gap-1.5 text-xs text-amber-500 mb-1.5">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {place.rating ? place.rating.toFixed(2) : "4.90"}
                  </span>
                  {place.review_count && (
                    <span className="text-[11px] text-zinc-400">
                      ({place.review_count.toLocaleString()})
                    </span>
                  )}
                </div>

                {/* Place Name */}
                <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-snug group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-1">
                  {place.name}
                </h3>
                {place.local_name && (
                  <p className="text-xs text-zinc-500 font-khmer mt-0.5 line-clamp-1">
                    {place.local_name}
                  </p>
                )}

                {/* Description */}
                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-2 leading-relaxed">
                  {place.description}
                </p>
              </div>

              {/* Footer Action */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-400 text-[11px]">
                  {place.price_level || "$$"} · Open Daily
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  View Place
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
