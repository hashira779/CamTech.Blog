import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  MapPin,
  Calendar,
  Info,
  ShieldCheck,
  Star,
  Compass,
  ArrowRight,
  Filter,
  Navigation,
  Sparkles,
  Hotel,
  Coffee,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import { getDestinationBySlug, getTrips } from "@/lib/api";
import { PlaceFilterGrid } from "./PlaceFilterGrid";

interface PageProps {
  params: Promise<{ destination: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { destination: slug } = await params;
  const dest = await getDestinationBySlug(slug);
  if (!dest) return { title: "Destination Not Found" };

  return {
    title: `${dest.name} Travel Guide, Places, Hotels & Itineraries | Daily Discovery`,
    description: dest.overview.slice(0, 160),
  };
}

export default async function DestinationPage({ params }: PageProps) {
  const { destination: slug } = await params;
  const [destination, trips] = await Promise.all([
    getDestinationBySlug(slug),
    getTrips({ destination: slug }),
  ]);

  if (!destination) {
    notFound();
  }

  const places = destination.places || [];

  return (
    <div className="min-h-screen pb-24">
      {/* 1. Destination Hero Banner */}
      <section className="relative overflow-hidden bg-neutral-950 text-white py-16 lg:py-24">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 filter blur-[1px] scale-105"
          style={{
            backgroundImage: `url('${destination.hero_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-3 uppercase tracking-wider">
            <Link href="/travel" className="hover:underline">
              Travel
            </Link>
            <span>/</span>
            <span>{destination.country?.name || "Cambodia"}</span>
          </div>

          <div className="max-w-4xl">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
                {destination.name}
              </h1>
              {destination.name_km && (
                <span className="text-2xl sm:text-3xl font-bold text-neutral-400">
                  {destination.name_km}
                </span>
              )}
            </div>

            <p className="mt-4 text-base sm:text-lg text-neutral-300 leading-relaxed max-w-3xl">
              {destination.overview}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-300">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                <Calendar className="h-4 w-4 text-amber-400" />
                <span>Best time: {destination.best_time_to_visit || "Nov - Mar"}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                <MapPin className="h-4 w-4 text-rose-400" />
                <span>Coordinates: {destination.latitude}°N, {destination.longitude}°E</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>{places.length} Verified Records</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/travel/planner?destination=${destination.slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-sm text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
              >
                <Navigation className="h-4 w-4" /> Plan {destination.name} Trip
              </Link>
              <Link
                href="/travel/suggest"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-sm transition-all"
              >
                Suggest Place / Report Update
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        {/* 2. Practical Traveler Guidelines Alert */}
        {destination.practical_info && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-5 sm:p-6 flex items-start gap-4">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-400 shrink-0">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                Essential Practical Information for {destination.name}
              </h3>
              <p className="mt-1 text-sm text-amber-900 dark:text-amber-300/90 leading-relaxed">
                {destination.practical_info}
              </p>
            </div>
          </div>
        )}

        {/* 3. Interactive Geocoded Coordinates Panel */}
        <section className="rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-600" /> Geocoded Map & Coordinates
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Verified GPS coordinates for major temples, heritage hotels, and markets.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {places.length} Locations Mapped
            </div>
          </div>

          <div className="relative bg-neutral-950 h-72 sm:h-96 overflow-hidden flex items-center justify-center p-6">
            {/* Stylized vector map representation with active pins */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {places.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="bg-neutral-900/90 border border-neutral-800 p-3 rounded-xl backdrop-blur-sm flex flex-col justify-between hover:border-rose-500/50 transition-colors"
                >
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-400">
                      {p.place_type}
                    </span>
                    <h4 className="font-bold text-xs text-white line-clamp-1 mt-0.5">
                      {p.name}
                    </h4>
                  </div>
                  <div className="mt-2 text-[10px] text-neutral-400 flex items-center justify-between">
                    <span>{p.latitude?.toFixed(4)}, {p.longitude?.toFixed(4)}</span>
                    <Link
                      href={`/travel/place/${p.slug}`}
                      className="text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Curated Multi-Day Itineraries for this Destination */}
        {trips.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Curated {destination.name} Itineraries
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Tested day-by-day schedules with duration and time-of-day breakdowns.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/travel/trips/${trip.slug}`}
                  className="group rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 hover:shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-600 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900">
                        {trip.duration_days} Days
                      </span>
                      <span>{trip.travel_style}</span>
                      <span>•</span>
                      <span>Budget {trip.budget_level}</span>
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors">
                      {trip.title}
                    </h3>
                    <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                      {trip.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-neutral-500">
                    <span>{trip.days?.length || 3} Detailed Day Schedules</span>
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Explore Full Itinerary <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 5. Interactive Filterable Places Grid (Client Component) */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Places to Visit & Stay in {destination.name}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Filter temples, luxury accommodations, Khmer dining, local markets, and waterfalls.
            </p>
          </div>

          <PlaceFilterGrid places={places} destinationSlug={destination.slug} />
        </section>
      </div>
    </div>
  );
}
