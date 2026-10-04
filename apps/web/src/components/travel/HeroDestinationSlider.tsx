"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Compass,
  MapPin,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Navigation,
  Bus,
  Footprints,
  PlusCircle,
  Palmtree,
  Mountain,
  Waves,
  Globe2,
  Sparkles,
} from "lucide-react";
import { Destination } from "@/types";

interface HeroDestinationSliderProps {
  destinations: Destination[];
}

function getDestIcon(slug: string) {
  if (slug.includes("siem") || slug.includes("battambang"))
    return <Palmtree className="h-3.5 w-3.5" />;
  if (
    slug.includes("sihanouk") ||
    slug.includes("kep") ||
    slug.includes("koh") ||
    slug.includes("kampot")
  )
    return <Waves className="h-3.5 w-3.5" />;
  if (slug.includes("mondulkiri") || slug.includes("ratanakiri") || slug.includes("preah-vihear"))
    return <Mountain className="h-3.5 w-3.5" />;
  return <Globe2 className="h-3.5 w-3.5" />;
}

export function HeroDestinationSlider({ destinations }: HeroDestinationSliderProps) {
  // Filter destinations that have valid data and images from the database
  const validDests = React.useMemo(() => {
    if (!destinations || destinations.length === 0) return [];
    // Prioritize popular ones first, but keep full list from database
    const priority = [
      "siem-reap",
      "phnom-penh",
      "kampot",
      "sihanoukville",
      "battambang",
      "mondulkiri",
      "kep",
      "preah-vihear",
      "koh-kong",
      "ratanakiri",
    ];
    const sorted = [...destinations].sort((a, b) => {
      const idxA = priority.indexOf(a.slug);
      const idxB = priority.indexOf(b.slug);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
    // Top 8 destinations for the hero showcase
    return sorted.slice(0, 8);
  }, [destinations]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const slideDuration = 6000; // 6 seconds per slide
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [progress, setProgress] = useState(0);

  const currentDest = validDests[currentIndex] || validDests[0];

  const goToSlide = useCallback(
    (index: number) => {
      if (index === currentIndex || validDests.length <= 1) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setProgress(0);
      startTimeRef.current = Date.now();
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [currentIndex, validDests.length]
  );

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % validDests.length);
  }, [currentIndex, validDests.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentIndex - 1 + validDests.length) % validDests.length);
  }, [currentIndex, validDests.length, goToSlide]);

  // Autoplay ticker and progress animation
  useEffect(() => {
    if (!isPlaying || validDests.length <= 1) return;

    startTimeRef.current = Date.now();
    const interval = 50; // update progress every 50ms

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / slideDuration) * 100, 100);
      setProgress(pct);

      if (elapsed >= slideDuration) {
        nextSlide();
      }
    }, interval);

    return () => clearInterval(progressTimer);
  }, [isPlaying, currentIndex, validDests.length, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  if (!currentDest) return null;

  return (
    <section
      className="relative overflow-hidden bg-zinc-950 text-white border-b border-zinc-800"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      aria-roledescription="carousel"
      aria-label="Cambodia Destinations Showcase"
    >
      {/* ━━━ AMBIENT BACKDROP WITH SMOOTH CROSSFADE ━━━ */}
      {validDests.map((dest, idx) => (
        <div
          key={dest.id || dest.slug}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out pointer-events-none ${
            idx === currentIndex ? "opacity-35 scale-105" : "opacity-0 scale-100"
          }`}
          style={{
            backgroundImage: `url('${dest.hero_image_url || "/images/places/angkor-wat.jpg"}')`,
            filter: "blur(20px) brightness(0.4) saturate(1.2)",
            transformOrigin: "center center",
            transition: "opacity 1s ease-in-out, transform 8s ease-out",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/80 pointer-events-none" />

      {/* ━━━ MAIN CAROUSEL CONTENT CONTAINER ━━━ */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16 sm:pb-20">
        {/* Navigation Quick-Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium tracking-wide">
            <Compass className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
            <span className="text-zinc-300">Kingdom of Cambodia</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">Verified Database Travel Portal</span>
          </div>

          <div className="flex items-center gap-2">
            {[
              {
                href: "/travel/planner",
                icon: <Navigation className="h-3.5 w-3.5 text-teal-400" />,
                label: "Trip Planner",
              },
              {
                href: "/travel/transport",
                icon: <Bus className="h-3.5 w-3.5 text-blue-400" />,
                label: "Transit",
              },
              {
                href: "/travel/nearby",
                icon: <Footprints className="h-3.5 w-3.5 text-emerald-400" />,
                label: "Near Me",
              },
              {
                href: "/travel/suggest",
                icon: <PlusCircle className="h-3.5 w-3.5 text-purple-400" />,
                label: "Suggest",
              },
            ].map((btn) => (
              <Link
                key={btn.href}
                href={btn.href}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white border border-white/10 transition-all hover:-translate-y-0.5"
              >
                {btn.icon}
                <span>{btn.label}</span>
              </Link>
            ))}

            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors border border-white/10 cursor-pointer ml-1"
              title={isPlaying ? "Pause autoplay" : "Play autoplay"}
              aria-label={isPlaying ? "Pause autoplay" : "Play autoplay"}
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* ━━━ HERO SLIDE STAGE ━━━ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Slide Text & Actions (Left 6 Cols) */}
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5 z-10">
            {/* Province & Region Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                {getDestIcon(currentDest.slug)}
                <span>{currentDest.name_km || "កម្ពុជា"}</span>
              </span>

              {currentDest.best_time_to_visit && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-zinc-300 bg-white/5 border border-white/10 backdrop-blur-md">
                  <Calendar className="h-3.5 w-3.5 text-teal-400" />
                  <span>{currentDest.best_time_to_visit}</span>
                </span>
              )}

              <span className="text-[11px] font-semibold text-zinc-400 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
                {currentIndex + 1} / {validDests.length}
              </span>
            </div>

            {/* Destination Name with Smooth Entrance Transition */}
            <div key={`title-${currentDest.slug}`} className="space-y-2 animate-fade-in">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
                {currentDest.name}
              </h1>
              <p className="text-sm sm:text-base text-zinc-300 font-normal leading-relaxed line-clamp-3 max-w-xl">
                {currentDest.overview ||
                  "Discover authentic cultural landmarks, ancient architectural heritage, and scenic natural wonders verified across Cambodia."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/travel/${currentDest.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-sm hover:bg-zinc-100 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 group cursor-pointer"
              >
                <span>Explore {currentDest.name}</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              <Link
                href={`/travel/planner?destination=${currentDest.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/15 backdrop-blur-md hover:-translate-y-0.5 cursor-pointer"
              >
                <Navigation className="h-4 w-4 text-teal-400" />
                <span>Plan Trip Here</span>
              </Link>
            </div>

            {/* Slide Navigation Controls */}
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={prevSlide}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/15 hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Previous destination"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextSlide}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/15 hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Next destination"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* Autoplay Progress Line */}
              <div className="flex-1 max-w-[200px] h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-teal-400 rounded-full transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <span className="text-xs text-zinc-400 font-mono">
                0{currentIndex + 1} / 0{validDests.length}
              </span>
            </div>
          </div>

          {/* Slide Visual Card with Ken Burns Zoom (Right 6 Cols) */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[16/10] sm:aspect-[16/10] rounded-3xl overflow-hidden border border-white/15 shadow-2xl bg-zinc-900 group">
              {validDests.map((dest, idx) => (
                <div
                  key={`slide-img-${dest.id || dest.slug}`}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <img
                    src={dest.hero_image_url || "/images/destinations/siem-reap.jpg"}
                    alt={dest.name}
                    className={`w-full h-full object-cover transition-transform ease-out ${
                      idx === currentIndex ? "scale-105 duration-[6000ms]" : "scale-100 duration-500"
                    }`}
                  />
                  {/* Subtle inner vignettes */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/20" />

                  {/* Corner Badge */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-950/70 backdrop-blur-md text-white border border-white/15">
                      <MapPin className="h-3.5 w-3.5 text-amber-400" />
                      {dest.name}, Cambodia
                    </span>
                    <span className="text-[11px] font-medium text-zinc-300 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                      Verified Data
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ━━━ BOTTOM THUMBNAIL SELECTOR STRIP ━━━ */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3 text-xs text-zinc-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Featured Provincial Hubs (Direct Database Data)
            </span>
            <span className="hidden sm:inline text-zinc-400 text-[11px]">
              Click destination to preview
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
            {validDests.map((dest, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={`thumb-${dest.id || dest.slug}`}
                  onClick={() => goToSlide(idx)}
                  className={`
                    relative rounded-xl overflow-hidden aspect-[4/3] text-left transition-all duration-300 cursor-pointer group
                    ${
                      isActive
                        ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-zinc-950 scale-102 shadow-lg"
                        : "opacity-60 hover:opacity-100 hover:scale-101 border border-white/10"
                    }
                  `}
                  title={`View ${dest.name}`}
                >
                  <img
                    src={dest.hero_image_url || "/images/destinations/siem-reap.jpg"}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute bottom-1.5 left-2 right-2 truncate">
                    <p className="text-[11px] font-bold text-white truncate leading-tight">
                      {dest.name}
                    </p>
                    <p className="text-[9px] text-zinc-300 truncate">
                      {dest.name_km || "កម្ពុជា"}
                    </p>
                  </div>
                  {isActive && (
                    <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
