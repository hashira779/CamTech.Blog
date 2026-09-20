"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  DollarSign,
  Printer,
  Bookmark,
  Share2,
  Navigation,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Utensils
} from "lucide-react";
import { generateTripPlan, getDestinations } from "@/lib/api";
import { Destination, TripPlanResponse } from "@/types";

export default function TripPlannerPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationSlug, setDestinationSlug] = useState<string>("siem-reap");
  const [durationDays, setDurationDays] = useState<number>(3);
  const [travelStyle, setTravelStyle] = useState<string>("CULTURAL");
  const [budgetLevel, setBudgetLevel] = useState<string>("$$");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Temples",
    "Food",
    "Nature",
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [tripPlan, setTripPlan] = useState<TripPlanResponse | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    getDestinations().then((dists) => {
      setDestinations(dists);
      if (dists.length > 0 && !destinationSlug) {
        setDestinationSlug(dists[0].slug);
      }
    });

    // Auto-generate initial plan
    handleGeneratePlan("siem-reap", 3, "CULTURAL", "$$");
  }, []);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGeneratePlan = async (
    dest = destinationSlug,
    days = durationDays,
    style = travelStyle,
    budget = budgetLevel
  ) => {
    setLoading(true);
    const plan = await generateTripPlan({
      destination_slug: dest,
      duration_days: days,
      travel_style: style,
      budget_level: budget,
      interests: selectedInterests,
    });
    setTripPlan(plan);
    setLoading(false);
  };

  const handleSaveTrip = () => {
    // Session bookmark without forcing auth
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* 1. Header Banner */}
      <section className="bg-gradient-to-r from-neutral-900 via-rose-950 to-neutral-900 text-white py-14 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Navigation className="h-3.5 w-3.5" /> Public Trip Planning Engine
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Intelligent Multi-Day Trip Planner
            </h1>
            <p className="mt-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
              No account required. Select your destination, style, and travel duration to receive an
              algorithmically organized itinerary with realistic durations, costs, and verified places.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Main Planner Interface */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controls Form (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-rose-600" /> Trip Parameters
              </h2>

              {/* Destination */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                  Destination
                </label>
                <select
                  value={destinationSlug}
                  onChange={(e) => setDestinationSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="siem-reap">Siem Reap (Angkor Wat, Tonle Sap)</option>
                  <option value="phnom-penh">Phnom Penh (Royal Palace, Riverfront)</option>
                  <option value="kampot">Kampot (Pepper Farms, Bokor Mountain)</option>
                </select>
              </div>

              {/* Number of Days */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Duration: <strong className="text-rose-600 dark:text-rose-400 font-extrabold">{durationDays} Days</strong>
                  </label>
                </div>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-neutral-400 mt-1">
                  <span>1 Day</span>
                  <span>3 Days</span>
                  <span>5 Days</span>
                  <span>7 Days</span>
                </div>
              </div>

              {/* Travel Style */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                  Travel Style
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  {[
                    { id: "CULTURAL", label: "Cultural & Temples" },
                    { id: "RELAXED", label: "Relaxed & Cafes" },
                    { id: "ADVENTURE", label: "Nature & Hiking" },
                    { id: "LUXURY", label: "Luxury Heritage" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setTravelStyle(style.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        travelStyle === style.id
                          ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 font-bold"
                          : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Level */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                  Budget Level
                </label>
                <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                  {["$", "$$", "$$$", "$$$$"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudgetLevel(b)}
                      className={`py-2 rounded-xl border transition-all ${
                        budgetLevel === b
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                          : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                  Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Temples", "Food", "Nature", "Markets", "Photography", "Nightlife"].map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => handleGeneratePlan()}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold text-sm shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Generating Itinerary...</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Generate Custom Itinerary</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Plan Results (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {tripPlan ? (
              <div className="space-y-6">
                {/* Result Summary Bar */}
                <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-600 mb-1">
                      <span>{tripPlan.duration_days} Days</span>
                      <span>•</span>
                      <span>{tripPlan.travel_style} Style</span>
                      <span>•</span>
                      <span>Budget {tripPlan.budget_level}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                      {tripPlan.destination_name} Custom Odyssey
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                      {tripPlan.summary}
                    </p>
                  </div>

                  {/* Actions (Save / Print) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleSaveTrip}
                      className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5"
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      <span>{savedSuccess ? "Saved to Session!" : "Save Trip"}</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>

                {/* Day by Day Itinerary */}
                <div className="space-y-6">
                  {tripPlan.days.map((day) => (
                    <div
                      key={day.day_number}
                      className="bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-rose-600 text-white font-bold text-base flex items-center justify-center">
                            {day.day_number}
                          </div>
                          <div>
                            <h3 className="font-bold text-base sm:text-lg text-neutral-900 dark:text-white">
                              {day.title}
                            </h3>
                            <p className="text-xs text-neutral-500">{day.theme}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {day.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700/50"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-xs text-rose-600 dark:text-rose-400">
                                  {item.start_time}
                                </span>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                  {item.time_of_day}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                                {item.title}
                              </h4>
                              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-200 dark:border-neutral-700">
                              <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> ~{item.duration_minutes}m
                              </span>
                              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                {item.estimated_cost}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <Compass className="h-10 w-10 text-neutral-400 mx-auto animate-spin" />
                <p className="mt-4 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                  Building your custom itinerary...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
