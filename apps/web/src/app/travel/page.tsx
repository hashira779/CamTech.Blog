import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  Compass,
  MapPin,
  Calendar,
  Sparkles,
  Hotel,
  Utensils,
  Camera,
  ArrowRight,
  ShieldCheck,
  Star,
  PlusCircle,
  Navigation,
  Bus,
  Footprints,
  BookOpen
} from "lucide-react";
import { getDestinations, getPlaces, getTrips, getTravelGuides, getTravelEvents, searchTransportRoutes } from "@/lib/api";
import { TravelGuideCard } from "@/components/travel/TravelGuideCard";
import { TravelEventCard } from "@/components/travel/TravelEventCard";
import { TransportRouteCard } from "@/components/travel/TransportRouteCard";

export const metadata: Metadata = {
  title: "Travel & Trip Discovery | Daily Discovery",
  description: "Explore verified destinations, sacred temples, luxury heritage hotels, transport routes, and curated multi-day trip itineraries across Cambodia.",
};

export default async function TravelHubPage() {
  const [destinations, placesData, trips, guides, events, transportData] = await Promise.all([
    getDestinations(),
    getPlaces({ limit: 8, featured: true }),
    getTrips({ featured: true }),
    getTravelGuides(),
    getTravelEvents(),
    searchTransportRoutes("phnom-penh", "siem-reap"),
  ]);

  const places = placesData.items;
  const siemReap = destinations.find((d) => d.slug === "siem-reap") || destinations[0];

  return (
    <div className="min-h-screen pb-20">
      {/* 1. Hero Showcase */}
      <section className="relative overflow-hidden bg-neutral-900 text-white py-20 lg:py-28">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('${siemReap?.hero_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Compass className="h-3.5 w-3.5" /> Authoritative Travel & Exploration
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-3xl leading-tight">
            Journey Through Ancient Kingdoms, Sacred Falls & Living Culture
          </h1>
          <p className="mt-4 text-base sm:text-lg text-neutral-300 max-w-2xl leading-relaxed">
            Zero crowds of copied info. Authoritative destination hubs, verified temple coordinates,
            heritage hotels, and intelligent day-by-day trip planners.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/travel/siem-reap"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
            >
              <MapPin className="h-4 w-4" /> Explore Siem Reap
            </Link>
            <Link
              href="/travel/planner"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold text-sm backdrop-blur-sm transition-all"
            >
              <Navigation className="h-4 w-4 text-amber-400" /> Launch Trip Planner
            </Link>
            <Link
              href="/travel/transport"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold text-sm backdrop-blur-sm transition-all"
            >
              <Bus className="h-4 w-4 text-emerald-400" /> Buses & Routes
            </Link>
            <Link
              href="/travel/nearby"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold text-sm backdrop-blur-sm transition-all"
            >
              <Footprints className="h-4 w-4 text-sky-400" /> What's Near Me?
            </Link>
            <Link
              href="/travel/suggest"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-sm transition-colors"
            >
              <PlusCircle className="h-4 w-4" /> Suggest a Place
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        {/* 2. Featured Destinations */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Featured Destinations
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Authoritative hubs stocked with geocoded attractions, accommodations, and dining.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <Link
                key={dest.id}
                href={`/travel/${dest.slug}`}
                className="group relative rounded-2xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <img
                    src={dest.hero_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-xs uppercase font-bold tracking-wider text-rose-400">
                      {dest.name_km || "Destination"}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {dest.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                    {dest.overview}
                  </p>

                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {dest.best_time_to_visit || "Year-round"}
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View Hub <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Curated Multi-Day Trips */}
        {trips.length > 0 && (
          <section className="rounded-3xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                  Ready-to-Explore Itineraries
                </span>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                  Handcrafted Trip Experiences
                </h2>
              </div>
              <Link
                href="/travel/planner"
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Customize Your Own Trip <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {trips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/travel/trips/${trip.slug}`}
                  className="group flex flex-col sm:flex-row bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:shadow-lg transition-all"
                >
                  <div className="sm:w-2/5 relative aspect-[16/10] sm:aspect-auto overflow-hidden">
                    <img
                      src={trip.hero_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80"}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
                      {trip.duration_days} Days
                    </div>
                  </div>
                  <div className="p-5 sm:w-3/5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1">
                        <span>{trip.travel_style}</span>
                        <span>•</span>
                        <span>Budget {trip.budget_level}</span>
                      </div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors">
                        {trip.title}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 line-clamp-2">
                        {trip.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                      <span>{trip.days?.length || 3} Daily Schedules</span>
                      <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Read Itinerary <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. Verified Places & Heritage Attractions */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Verified Places in Siem Reap
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Monitored and reviewed by our editorial team. No scraped duplicates.
              </p>
            </div>
            <Link
              href="/travel/siem-reap"
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              All Siem Reap Places <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {places.map((place) => (
              <Link
                key={place.id}
                href={`/travel/place/${place.slug}`}
                className="group flex flex-col bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
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

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-rose-600 transition-colors line-clamp-1">
                      {place.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">
                      {place.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
                    <span className="font-medium">{place.price_level}</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. Intercity Transport & Highway Routes */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                <Bus className="w-3.5 h-3.5" /> Intercity Transit System
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Highway Buses, Minivans & Schedules
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                Verified departures, pricing ($13–$16), and official operator booking links between Cambodia's key travel corridors.
              </p>
            </div>
            <Link
              href="/travel/transport"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
            >
              All Routes & Operators <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {transportData.routes.slice(0, 2).map((route) => (
              <TransportRouteCard key={route.id} route={route} />
            ))}
          </div>
        </section>

        {/* 6. Curated Travel Guides */}
        {guides.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                  <BookOpen className="w-3.5 h-3.5" /> Authoritative Field Guides
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Practical Travel Knowledge & Etiquette
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  In-depth logistics, temple dawn timings, and transport comparisons crafted from on-the-ground experience.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guides.map((guide) => (
                <TravelGuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          </section>
        )}

        {/* 7. Upcoming Cultural Events */}
        {events.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Destination Calendar
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                  Upcoming Cultural Festivals & Gatherings
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Time-sensitive traditional festivals, marathons, and sacred celebrations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {events.map((event) => (
                <TravelEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* 8. Trip Planner Promo Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 text-white p-8 sm:p-12 shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-200">
              Interactive Trip Engine
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight mt-2">
              Plan Your Dream Cambodia Adventure in Seconds
            </h2>
            <p className="mt-3 text-sm sm:text-base text-neutral-100 leading-relaxed">
              Tell our deterministic travel engine your preferred duration, budget, and travel style.
              Receive an optimized hour-by-hour itinerary with opening hours, directions, and curated food stops.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <Link
                href="/travel/planner"
                className="px-6 py-3 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 font-bold text-sm shadow-md transition-all hover:scale-105"
              >
                Start Trip Planner
              </Link>
              <Link
                href="/travel/suggest"
                className="px-5 py-3 rounded-xl bg-neutral-900/40 hover:bg-neutral-900/60 border border-white/20 text-white font-semibold text-sm transition-all"
              >
                Suggest Missing Place
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
