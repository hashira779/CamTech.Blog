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

interface TouristAttractionsGridProps {
  places: Place[];
}

const FILTER_TABS = [
  { id: "ALL", label: "All Attractions", icon: Compass },
  { id: "TEMPLE", label: "Ancient Temples", icon: Landmark },
  { id: "NATURE", label: "Waterfalls & Nature", icon: Mountain },
  { id: "BEACH", label: "Beaches & Coastal", icon: Waves },
];

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
                transition-all duration-300 cursor-pointer
                ${
                  isActive
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 scale-102"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400"
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
            key={place.id || place.slug}
            href={`/travel/place/${place.slug}`}
            className="group rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
          >
            {/* Visual Aspect Ratio */}
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
              {place.hero_image_url ? (
                <img
                  src={place.hero_image_url}
                  alt={place.name}
                  loading={i < 4 ? "eager" : "lazy"}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <Landmark className="h-8 w-8 text-amber-400/40" />
                </div>
              )}

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-70" />

              {/* Floating Badges */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 backdrop-blur-md text-amber-400 border border-amber-400/30">
                  {place.place_type}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 text-white backdrop-blur-xs">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              </div>

              {/* Destination Pill at Bottom Left */}
              <div className="absolute bottom-2.5 left-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-200 drop-shadow-sm">
                  <MapPin className="h-3 w-3 text-amber-400" />
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
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {place.rating ? place.rating.toFixed(2) : "4.90"}
                  </span>
                  {place.review_count && (
                    <span className="text-[11px] text-slate-400">
                      ({place.review_count.toLocaleString()})
                    </span>
                  )}
                </div>

                {/* Place Name */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-amber-500 transition-colors line-clamp-1">
                  {place.name}
                </h3>
                {place.local_name && (
                  <p className="text-xs text-amber-600/90 dark:text-amber-400 font-khmer mt-0.5 line-clamp-1">
                    {place.local_name}
                  </p>
                )}

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                  {place.description}
                </p>
              </div>

              {/* Footer Action */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  {place.price_level || "$$"} · Open Daily
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
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
