import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  Compass,
  MapPin,
  Calendar,
  ArrowRight,
  PlusCircle,
  Navigation,
  Bus,
  Footprints,
  BookOpen,
  ChevronRight,
  Sparkles,
  Palmtree,
  Mountain,
  Waves,
  Globe2,
} from "lucide-react";
import {
  getDestinations,
  getPlaces,
  getTrips,
  getTravelGuides,
  getTravelEvents,
  searchTransportRoutes,
} from "@/lib/api";
import { TravelGuideCard } from "@/components/travel/TravelGuideCard";
import { TravelEventCard } from "@/components/travel/TravelEventCard";
import { TransportRouteCard } from "@/components/travel/TransportRouteCard";
import { ProvinceHubGrid } from "@/components/travel/ProvinceHubGrid";
import { TouristAttractionsGrid } from "@/components/travel/TouristAttractionsGrid";
import { HeroDestinationSlider } from "@/components/travel/HeroDestinationSlider";

export const metadata: Metadata = {
  title: "Travel & Trip Discovery across Cambodia | Daily Discovery",
  description:
    "Explore verified destinations across all 25 provinces, sacred ancient temples, tropical islands, bus schedules, and curated trip itineraries.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TravelHubPage() {
  const [destinations, touristPlacesData, trips, guides, events, transportData] =
    await Promise.all([
      getDestinations(),
      getPlaces({
        type: "ATTRACTION,TEMPLE,WATERFALL,BEACH,NATIONAL_PARK,LAKE",
        limit: 16,
        offset: 0,
      }),
      getTrips({ featured: true }),
      getTravelGuides(),
      getTravelEvents(),
      searchTransportRoutes("phnom-penh", "siem-reap"),
    ]);

  const touristPlaces = touristPlacesData.items;

  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ━━━ 1. DYNAMIC DATABASE-DRIVEN HERO SLIDER ━━━ */}
      <HeroDestinationSlider destinations={destinations} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-20">
        {/* ━━━ 2. MUST-VISIT TOURIST ATTRACTIONS & SACRED WONDERS ━━━ */}
        <section className="animate-fade-up">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Iconic Landmarks & Heritage
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Must-Visit Tourist Attractions
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
                Ancient stone temples, cascading jungle waterfalls, crystal-clear
                island bays, and royal landmarks verified in our database.
              </p>
            </div>
            <Link
              href="/travel/siem-reap?type=TEMPLE,ATTRACTION"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors group"
            >
              All attractions
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Interactive filterable attractions grid */}
          <TouristAttractionsGrid places={touristPlaces} />
        </section>

        {/* ━━━ 4. ALL 25 PROVINCES & DESTINATION HUBS ━━━ */}
        <section className="animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                <Compass className="h-3.5 w-3.5 text-zinc-400" /> Complete Kingdom Directory
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                Explore Cambodia&apos;s 25 Provinces
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl">
                From coastal seafood havens to mystical highland mountains and
                Mekong river communities. Filter by region to plan your trip.
              </p>
            </div>
          </div>

          {/* Interactive filterable 25-province grid with genuine photos */}
          <ProvinceHubGrid destinations={destinations} />
        </section>

        {/* ━━━ 5. CURATED MULTI-DAY TRIP ITINERARIES ━━━ */}
        {trips.length > 0 && (
          <section className="animate-fade-up">
            <div className="rounded-3xl bg-zinc-100/90 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 block">
                    Curated Schedules
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                    Multi-Day Travel Itineraries
                  </h2>
                </div>
                <Link
                  href="/travel/planner"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors group"
                >
                  Build custom plan
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {trips.map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/travel/trips/${trip.slug}`}
                    className="group flex flex-col sm:flex-row bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200/80 dark:border-zinc-800 shadow-2xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="sm:w-2/5 relative aspect-[16/10] sm:aspect-auto overflow-hidden bg-zinc-800">
                      <img
                        src={trip.hero_image_url || "/images/places/angkor-wat.jpg"}
                        alt={trip.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md rounded-full px-2.5 py-1 text-[11px] font-bold text-white border border-white/10">
                        {trip.duration_days} Days
                      </div>
                    </div>
                    <div className="p-5 sm:w-3/5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">
                          <span>{trip.travel_style}</span>
                          <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                          <span>{trip.budget_level} Budget</span>
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors leading-snug">
                          {trip.title}
                        </h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                          {trip.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                        <span>{trip.days?.length || 3} daily stops</span>
                        <span className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1 transition-transform duration-300 group-hover:translate-x-1">
                          View Itinerary <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ━━━ 6. INTERCITY TRANSIT & BUSES ━━━ */}
        {transportData.routes.length > 0 && (
          <section className="animate-fade-up">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  <Bus className="w-3.5 h-3.5" /> Intercity Transit
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  Buses, Vans & Schedules
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Verified daily departures, ticket rates, and direct booking
                  links.
                </p>
              </div>
              <Link
                href="/travel/transport"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors group"
              >
                All routes{" "}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {transportData.routes.slice(0, 2).map((route) => (
                <TransportRouteCard key={route.id} route={route} />
              ))}
            </div>
          </section>
        )}

        {/* ━━━ 7. PRACTICAL FIELD GUIDES ━━━ */}
        {guides.length > 0 && (
          <section className="animate-fade-up">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  <BookOpen className="w-3.5 h-3.5" /> Field Guides
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  Practical Travel Knowledge
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Logistics, dress codes, dawn timings, and temple etiquette.
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

        {/* ━━━ 8. CULTURAL CALENDAR & EVENTS ━━━ */}
        {events.length > 0 && (
          <section className="animate-fade-up">
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  <Calendar className="w-3.5 h-3.5" /> Cultural Calendar
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  Upcoming Festivals & Gatherings
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Sacred celebrations, international marathons, and water
                  festivals.
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

        {/* ━━━ 9. INTERACTIVE TRIP PLANNER CTA ━━━ */}
        <section className="animate-fade-up">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white border border-zinc-800">
            <div className="relative z-10 p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-xl">
                <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 mb-3 block">
                  Trip Engine
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                  Plan Your Dream Cambodia Adventure
                </h2>
                <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
                  Tell us your dates, budget, and travel style. Get an optimized
                  day-by-day itinerary with routes, opening times, and authentic
                  dining stops.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/travel/planner"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-sm transition-all shadow-xs"
                >
                  <Navigation className="h-4 w-4" /> Start Planning
                </Link>
                <Link
                  href="/travel/suggest"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white font-medium text-sm transition-all border border-white/15"
                >
                  <PlusCircle className="h-4 w-4" /> Suggest a Place
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
