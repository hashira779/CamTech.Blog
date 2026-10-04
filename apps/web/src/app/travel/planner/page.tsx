"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Utensils,
  Star,
  Search,
  ChevronDown,
  Layers,
  ChevronRight,
  Luggage,
  Coffee,
  Waves,
  Mountain,
  Landmark,
  Eye,
  Check
} from "lucide-react";
import { generateTripPlan, getDestinations } from "@/lib/api";
import { Destination, TripPlanResponse } from "@/types";

const TRAVEL_STYLES = [
  {
    id: "CULTURAL",
    label: "Cultural & Heritage",
    desc: "Ancient temples, UNESCO wonders, royal history",
    icon: Landmark,
  },
  {
    id: "RELAXED",
    label: "Relaxed & Cafes",
    desc: "Scenic strolls, artisan bakeries, peaceful sunsets",
    icon: Coffee,
  },
  {
    id: "ADVENTURE",
    label: "Nature & Hiking",
    desc: "Cascading waterfalls, national parks, wildlife",
    icon: Mountain,
  },
  {
    id: "LUXURY",
    label: "Luxury Heritage",
    desc: "5-star colonial resorts, fine dining, sunset charters",
    icon: Sparkles,
  },
];

const BUDGET_OPTIONS = [
  { id: "$", label: "$", name: "Budget", desc: "$15 - $35/day (Street food & local guesthouses)" },
  { id: "$$", label: "$$", name: "Standard", desc: "$40 - $90/day (Boutique hotels & great cafes)" },
  { id: "$$$", label: "$$$", name: "Premium", desc: "$100 - $220/day (Upscale dining & private guides)" },
  { id: "$$$$", label: "$$$$", name: "Luxury", desc: "$250+/day (World-class heritage resorts)" },
];

const INTEREST_TAGS = [
  { label: "Temples", icon: "🏛️" },
  { label: "Food", icon: "🍜" },
  { label: "Nature", icon: "🌿" },
  { label: "Waterfalls", icon: "🌊" },
  { label: "Markets", icon: "🏮" },
  { label: "Photography", icon: "📸" },
  { label: "Sunset", icon: "🌅" },
  { label: "Nightlife", icon: "✨" },
];

