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
  ArrowRight,
  Sliders,
  Luggage,
  Landmark,
  Coffee,
  Mountain,
  Check,
} from "lucide-react";
import { generateTripPlan, getDestinations } from "@/lib/api";
import { Destination, TripPlanResponse } from "@/types";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Photo } from "@/components/ui/photo";
import { CategoryMark } from "@/components/ui/category-mark";
import { useI18n } from "@/lib/i18n";
import { cleanText, humanize } from "@/lib/format";
import plannerOptions from "@/data/planner_options.json";

const STYLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Landmark,
  Coffee,
  Mountain,
  Sparkles,
};

const TRAVEL_STYLES = plannerOptions.travel_styles.map((s) => ({
  ...s,
  icon: STYLE_ICONS[s.icon] || Landmark,
}));

const BUDGET_OPTIONS = plannerOptions.budget_options;
const INTEREST_TAGS = plannerOptions.interest_tags;
const FEATURED_PROVINCES = plannerOptions.featured_provinces;

const DAY_TABS = ["ALL", ...Array.from({ length: 7 }, (_, i) => i + 1)];

/** Shared option-pill classes: ink when selected, hairline paper otherwise. */
function optionClasses(isSelected: boolean) {
  return `inline-flex min-h-8 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
    isSelected
      ? "border-transparent bg-primary text-primary-foreground"
      : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
  }`;
}

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

  const { lang } = useI18n();

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

  // Kept for parity with the province search state above.
  void filteredDestinations;

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      {/* ━━━ 1. EDITORIAL HERO ━━━ */}
      <Section className="border-b border-border py-12 sm:py-16">
        <Container>
          <CategoryMark category="travel" tone="dot">
            Trip Planner
          </CategoryMark>
          <h1 className="mt-4 max-w-3xl font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Plan a day-by-day Cambodia itinerary
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Choose a province, length of stay and travel style, and we assemble a
            multi-day route from the destinations and places in our database.
          </p>
        </Container>
      </Section>

      {/* ━━━ 2. MAIN PLANNER WORKSPACE ━━━ */}
      <Container className="mt-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT: Controls form */}
          <div className="lg:col-span-5">
            <Card className="space-y-6 p-5 sm:p-6 lg:sticky lg:top-6">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
                  <Sliders className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Customize your trip
                </h2>
                <span className="section-label shrink-0">
                  {durationDays} {durationDays === 1 ? "day" : "days"}
                </span>
              </div>

              {/* 1. Destination */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="destination-select"
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-foreground"
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    Destination province
                  </label>
                  {destinations.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {destinations.length} available
                    </span>
                  )}
                </div>

                <Select
                  id="destination-select"
                  value={destinationSlug}
                  onChange={(e) => handleSelectProvince(e.target.value)}
                >
                  {destinations.length > 0 ? (
                    destinations.map((dest) => (
                      <option key={dest.id || dest.slug} value={dest.slug}>
                        {dest.name}
                        {lang === "km" && dest.name_km ? ` (${dest.name_km})` : ""}
                      </option>
                    ))
                  ) : (
                    <option value="siem-reap">Siem Reap</option>
                  )}
                </Select>

                {FEATURED_PROVINCES.length > 0 && (
                  <div className="mt-3">
                    <div className="section-label mb-2">Popular destinations</div>
                    <div className="flex flex-wrap gap-2">
                      {FEATURED_PROVINCES.map((slug) => {
                        const found = destinations.find((d) => d.slug === slug);
                        const isSelected = destinationSlug === slug;
                        return (
                          <button
                            key={slug}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => handleSelectProvince(slug)}
                            className={optionClasses(isSelected)}
                          >
                            {found ? found.name : humanize(slug)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Duration */}
              <div>
                <label
                  htmlFor="duration-range"
                  className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-foreground"
                >
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  Duration of stay
                </label>
                <div className="mb-3 grid grid-cols-7 gap-1.5">
                  {DAY_TABS.filter((t): t is number => t !== "ALL").map((num) => (
                    <button
                      key={num}
                      type="button"
                      aria-pressed={durationDays === num}
                      onClick={() => {
                        setDurationDays(num);
                        handleGeneratePlan(destinationSlug, num, travelStyle, budgetLevel, selectedInterests);
                      }}
                      className={optionClasses(durationDays === num)}
                    >
                      {num}d
                    </button>
                  ))}
                </div>
                <input
                  id="duration-range"
                  type="range"
                  min={1}
                  max={7}
                  value={durationDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value, 10);
                    setDurationDays(days);
                    handleGeneratePlan(destinationSlug, days, travelStyle, budgetLevel, selectedInterests);
                  }}
                  className="h-2 w-full cursor-pointer accent-primary"
                />
              </div>

              {/* 3. Travel style */}
              <div>
                <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-foreground">
                  <Luggage className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  Travel style &amp; pace
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TRAVEL_STYLES.map((style) => {
                    const Icon = style.icon;
                    const isSelected = travelStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setTravelStyle(style.id);
                          handleGeneratePlan(destinationSlug, durationDays, style.id, budgetLevel, selectedInterests);
                        }}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          isSelected
                            ? "border-transparent bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-border-strong"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {style.label}
                        </span>
                        <span className={`text-xs leading-snug ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {style.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Budget */}
              <div>
                <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-foreground">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  Budget tier
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {BUDGET_OPTIONS.map((b) => {
                    const isSelected = budgetLevel === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        aria-pressed={isSelected}
                        title={b.desc}
                        onClick={() => {
                          setBudgetLevel(b.id);
                          handleGeneratePlan(destinationSlug, durationDays, travelStyle, b.id, selectedInterests);
                        }}
                        className={`flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-md border px-2 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          isSelected
                            ? "border-transparent bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                        }`}
                      >
                        <span className="text-sm font-semibold">{b.label}</span>
                        <span className="text-xs font-normal opacity-80">{b.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Interests */}
              <div>
                <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  Activity highlights
                </span>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_TAGS.map((item) => {
                    const isSelected = selectedInterests.includes(item.label);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleInterestToggle(item.label)}
                        className={`inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          isSelected
                            ? "border-transparent bg-accent text-accent-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                        }`}
                      >
                        <span aria-hidden="true">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={loading}
                disabled={loading}
                onClick={() => handleGeneratePlan()}
              >
                {loading ? (
                  "Building your itinerary"
                ) : (
                  <>
                    <Compass className="h-4 w-4" aria-hidden="true" />
                    Generate itinerary
                  </>
                )}
              </Button>
            </Card>
          </div>

          {/* RIGHT: Plan results */}
          <div className="lg:col-span-7">
            {loading && !tripPlan ? (
              <div className="space-y-6">
                <Card className="h-44 animate-pulse border-border bg-card p-6">
                  <div className="space-y-3">
                    <div className="h-4 w-1/4 rounded-sm bg-surface-muted" />
                    <div className="h-8 w-3/4 rounded-sm bg-surface-muted" />
                    <div className="h-4 w-full rounded-sm bg-surface-muted" />
                  </div>
                </Card>
              </div>
            ) : tripPlan ? (
              <div className="space-y-6">
                {/* Result header */}
                <Card>
                  <Photo
                    src={currentDestination?.hero_image_url}
                    alt={tripPlan.destination_name}
                    ratio="16/9"
                    radius="none"
                    showCredit={false}
                    placeholderLabel="Photo not verified yet"
                  />

                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground">
                          {tripPlan.destination_name}
                        </h2>
                        {lang === "km" && currentDestination?.name_km && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {currentDestination.name_km}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/travel/${tripPlan.destination_slug}`}
                        className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
                      >
                        Explore province
                        <ArrowRight
                          size={15}
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover:translate-x-0.5"
                        />
                      </Link>
                    </div>

                    {tripPlan.summary && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {cleanText(tripPlan.summary)}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          <Calendar size={13} aria-hidden="true" />
                          {tripPlan.duration_days} {tripPlan.duration_days === 1 ? "day" : "days"}
                        </Badge>
                        {tripPlan.travel_style && (
                          <Badge variant="secondary">{humanize(tripPlan.travel_style)}</Badge>
                        )}
                        {tripPlan.budget_level && (
                          <Badge variant="secondary">
                            <DollarSign size={13} aria-hidden="true" />
                            {tripPlan.budget_level}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={handleSaveTrip}>
                          {savedSuccess ? (
                            <Check size={14} aria-hidden="true" />
                          ) : (
                            <Bookmark size={14} aria-hidden="true" />
                          )}
                          {savedSuccess ? "Saved" : "Save"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handleCopyShareLink}>
                          <Share2 size={14} aria-hidden="true" />
                          {copiedLink ? "Copied" : "Share"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
                          <Printer size={14} aria-hidden="true" />
                          Print
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Day filter tabs */}
                {tripPlan.days.length > 1 && (
                  <div className="no-scrollbar -mx-2 overflow-x-auto px-2">
                    <div role="tablist" aria-label="Filter itinerary by day" className="flex w-max items-center gap-2">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={selectedDayTab === "ALL"}
                        onClick={() => setSelectedDayTab("ALL")}
                        className={`inline-flex min-h-8 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                          selectedDayTab === "ALL"
                            ? "border-transparent bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                        }`}
                      >
                        All days ({tripPlan.days.length})
                      </button>
                      {tripPlan.days.map((day) => (
                        <button
                          key={day.day_number}
                          type="button"
                          role="tab"
                          aria-selected={selectedDayTab === day.day_number}
                          onClick={() => setSelectedDayTab(day.day_number)}
                          className={`inline-flex min-h-8 items-center whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                            selectedDayTab === day.day_number
                              ? "border-transparent bg-primary text-primary-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
                          }`}
                        >
                          Day {day.day_number}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Day-by-day itinerary */}
                <div className="space-y-6">
                  {displayedDays.map((day) => (
                    <Card key={day.day_number} className="p-5 sm:p-6">
                      <div className="mb-5 flex items-start justify-between gap-3 border-b border-border pb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                            {day.day_number}
                          </span>
                          <div>
                            <h3 className="font-display text-lg leading-snug tracking-tight text-foreground">
                              {day.title}
                            </h3>
                            {day.theme && (
                              <p className="mt-0.5 text-sm text-muted-foreground">{day.theme}</p>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {day.items.length} {day.items.length === 1 ? "stop" : "stops"}
                        </span>
                      </div>

                      {day.items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No stops recorded for this day yet.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {day.items.map((item, idx) => (
                            <div
                              key={`${day.day_number}-${item.place_slug || item.title}-${idx}`}
                              className="group flex flex-col gap-4 rounded-lg border border-border bg-surface-muted/40 p-4 sm:flex-row"
                            >
                              <div className="w-full shrink-0 sm:w-32">
                                <Photo
                                  src={item.hero_image_url}
                                  alt={item.title}
                                  ratio="4/3"
                                  radius="md"
                                  showCredit={false}
                                  placeholderLabel="Photo not verified yet"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                  {item.start_time && (
                                    <span className="text-xs font-semibold text-foreground">
                                      {item.start_time}
                                    </span>
                                  )}
                                  {item.time_of_day && (
                                    <CategoryMark category="travel" tone="text">
                                      {humanize(item.time_of_day)}
                                    </CategoryMark>
                                  )}
                                  {item.place_type && (
                                    <Badge variant="outline" size="sm">
                                      {humanize(item.place_type)}
                                    </Badge>
                                  )}
                                </div>

                                <h4 className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                                  {item.place_slug ? (
                                    <Link
                                      href={`/travel/place/${item.place_slug}`}
                                      className="inline-flex items-center gap-1.5 transition-colors hover:text-accent"
                                    >
                                      <span>{item.title}</span>
                                      <ArrowRight
                                        size={14}
                                        aria-hidden="true"
                                        className="transition-transform duration-300 group-hover:translate-x-0.5"
                                      />
                                    </Link>
                                  ) : (
                                    item.title
                                  )}
                                </h4>

                                {item.description && (
                                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    {cleanText(item.description)}
                                  </p>
                                )}

                                {(item.duration_minutes > 0 || item.estimated_cost) && (
                                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                      {item.duration_minutes > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Clock size={13} aria-hidden="true" />
                                          {item.duration_minutes} min
                                        </span>
                                      )}
                                      {item.estimated_cost && (
                                        <span className="font-medium text-foreground">
                                          {item.estimated_cost}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                {/* Footer links */}
                <Card className="flex flex-col items-center justify-between gap-4 bg-secondary/50 p-5 sm:flex-row sm:p-6">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Want to customize this journey further?
                    </h4>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Check transport options or suggest a place to add in {tripPlan.destination_name}.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/travel/transport">Buses &amp; transit</Link>
                    </Button>
                    <Button variant="primary" size="sm" asChild>
                      <Link href="/travel/suggest">Suggest a place</Link>
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-10 text-center">
                <Compass className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  Ready when you are
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Adjust the options on the left and select “Generate itinerary” to build
                  a day-by-day plan for this province.
                </p>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
