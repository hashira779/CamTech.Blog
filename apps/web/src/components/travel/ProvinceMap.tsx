"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { ArrowRight, Crosshair, MapPin, ExternalLink } from "lucide-react";

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
    <div className="h-full w-full animate-pulse bg-surface-muted" />
  ),
});

function isGeocoded(place: MapPlacePoint): boolean {
  const { latitude, longitude } = place;
  if (typeof latitude !== "number" || typeof longitude !== "number") return false;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  // 0,0 is the "no coordinates stored" placeholder, not a place in the ocean.
  return !(latitude === 0 && longitude === 0);
}

/**
 * The province map.
 *
 * Leaflet + OpenStreetMap are unchanged — same tile layer, same marker/fitBounds logic, same
 * fly-to interaction from the companion list. Only the surrounding chrome was restyled, and the
 * colours that used to be hardcoded inside the canvas now come from the theme tokens, so the map
 * flips with light/dark. Every count shown here is a real count of the rows this province carries.
 */
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
    <section
      aria-label={`Map of ${destinationName}`}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <header className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="section-label inline-flex items-center gap-1.5 text-accent">
            <MapPin size={13} aria-hidden="true" />
            OpenStreetMap
          </span>
          <h2 className="mt-2 font-display text-xl leading-tight tracking-tight text-foreground">
            Map of {destinationName}
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {geocoded.length > 0
              ? "Every directory entry with stored GPS coordinates, plotted on open OpenStreetMap data."
              : `No place in ${destinationName} has stored coordinates yet.`}
          </p>
        </div>

        <p className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
          <span className="font-display text-2xl leading-none text-foreground">
            {geocoded.length}
          </span>{" "}
          of {totalPlaces} places mapped
        </p>
      </header>

      {geocoded.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
          <Crosshair size={24} strokeWidth={1.5} aria-hidden="true" className="text-border-strong" />
          <p className="mt-1 font-display text-lg text-foreground">No verified coordinates yet</p>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Coordinates are added per place by editors. The {totalPlaces} place
            {totalPlaces === 1 ? "" : "s"} for {destinationName}{" "}
            {totalPlaces === 1 ? "is" : "are"} still listed in the grid below.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative h-80 border-b border-border bg-surface-muted sm:h-96 lg:h-[440px] lg:border-b-0">
            <ProvinceMapCanvas
              places={geocoded}
              centerLat={centerLat}
              centerLng={centerLng}
              focusSlug={focus.slug}
              focusNonce={focus.nonce}
            />
          </div>

          <div className="flex min-h-0 flex-col">
            <div className="px-5 pt-5 pb-3">
              <p className="section-label">
                {focusPlace ? "Selected location" : "Select a place to fly there"}
              </p>
            </div>

            <ul className="max-h-[300px] flex-1 space-y-1 overflow-y-auto px-3 pb-3 lg:max-h-[364px]">
              {geocoded.map((place) => {
                const active = place.slug === focus.slug;
                return (
                  <li key={place.slug}>
                    <button
                      type="button"
                      onClick={() => selectPlace(place.slug)}
                      aria-pressed={active}
                      className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                        active
                          ? "border-accent/40 bg-accent-soft"
                          : "border-transparent hover:bg-surface-muted"
                      }`}
                    >
                      <span className="section-label block truncate">
                        {place.place_type.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`mt-1 block text-sm font-semibold leading-snug line-clamp-1 ${
                          active ? "text-accent" : "text-foreground"
                        }`}
                      >
                        {place.name}
                      </span>
                      <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                        {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <footer className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground">
              {unmappedCount > 0 ? (
                <p>
                  {unmappedCount} place{unmappedCount === 1 ? " has" : "s have"} no coordinates yet,
                  so {unmappedCount === 1 ? "it is" : "they are"} not on the map. They still appear
                  in the places grid below.
                </p>
              ) : (
                <p>All {totalPlaces} listed places have coordinates.</p>
              )}
              <p className="mt-1.5">
                Map data &copy;{" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-accent underline-offset-2 hover:underline"
                >
                  OpenStreetMap contributors <ExternalLink size={11} aria-hidden="true" />
                </a>
                , ODbL.
              </p>
            </footer>
          </div>
        </div>
      )}

      <div className="border-t border-border bg-surface-muted/60 px-6 py-3">
        <Link
          href="/travel/nearby"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
        >
          Find places near a coordinate
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="link-nudge"
          />
        </Link>
      </div>
    </section>
  );
}