const FEATURED_PROVINCES = [
  "siem-reap",
  "phnom-penh",
  "kampot",
  "sihanoukville",
  "battambang",
  "kep",
  "mondulkiri",
  "preah-vihear",
];

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

  const [provinceSearch, setProvinceSearch] = useState<string>("");
  const [selectedDayTab, setSelectedDayTab] = useState<number | "ALL">("ALL");
  const [loading, setLoading] = useState<boolean>(false);
  const [tripPlan, setTripPlan] = useState<TripPlanResponse | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Client-side cache for superfast responses
  const planCache = useRef<Map<string, TripPlanResponse>>(new Map());

  useEffect(() => {
    getDestinations().then((dists) => {
      if (dists && dists.length > 0) {
        setDestinations(dists);
      }
    });

    // Generate initial plan
    handleGeneratePlan("siem-reap", 3, "CULTURAL", "$$");
  }, []);

  const currentDestination = useMemo(() => {
    return (
      destinations.find((d) => d.slug === destinationSlug) ||
      destinations[0] ||
      null
    );
  }, [destinations, destinationSlug]);

  const filteredDestinations = useMemo(() => {
    if (!provinceSearch.trim()) return destinations;
    const query = provinceSearch.toLowerCase();
    return destinations.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        (d.name_km && d.name_km.includes(query)) ||
        d.slug.toLowerCase().includes(query)
    );
  }, [destinations, provinceSearch]);

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
    budget = budgetLevel,
    interests = selectedInterests
  ) => {
    const cacheKey = `${dest}_${days}_${style}_${budget}_${interests.sort().join(",")}`;
    if (planCache.current.has(cacheKey)) {
      setTripPlan(planCache.current.get(cacheKey)!);
      setSelectedDayTab("ALL");
      return;
    }

    setLoading(true);
    try {
      const plan = await generateTripPlan({
        destination_slug: dest,
        duration_days: days,
        travel_style: style,
        budget_level: budget,
        interests: interests,
      });
      if (plan) {
        planCache.current.set(cacheKey, plan);
        setTripPlan(plan);
        setSelectedDayTab("ALL");
      }
    } catch (err) {
      console.error("Failed to generate plan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProvince = (slug: string) => {
    setDestinationSlug(slug);
    handleGeneratePlan(slug, durationDays, travelStyle, budgetLevel, selectedInterests);
  };

  const handleSaveTrip = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Filter days by tab
  const displayedDays = useMemo(() => {
    if (!tripPlan) return [];
    if (selectedDayTab === "ALL") return tripPlan.days;
    return tripPlan.days.filter((d) => d.day_number === selectedDayTab);
  }, [tripPlan, selectedDayTab]);

  return (
    <div className="min-h-screen pb-28 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ━━━ 1. HERO HEADER ━━━ */}
      <section className="relative overflow-hidden bg-zinc-950 text-white border-b border-zinc-800">
        {/* Ambient photo background with refined contrast */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{
            backgroundImage: `url('${
              currentDestination?.hero_image_url || "/images/destinations/siem-reap.jpg"
            }')`,
            filter: "brightness(0.22) saturate(1.1)",
            transform: "scale(1.08)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/60 to-zinc-950" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16">
          <div className="max-w-3xl">
            {/* Editorial breadcrumb badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-zinc-300 text-xs font-medium tracking-wide mb-5 backdrop-blur-md">
              <Navigation className="h-3.5 w-3.5 text-zinc-400" />
              <span>Cambodia Travel Intelligence</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-200">Verified Ground Truth</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Cambodia Itinerary Architect
            </h1>

            <p className="mt-4 text-base sm:text-lg text-zinc-300/90 leading-relaxed font-normal max-w-2xl">
              Curate a bespoke multi-day journey across any of Cambodia&apos;s 25
              provinces. Geocoded stops, verified local cuisine, authentic Khmer
              heritage, and accurate travel times from the database.
            </p>

            {/* Quick stats banner */}
            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-medium text-zinc-300">
              <span className="inline-flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-300" /> All 25 Provinces
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> 118 Verified Places
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                <Clock className="h-3.5 w-3.5 text-zinc-300" /> Instant 0ms Cache
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ 2. MAIN PLANNER WORKSPACE ━━━ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Controls Form (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-6 sticky top-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
                  <span>Customize Your Trip</span>
                </h2>
                <span className="text-xs text-zinc-500 font-medium">
                  {durationDays} Days • {travelStyle}
                </span>
              </div>

              {/* 1. Destination Selector with 25 Provinces */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500" /> Destination Province
                  </label>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    {destinations.length} Provinces
                  </span>
                </div>

                {/* Dropdown */}
                <div className="relative">
                  <select
                    id="destination-select"
                    value={destinationSlug}
                    onChange={(e) => handleSelectProvince(e.target.value)}
                    className="w-full pl-3 pr-10 py-3 rounded-2xl text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white appearance-none cursor-pointer transition-all shadow-2xs"
                  >
                    {destinations.length > 0 ? (
                      destinations.map((dest) => (
                        <option key={dest.id || dest.slug} value={dest.slug}>
                          {dest.name} {dest.name_km ? `(${dest.name_km})` : ""}
                        </option>
                      ))
                    ) : (
                      <option value="siem-reap">Siem Reap (សៀមរាប)</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                </div>

                {/* Popular Quick-Select Pills */}
                <div className="mt-3">
                  <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                    Popular Destinations:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FEATURED_PROVINCES.map((slug) => {
                      const found = destinations.find((d) => d.slug === slug);
                      const isSelected = destinationSlug === slug;
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => handleSelectProvince(slug)}
                          className={`
                            px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer
                            ${
                              isSelected
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-2xs"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }
                          `}
                        >
                          {found ? found.name : slug.replace("-", " ")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Duration Days (1 to 7) */}
              <div>
                <div className="flex justify-between items-center mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-zinc-500" /> Duration of Stay
                  </label>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                    {durationDays} {durationDays === 1 ? "Day" : "Days"} Itinerary
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 mb-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setDurationDays(num);
                        handleGeneratePlan(destinationSlug, num, travelStyle, budgetLevel, selectedInterests);
                      }}
                      className={`
                        py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer
                        ${
                          durationDays === num
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-2xs"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/60 dark:border-zinc-700/60"
                        }
                      `}
                    >
                      {num}d
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min={1}
                  max={7}
                  value={durationDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value);
                    setDurationDays(days);
                    handleGeneratePlan(destinationSlug, days, travelStyle, budgetLevel, selectedInterests);
                  }}
                  className="w-full accent-zinc-900 dark:accent-white cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                />
              </div>

              {/* 3. Travel Style */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2.5 flex items-center gap-1.5">
                  <Luggage className="h-3.5 w-3.5 text-zinc-500" /> Travel Style & Pace
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {TRAVEL_STYLES.map((style) => {
                    const Icon = style.icon;
                    const isSelected = travelStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => {
                          setTravelStyle(style.id);
                          handleGeneratePlan(destinationSlug, durationDays, style.id, budgetLevel, selectedInterests);
                        }}
                        className={`
                          p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer
                          ${
                            isSelected
                              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-2xs"
                              : "border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                          }
                        `}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`h-4 w-4 ${isSelected ? "text-white dark:text-zinc-950" : "text-zinc-400"}`} />
                          <span className="font-bold">
                            {style.label}
                          </span>
                        </div>
                        <p className={`text-[10px] leading-tight ${isSelected ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"}`}>
                          {style.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Budget Level */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-zinc-500" /> Budget Tier
                  </label>
                  <span className="text-[11px] text-zinc-500">
                    {BUDGET_OPTIONS.find((b) => b.id === budgetLevel)?.name}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
                  {BUDGET_OPTIONS.map((b) => {
                    const isSelected = budgetLevel === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setBudgetLevel(b.id);
                          handleGeneratePlan(destinationSlug, durationDays, travelStyle, b.id, selectedInterests);
                        }}
                        className={`
                          py-2.5 rounded-xl border transition-all flex flex-col items-center justify-center cursor-pointer
                          ${
                            isSelected
                              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-2xs"
                              : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          }
                        `}
                      >
                        <span className="text-sm font-extrabold">{b.label}</span>
                        <span className={`text-[10px] font-normal ${isSelected ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-400"}`}>
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Interests */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Activity Highlights
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {INTEREST_TAGS.map((item) => {
                    const isSelected = selectedInterests.includes(item.label);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleInterestToggle(item.label)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer
                          ${
                            isSelected
                              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-2xs"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/50 dark:border-zinc-700/50"
                          }
                        `}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Button: World-Class Solid Charcoal / White Button */}
              <button
                type="button"
                onClick={() => handleGeneratePlan()}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Compass className="h-4 w-4 animate-spin text-white dark:text-zinc-950" />
                    <span>Analyzing Route & Computing Itinerary...</span>
                  </span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-400 dark:text-amber-600" />
                    <span>Regenerate Itinerary Plan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Plan Results (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {loading ? (
              /* Skeleton Loading State */
              <div className="space-y-6 animate-pulse">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 h-44 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
                  </div>
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
                </div>

                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4"
                  >
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-1/3" />
                    <div className="space-y-3">
                      <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
                      <div className="h-20 bg-slate-100 dark:bg-slate-800/60 rounded-2xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tripPlan ? (
              <div className="space-y-6">
                
                {/* Result Hero Header Banner */}
                <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-md">
                  {/* Subtle banner photo */}
                  <div className="relative h-44 overflow-hidden bg-slate-800">
                    <img
                      src={
                        currentDestination?.hero_image_url ||
                        "/images/destinations/siem-reap.jpg"
                      }
                      alt={tripPlan.destination_name}
                      className="w-full h-full object-cover brightness-[0.8] saturate-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                    
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-950/70 backdrop-blur-md text-amber-300 border border-amber-400/20">
                        {currentDestination?.name_km || "កម្ពុជា"}
                      </span>
                      <Link
                        href={`/travel/${tripPlan.destination_slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
                      >
                        Explore Province <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {tripPlan.destination_name} Custom Odyssey
                      </h2>
                    </div>
                  </div>

                  {/* Summary & Toolbar */}
                  <div className="p-6">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                      {tripPlan.summary}
                    </p>

                    <div className="mt-5 pt-5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                      {/* Metric Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-700/70">
                          <Calendar className="h-3.5 w-3.5 text-zinc-500" /> {tripPlan.duration_days} Days
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-700/70">
                          <Luggage className="h-3.5 w-3.5 text-zinc-500" /> {tripPlan.travel_style}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/70 dark:border-zinc-700/70">
                          <DollarSign className="h-3.5 w-3.5 text-zinc-500" /> Budget {tripPlan.budget_level}
                        </span>
                      </div>

                      {/* Utility Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveTrip}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer"
                        >
                          <Bookmark className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{savedSuccess ? "Saved!" : "Save Plan"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyShareLink}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer"
                        >
                          <Share2 className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{copiedLink ? "Link Copied!" : "Share"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={handlePrint}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Print</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Day Filter Tabs */}
                {tripPlan.days.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                      type="button"
                      onClick={() => setSelectedDayTab("ALL")}
                      className={`
                        px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer
                        ${
                          selectedDayTab === "ALL"
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-2xs"
                            : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        }
                      `}
                    >
                      Complete Itinerary ({tripPlan.days.length} Days)
                    </button>
                    {tripPlan.days.map((day) => (
                      <button
                        key={day.day_number}
                        type="button"
                        onClick={() => setSelectedDayTab(day.day_number)}
                        className={`
                          px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer
                          ${
                            selectedDayTab === day.day_number
                              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold shadow-2xs"
                              : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                          }
                        `}
                      >
                        Day {day.day_number}
                      </button>
                    ))}
                  </div>
                )}

                {/* Day-by-Day Detailed Itinerary Cards */}
                <div className="space-y-6">
                  {displayedDays.map((day) => (
                    <div
                      key={day.day_number}
                      className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-7 border border-zinc-200/80 dark:border-zinc-800 shadow-xs"
                    >
                      {/* Day Title and Theme */}
                      <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold text-sm flex items-center justify-center shadow-2xs">
                            {day.day_number}
                          </div>
                          <div>
                            <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white tracking-tight">
                              {day.title}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-normal">
                              {day.theme}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-200/60 dark:border-zinc-700/60">
                          {day.items.length} Stops
                        </span>
                      </div>

                      {/* Activity Items with Authentic Images */}
                      <div className="space-y-4">
                        {day.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="group flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/30 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800/60 transition-all duration-200"
                          >
                            {/* Verified Photo */}
                            <div className="relative w-full sm:w-32 sm:h-28 h-44 rounded-2xl overflow-hidden bg-zinc-800 shrink-0 shadow-2xs">
                              {item.place_slug ? (
                                <Link href={`/travel/place/${item.place_slug}`} className="block w-full h-full">
                                  <img
                                    src={
                                      item.hero_image_url ||
                                      currentDestination?.hero_image_url ||
                                      "/images/destinations/siem-reap.jpg"
                                    }
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                </Link>
                              ) : (
                                <img
                                  src={
                                    item.hero_image_url ||
                                    currentDestination?.hero_image_url ||
                                    "/images/destinations/siem-reap.jpg"
                                  }
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent opacity-60 pointer-events-none" />
                              
                              {/* Rating badge overlay */}
                              {item.rating && (
                                <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-zinc-950/85 backdrop-blur-md text-amber-300 border border-zinc-800 shadow-2xs pointer-events-none">
                                  <Star className="h-2.5 w-2.5 fill-amber-300" />
                                  <span>{item.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="font-bold text-xs text-zinc-900 dark:text-white">
                                  {item.start_time}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                  {item.time_of_day}
                                </span>
                                {item.place_type && (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
                                    {item.place_type}
                                  </span>
                                )}
                              </div>

                              <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white leading-snug">
                                {item.place_slug ? (
                                  <Link
                                    href={`/travel/place/${item.place_slug}`}
                                    className="hover:text-zinc-600 dark:hover:text-zinc-300 inline-flex items-center gap-1.5 transition-colors"
                                  >
                                    <span>{item.title}</span>
                                    <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                  </Link>
                                ) : (
                                  item.title
                                )}
                              </h4>

                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                                {item.description}
                              </p>

                              {/* Duration, Cost and Explore Badge */}
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                                <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                                  <span className="flex items-center gap-1 font-medium">
                                    <Clock className="h-3 w-3 text-zinc-400" /> ~{item.duration_minutes} min
                                  </span>
                                  <span>•</span>
                                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                    Est. {item.estimated_cost}
                                  </span>
                                </div>

                                {item.place_slug && (
                                  <Link
                                    href={`/travel/place/${item.place_slug}`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:underline transition-colors"
                                  >
                                    <span>View Place Guide</span>
                                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Navigation Links */}
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                      Want to customize this journey further?
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Explore transportation options or suggest additional hidden gems in {tripPlan.destination_name}.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/travel/transport"
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-colors"
                    >
                      Buses & Transit
                    </Link>
                    <Link
                      href="/travel/suggest"
                      className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold shadow-2xs transition-colors"
                    >
                      Suggest Place
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs p-8">
                <Compass className="h-8 w-8 text-zinc-400 mx-auto animate-spin" />
                <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                  Synthesizing Verified Cambodia Itinerary...
                </h3>
                <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
                  Pulling verified attractions, photos, opening times, and authentic
                  Khmer cuisine recommendations from our database.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
