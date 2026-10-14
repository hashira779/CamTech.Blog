"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { Crosshair, MapPin, ExternalLink } from "lucide-react";

export interface MapPlacePoint {
  slug: string;
  name: string;
  place_type: string;
  latitude: number;
  longitude: number;
}

interface ProvinceMapProps {
  places: MapPlacePoint[];
  destinationName: string;
  totalPlaces: number;
  centerLat?: number;
  centerLng?: number;
}

// Leaflet reads `window` while it is being imported, so the canvas can never be
// server-rendered. next/dynamic with ssr:false is the only safe way in.
const ProvinceMapCanvas = dynamic(() => import("./ProvinceMapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse bg-neutral-200 dark:bg-neutral-800" />
  ),
});

function isGeocoded(place: MapPlacePoint): boolean {
  const { latitude, longitude } = place;
  if (typeof latitude !== "number" || typeof longitude !== "number") return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  // 0,0 is the "no coordinates stored" placeholder, not a place in the ocean.
  return !(latitude === 0 && longitude === 0);
}

export default function ProvinceMap({
  places,
  destinationName,
  totalPlaces,
  centerLat,
  centerLng,
}: ProvinceMapProps) {
  const [focus, setFocus] = useState<{ slug: string | null; nonce: number }>({
    slug: null,
    nonce: 0,
  });

  const geocoded = useMemo(() => places.filter(isGeocoded), [places]);
  const unmappedCount = Math.max(0, totalPlaces - geocoded.length);

  const focusPlace = focus.slug ? geocoded.find((p) => p.slug === focus.slug) : undefined;

  function selectPlace(slug: string) {
    setFocus((prev) => ({ slug, nonce: prev.nonce + 1 }));
  }

  return (
    <section className="rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
      <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-zinc-500" /> Map of {destinationName}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {geocoded.length > 0
              ? "Every directory entry with stored GPS coordinates, plotted on open OpenStreetMap data."
              : `No place in ${destinationName} has stored coordinates yet.`}
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
          {geocoded.length} of {totalPlaces} places mapped
        </div>
      </div>

      {geocoded.length === 0 ? (
        <div className="p-8 text-center">
          <Crosshair className="h-7 w-7 mx-auto text-zinc-400" />
          <p className="mt-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            No verified coordinates yet
          </p>
          <p className="mt-1 text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            Coordinates are added per place by editors. The {totalPlaces} place
            {totalPlaces === 1 ? "" : "s"} for {destinationName}{" "}
            {totalPlaces === 1 ? "is" : "are"} still listed in the grid below.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative h-80 sm:h-96 lg:h-[440px] bg-neutral-100 dark:bg-neutral-800">
            <ProvinceMapCanvas
              places={geocoded}
              centerLat={centerLat}
              centerLng={centerLng}
              focusSlug={focus.slug}
              focusNonce={focus.nonce}
            />
          </div>

          <div className="border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 flex flex-col min-h-0">
            <div className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              {focusPlace ? "Selected location" : "Select a place to fly there"}
            </div>
            <ul className="flex-1 max-h-[300px] lg:max-h-[372px] overflow-y-auto px-2 pb-2 space-y-1">
              {geocoded.map((place) => {
                const active = place.slug === focus.slug;
                return (
                  <li key={place.slug}>
                    <button
                      type="button"
                      onClick={() => selectPlace(place.slug)}
                      className={`w-full text-left rounded-xl px-3 py-2 border transition-colors ${
                        active
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800"
                          : "bg-transparent border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                        {place.place_type.replace(/_/g, " ")}
                      </span>
                      <span className="block text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">
                        {place.name}
                      </span>
                      <span className="block text-[10px] text-neutral-500 tabular-nums">
                        {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-500 leading-relaxed">
              {unmappedCount > 0 ? (
                <p>
                  {unmappedCount} place{unmappedCount === 1 ? " has" : "s have"} no coordinates
                  yet, so{" "}
                  {unmappedCount === 1 ? "it is" : "they are"} not on the map. They still appear
                  in the places grid below.
                </p>
              ) : (
                <p>All {totalPlaces} listed places have coordinates.</p>
              )}
              <p className="mt-1">
                Map data &copy;{" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-0.5"
                >
                  OpenStreetMap contributors <ExternalLink className="h-2.5 w-2.5" />
                </a>
                , ODbL.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/40">
        <Link
          href="/travel/nearby"
          className="text-xs font-semibold text-primary hover:underline"
        >
          Find places near a coordinate &rarr;
        </Link>
      </div>
    </section>
  );
}
