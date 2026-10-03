"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  ArrowRight,
  Sparkles,
  Waves,
  Mountain,
  Landmark,
  Compass,
} from "lucide-react";
import { Destination } from "@/types";

interface ProvinceHubGridProps {
  destinations: Destination[];
}

const REGION_CATEGORIES = [
  { id: "ALL", label: "All Provinces", count: 25, icon: Compass },
  { id: "HERITAGE", label: "Heritage & Temples", icon: Landmark, slugs: ["siem-reap", "battambang", "preah-vihear", "banteay-meanchey", "kampong-thom"] },
  { id: "COASTAL", label: "Coastal & Islands", icon: Waves, slugs: ["sihanoukville", "kampot", "kep", "koh-kong"] },
  { id: "HIGHLANDS", label: "Highlands & Eco", icon: Mountain, slugs: ["mondulkiri", "ratanakiri", "pursat", "pailin", "kampong-speu", "oddar-meanchey"] },
  { id: "MEKONG", label: "Mekong & Central", icon: MapPin, slugs: ["phnom-penh", "kandal", "kampong-cham", "kratie", "stung-treng", "kampong-chhnang", "takeo", "prey-veng", "svay-rieng", "tboung-khmum"] },
];

export function ProvinceHubGrid({ destinations }: ProvinceHubGridProps) {
  const [activeCategory, setActiveCategory] = useState("ALL");

  const filteredDestinations = useMemo(() => {
    if (activeCategory === "ALL") return destinations;
    const cat = REGION_CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat || !cat.slugs) return destinations;
    return destinations.filter((d) => cat.slugs.includes(d.slug));
  }, [destinations, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {REGION_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap
                transition-all duration-300 cursor-pointer
                ${
                  isActive
                    ? "bg-teal-600 text-white shadow-md shadow-teal-600/30 scale-102"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400"
                }
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              {cat.id === "ALL" && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                  {destinations.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3-Column Editorial Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDestinations.map((dest, i) => (
          <Link
            key={dest.id || dest.slug}
            href={`/travel/${dest.slug}`}
            className="group relative rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
          >
            {/* Image Header with Aspect Ratio */}
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
              {dest.hero_image_url ? (
                <img
                  src={dest.hero_image_url}
                  alt={dest.name}
                  loading={i < 6 ? "eager" : "lazy"}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-teal-400/40" />
                </div>
              )}
              {/* Subtle gradient vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

              {/* Top Floating Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-slate-950/70 backdrop-blur-md text-amber-300 border border-amber-400/20 shadow-xs">
                  {dest.name_km || "កម្ពុជា"}
                </span>
                {dest.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/90 text-white backdrop-blur-xs">
                    <Sparkles className="h-2.5 w-2.5" /> Featured
                  </span>
                )}
              </div>

              {/* Bottom Image Overlay Title */}
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-sm group-hover:text-teal-200 transition-colors">
                  {dest.name}
                </h3>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300/90 line-clamp-2 leading-relaxed">
                {dest.overview}
              </p>

              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                  <span className="truncate max-w-[170px]">
                    {dest.best_time_to_visit || "Year-round"}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
                  Explore Hub
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
