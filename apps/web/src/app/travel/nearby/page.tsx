"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { searchNearby } from "@/lib/api";
import { NearbySearchResponse } from "@/types";
import { NearbyPlaceCard } from "@/components/travel/NearbyPlaceCard";
import { Compass, MapPin, Navigation, Filter, Footprints, Car } from "lucide-react";

const POPULAR_REFERENCE_LANDMARKS = [
  { slug: "angkor-wat", name: "Angkor Wat (Main Sanctuary)" },
  { slug: "bayon-temple", name: "Bayon Temple (Angkor Thom)" },
  { slug: "raffles-grand-hotel-d-angkor", name: "Raffles Grand Hotel d'Angkor" },
  { slug: "siem-reap-pub-street", name: "Pub Street (Nightlife & Dining)" },
  { slug: "siem-reap-old-market", name: "Phsar Chas (Old Market)" },
  { slug: "phnom-bakheng", name: "Phnom Bakheng (Sunset Hill)" },
];

export default function NearbySearchPage() {
  const [selectedPlace, setSelectedPlace] = useState("angkor-wat");
  const [radius, setRadius] = useState<number>(10.0);
  const [placeType, setPlaceType] = useState<string>("");
  const [data, setData] = useState<NearbySearchResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNearby() {
      setLoading(true);
      try {
        const res = await searchNearby({
          place: selectedPlace,
          radius: radius,
          type: placeType || undefined,
          limit: 30
        });
        setData(res);
      } catch (err) {
        console.error("Nearby search failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNearby();
  }, [selectedPlace, radius, placeType]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <Link href="/travel" className="hover:text-primary transition-colors">Travel</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Nearby Places & Attractions</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/5 to-background border rounded-2xl p-6 sm:p-10 mb-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 mb-3">
            <Compass className="w-3.5 h-3.5" /> Spherical Haversine Geolocation Engine
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            What is Near Me?
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
            Calculate exact spherical distances, walking times, and tuk-tuk driving estimates from any landmark or heritage monument across Cambodia without relying on third-party commercial mapping dependencies.
          </p>

          {/* Controls Bar */}
          <div className="bg-card border rounded-xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Reference Landmark
              </label>
              <select
                value={selectedPlace}
                onChange={(e) => setSelectedPlace(e.target.value)}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                {POPULAR_REFERENCE_LANDMARKS.map((lm) => (
                  <option key={lm.slug} value={lm.slug}>
                    {lm.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Search Radius
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                <option value={2.0}>Within 2 km (Walking distance)</option>
                <option value={5.0}>Within 5 km (Short tuk-tuk)</option>
                <option value={10.0}>Within 10 km (Heritage circuit)</option>
                <option value={20.0}>Within 20 km (Regional exploration)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Filter Category
              </label>
              <select
                value={placeType}
                onChange={(e) => setPlaceType(e.target.value)}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">All Categories</option>
                <option value="TEMPLE">Temples & Monuments</option>
                <option value="ACCOMMODATION">Hotels & Resorts</option>
                <option value="RESTAURANT">Dining & Cafes</option>
                <option value="MARKET">Markets & Shopping</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">
            Places within {radius} km of <span className="text-primary">{data?.reference_name || selectedPlace}</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sorted by nearest straight-line distance with estimated travel duration.
          </p>
        </div>
        {data && (
          <span className="text-xs font-semibold bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
            {data.total} locations found
          </span>
        )}
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          Calculating spherical distance vectors...
        </div>
      ) : data && data.results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.results.map((item) => (
            <NearbyPlaceCard key={item.place.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-xl p-8 text-center max-w-md mx-auto my-8">
          <Compass className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold text-base mb-1">No places in this radius</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Try expanding the search radius to 10 km or 20 km to discover temples and accommodation in the surrounding circuit.
          </p>
          <button
            onClick={() => setRadius(20.0)}
            className="text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg"
          >
            Expand to 20 km
          </button>
        </div>
      )}
    </div>
  );
}
