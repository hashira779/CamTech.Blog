"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Compass,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Navigation,
  Bus,
  Footprints,
  PlusCircle,
  MapPin,
} from "lucide-react";
import { Destination } from "@/types";
import { Container } from "@/components/ui/container";
import { PhotoFill } from "@/components/ui/photo-image";

interface HeroDestinationSliderProps {
  destinations: Destination[];
}

const QUICK_LINKS = [
  { href: "/travel/planner", icon: Navigation, label: "Trip planner" },
  { href: "/travel/transport", icon: Bus, label: "Buses & routes" },
  { href: "/travel/nearby", icon: Footprints, label: "Near me" },
  { href: "/travel/suggest", icon: PlusCircle, label: "Suggest a place" },
];

/**
 * The travel section cover: one province at a time, led by its photograph.
 *
 * The old version painted a blurred, saturated copy of the picture behind the whole section, ran a
 * teal-to-amber gradient through the progress bar, and — the part that mattered — substituted a
 * stock Angkor Wat frame for any province without its own verified photograph. Battambang was being
 * shown as Angkor. Slides now render through `PhotoFill`, so a province without verified imagery
 * shows the same honest "Photo not verified yet" tile as everywhere else on the site.
 * Autoplay, the play/pause control, arrow-key navigation and the thumbnail rail are unchanged.
 */
export function HeroDestinationSlider({ destinations }: HeroDestinationSliderProps) {
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
  const slideDuration = 6000; // 6 seconds per slide
  // Starts at 0 and is stamped by the autoplay effect below, which runs before the first tick —
  // calling Date.now() during render would make the component impure.
  const startTimeRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  const currentDest = validDests[currentIndex] || validDests[0];

  const goToSlide = useCallback(
    (index: number) => {
      if (index === currentIndex || validDests.length <= 1) return;
      setCurrentIndex(index);
      setProgress(0);
      startTimeRef.current = Date.now();
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

    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setProgress(Math.min((elapsed / slideDuration) * 100, 100));
      if (elapsed >= slideDuration) nextSlide();
    }, 50);

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
      className="paper-grain border-b border-border bg-surface-muted/60"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
      aria-roledescription="carousel"
      aria-label="Cambodia destinations"
    >
      <Container className="py-8 sm:py-12">
        {/* Masthead row: the section mark, the quiet utility links, the transport control */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border pb-4">
          <p className="section-label inline-flex items-center gap-2">
            <Compass size={14} aria-hidden="true" className="text-accent" />
            Travel — Kingdom of Cambodia
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <nav aria-label="Travel tools" className="hidden items-center gap-4 sm:flex">
              {QUICK_LINKS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-accent"
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause autoplay" : "Play autoplay"}
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-8 pt-8 lg:grid-cols-12 lg:gap-10">
          {/* ── Cover type ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="section-label text-accent">
                Province {currentIndex + 1} of {validDests.length}
              </span>
              {currentDest.name_km && (
                <span className="text-xs text-muted-foreground">{currentDest.name_km}</span>
              )}
            </div>

            <div key={`title-${currentDest.slug}`} className="animate-fade-in">
              <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                {currentDest.name}
              </h1>
              {currentDest.overview && (
                <p className="mt-3 line-clamp-3 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {currentDest.overview}
                </p>
              )}
            </div>

            {currentDest.best_time_to_visit && (
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground">Best time to visit</span>{" "}
                {currentDest.best_time_to_visit}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={`/travel/${currentDest.slug}`}
                className="group inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                Explore {currentDest.name}
                <ArrowRight
                  size={15}
                  aria-hidden="true"
                  className="link-nudge"
                />
              </Link>
              <Link
                href={`/travel/planner?destination=${currentDest.slug}`}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong px-5 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Navigation size={15} aria-hidden="true" />
                Plan a trip here
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous destination"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next destination"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <ChevronRight size={18} />
              </button>

              <span
                aria-hidden="true"
                className="ml-2 h-px flex-1 max-w-[200px] overflow-hidden bg-border"
              >
                <span
                  className="block h-px bg-accent transition-[width] duration-75"
                  style={{ width: `${progress}%` }}
                />
              </span>
            </div>
          </div>

          {/* ── Cover photograph ───────────────────────────────────────────── */}
          <div className="lg:col-span-7">
            <figure className="overflow-hidden rounded-2xl border border-border bg-card shadow-md sm:rounded-3xl">
              <div className="relative aspect-[3/2] bg-surface-muted">
                {validDests.map((dest, idx) => (
                  <div
                    key={`slide-${dest.id || dest.slug}`}
                    aria-hidden={idx !== currentIndex}
                    className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                      idx === currentIndex ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                  >
                    <PhotoFill
                      src={dest.hero_image_url}
                      alt={dest.name}
                      priority={idx === 0}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>

              <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border px-5 py-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                  <MapPin size={14} aria-hidden="true" className="text-accent" />
                  {currentDest.name}
                  {currentDest.country?.name ? `, ${currentDest.country.name}` : ""}
                </span>
                <span className="section-label tabular-nums">
                  {String(currentIndex + 1).padStart(2, "0")} / {String(validDests.length).padStart(2, "0")}
                </span>
              </figcaption>
            </figure>
          </div>
        </div>

        {/* ── Thumbnail rail ───────────────────────────────────────────────── */}
        <div className="mt-8 border-t border-border pt-6">
          <p className="section-label mb-4">Provincial hubs in this carousel</p>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {validDests.map((dest, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={`thumb-${dest.id || dest.slug}`}
                  type="button"
                  onClick={() => goToSlide(idx)}
                  aria-label={`View ${dest.name}`}
                  aria-current={isActive}
                  className={`group cursor-pointer overflow-hidden rounded-md border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                    isActive
                      ? "border-accent shadow-sm"
                      : "border-border opacity-70 hover:border-border-strong hover:opacity-100"
                  }`}
                >
                  <span className="block aspect-[4/3] bg-surface-muted">
                    <PhotoFill
                      src={dest.hero_image_url}
                      alt={dest.name}
                      compact
                      className="h-full w-full object-cover photo-zoom"
                    />
                  </span>
                  <span
                    className={`block truncate px-2 py-1.5 text-left text-xs font-medium ${
                      isActive ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    {dest.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
