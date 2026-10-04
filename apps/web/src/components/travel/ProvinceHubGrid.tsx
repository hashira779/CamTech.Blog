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
import regionData from "@/data/region_categories.json";

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

export function ProvinceHubGrid({ destinations }: ProvinceHubGridProps) {
  const [activeCategory, setActiveCategory] = useState("ALL");

  const filteredDestinations = useMemo(() => {
    if (activeCategory === "ALL") return destinations;
    const cat = REGION_CATEGORIES.find((c) => c.id === activeCategory);
    if (!cat || !cat.slugs || cat.slugs.length === 0) return destinations;
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
                transition-all duration-200 cursor-pointer
                ${
                  isActive
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-xs"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              {cat.id === "ALL" && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white dark:bg-zinc-200 dark:text-zinc-950" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
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
            key={`${activeCategory}-${dest.id || dest.slug}`}
            href={`/travel/${dest.slug}`}
            style={{ animationDelay: `${(i % 9) * 0.05}s` }}
            className="animate-fade-up group relative rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
          >
            {/* Image Header with Aspect Ratio */}
            <div className="relative aspect-[16/10] overflow-hidden bg-zinc-800">
              {dest.hero_image_url ? (
                <img
                  src={dest.hero_image_url}
                  alt={dest.name}
                  loading={i < 6 ? "eager" : "lazy"}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-zinc-600" />
                </div>
              )}
              {/* Subtle gradient vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

              {/* Top Floating Badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-zinc-950/80 backdrop-blur-md text-amber-300 border border-zinc-800 shadow-2xs">
                  {dest.name_km || "កម្ពុជា"}
                </span>
                {dest.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-950/80 text-zinc-200 border border-zinc-700/60 backdrop-blur-xs">
                    <Sparkles className="h-2.5 w-2.5 text-amber-400" /> Featured
                  </span>
                )}
              </div>

              {/* Bottom Image Overlay Title */}
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-xs group-hover:text-zinc-200 transition-colors">
                  {dest.name}
                </h3>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                {dest.overview}
              </p>

              <div className="mt-4 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate max-w-[170px]">
                    {dest.best_time_to_visit || "Year-round"}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-zinc-900 dark:text-zinc-100 group-hover:translate-x-1 transition-transform">
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
