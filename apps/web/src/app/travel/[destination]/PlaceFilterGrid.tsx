"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Place } from "@/types";
import {
  Star,
  ShieldCheck,
  Search,
  MapPin,
  Clock,
  Landmark,
  Hotel,
  Utensils,
  ShoppingBag,
  Waves,
  Sparkles
} from "lucide-react";

interface Props {
  places: Place[];
  destinationSlug: string;
}

const CATEGORY_TABS = [
  { id: "ALL", label: "All Places" },
  { id: "TEMPLE", label: "Temples & Shrines", icon: Landmark },
  { id: "ACCOMMODATION", label: "Hotels & Resorts", icon: Hotel },
  { id: "RESTAURANT", label: "Dining & Cafes", icon: Utensils },
  { id: "MARKET", label: "Markets & Crafts", icon: ShoppingBag },
  { id: "WATERFALL", label: "Nature & Waterfalls", icon: Waves },
  { id: "ACTIVITY", label: "Nightlife & Activities", icon: Sparkles },
];

export function PlaceFilterGrid({ places, destinationSlug }: Props) {
  const [activeType, setActiveType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredPlaces = places.filter((p) => {
    const matchesType = activeType === "ALL" || p.place_type === activeType;
    const matchesSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.local_name && p.local_name.includes(searchTerm)) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Category Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveType(tab.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? "bg-rose-600 text-white shadow-sm shadow-rose-600/30"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Filter by name or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500 text-neutral-900 dark:text-white"
          />
        </div>
      </div>

      {/* Grid */}
      {filteredPlaces.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
            No places matched your filter.
          </p>
          <button
            onClick={() => {
              setActiveType("ALL");
              setSearchTerm("");
            }}
            className="mt-3 text-xs font-bold text-rose-600 hover:underline"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => {
            const isHotel = place.place_type === "ACCOMMODATION";
            const hotel = place.accommodation;

            return (
              <Link
                key={place.id}
                href={`/travel/place/${place.slug}`}
                className="group flex flex-col bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={place.hero_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                    {place.place_type}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-bold text-neutral-900 dark:text-white flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {place.rating.toFixed(1)}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors line-clamp-1">
                        {place.name}
                      </h3>
                      {place.local_name && (
                        <span className="text-xs font-semibold text-neutral-400 shrink-0">
                          {place.local_name}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-2 leading-relaxed">
                      {place.description}
                    </p>

                    {/* Hotel specific badge */}
                    {isHotel && hotel && (
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/60">
                        <span>{hotel.star_rating}★ {hotel.property_type}</span>
                        <span>•</span>
                        <span>{hotel.price_range}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1 truncate max-w-[60%]">
                      <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
                      <span className="truncate">{place.address || destinationSlug}</span>
                    </span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                      {place.price_level}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
