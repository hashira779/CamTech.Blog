import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowRight,
  Compass,
  Navigation,
  CheckCircle2,
  Share2,
  DollarSign
} from "lucide-react";
import { getTripBySlug } from "@/lib/api";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);
  if (!trip) return { title: "Itinerary Not Found" };

  return {
    title: `${trip.title} | Daily Discovery Travel`,
    description: trip.description.slice(0, 160),
  };
}

export default async function TripDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const trip = await getTripBySlug(slug);

  if (!trip) {
    notFound();
  }

  const days = trip.days || [];

  return (
    <div className="min-h-screen pb-24">
      {/* 1. Itinerary Hero Header */}
      <section className="relative overflow-hidden bg-neutral-950 text-white py-16 lg:py-24">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 filter blur-[1px] scale-105"
          style={{
            backgroundImage: `url('${trip.hero_image_url || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 mb-4 uppercase tracking-wider">
            <Link href="/travel" className="hover:underline">
              Travel
            </Link>
            <span>/</span>
            {trip.destination && (
              <>
                <Link href={`/travel/${trip.destination.slug}`} className="hover:underline">
                  {trip.destination.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span>Curated Trips</span>
          </div>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider">
                {trip.duration_days} Days / Complete Guide
              </span>
              <span className="text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
                Style: {trip.travel_style}
              </span>
              <span className="text-xs font-semibold text-neutral-300">
                Budget: {trip.budget_level}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {trip.title}
            </h1>
            {trip.title_km && (
              <p className="text-xl sm:text-2xl font-bold text-neutral-400 mt-2">
                {trip.title_km}
              </p>
            )}

            <p className="mt-4 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-3xl">
              {trip.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/travel/planner?destination=${trip.destination?.slug || "siem-reap"}&duration=${trip.duration_days}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-sm text-white shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
              >
                <Navigation className="h-4 w-4" /> Customize In Trip Planner
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Daily Schedule Timeline */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-12">
        {days.map((day) => (
          <section
            key={day.id}
            className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm"
          >
            <div className="border-b border-neutral-100 dark:border-neutral-800 pb-5 mb-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-rose-600/20">
                  {day.day_number}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                    {day.title}
                  </h2>
                  {day.summary && (
                    <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                      {day.summary}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Items inside this day */}
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-neutral-200 dark:before:bg-neutral-800">
              {day.items.map((item) => (
                <div key={item.id} className="relative flex items-start gap-4 pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 top-1.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-white dark:border-neutral-900 shadow-sm" />

                  <div className="flex-1 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl p-4 sm:p-5 border border-neutral-100 dark:border-neutral-700/60">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {item.start_time && (
                          <span className="font-bold text-xs text-rose-600 dark:text-rose-400">
                            {item.start_time}
                          </span>
                        )}
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                          {item.time_of_day}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>~{item.duration_minutes} mins</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {item.place && (
                      <div className="mt-4 pt-3 border-t border-neutral-200/80 dark:border-neutral-700/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-rose-500" />
                          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                            {item.place.name}
                          </span>
                        </div>
                        <Link
                          href={`/travel/place/${item.place.slug}`}
                          className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                        >
                          View Place Details <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* CTA to customize */}
        <div className="text-center py-8">
          <Link
            href={`/travel/planner?destination=${trip.destination?.slug || "siem-reap"}`}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-rose-600/20 hover:scale-105 transition-all"
          >
            <Sparkles className="h-4 w-4 text-amber-300" /> Generate Your Custom Daily Discovery Itinerary
          </Link>
        </div>
      </div>
    </div>
  );
}
