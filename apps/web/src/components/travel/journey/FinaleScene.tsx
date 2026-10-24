"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Navigation, PlusCircle } from "lucide-react";
import type { Trip } from "@/types";
import { cleanText } from "@/lib/format";
import { useJourneyCopy } from "./copy";
import { JourneyImage } from "./JourneyImage";
import { templeBodyPoints, templeTowers, towerPoints, treeLine } from "./angkor-art";

const ease = [0.16, 1, 0.3, 1] as const;

const DUSK_TOWERS = templeTowers(800, 300, 0.62);
const DUSK_BODY = templeBodyPoints(800, 300, 0.62);
const DUSK_TREES = treeLine(304, 1600, 12, 2.6, 30);

/**
 * Scene F — the itineraries as a route, then the closing line.
 *
 * Each curated trip is a station on a vertical route whose line draws itself as the reader
 * scrolls; its published days hang off it as stops. Counts are the real rows (a trip with no
 * schedule says so), and every link is the trip's own page. The scene ends on the Angkor
 * silhouette from the hero, now at dusk, so the page closes the day it opened.
 */
export function FinaleScene({ trips }: { trips: Trip[] }) {
  const { copy, lang, num } = useJourneyCopy();
  const routeRef = React.useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: routeRef, offset: ["start 75%", "end 60%"] });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section aria-labelledby="tv-finale-title" className="tv-scene tv-finale relative overflow-hidden text-tv-ivory">
      <div className="container-page relative pt-20 sm:pt-28">
        {trips.length > 0 && (
          <>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="tv-eyebrow text-tv-gold-soft">{copy.finaleLabel}</p>
                <h2 className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-5xl">{copy.finaleTitle}</h2>
                <p className="mt-3 text-tv-ivory/70">{copy.finaleLead}</p>
              </div>
              <Link href="/travel/planner" className="tv-link-gold group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold">
                {copy.buildPlan}
                <ArrowRight size={15} aria-hidden="true" className="link-nudge" />
              </Link>
            </div>

            <ol ref={routeRef} className="relative mt-14 space-y-14 pl-10 sm:pl-16">
              {/* the route line, drawn by the scroll */}
              <span aria-hidden="true" className="absolute bottom-2 left-[0.6rem] top-2 w-px bg-tv-ivory/12 sm:left-[1.35rem]" />
              <motion.span
                aria-hidden="true"
                className="absolute bottom-2 left-[0.6rem] top-2 w-px origin-top bg-gradient-to-b from-tv-gold via-tv-amber to-tv-gold sm:left-[1.35rem]"
                style={{ scaleY: lineScale }}
              />

              {trips.map((trip, index) => {
                const title = cleanText(lang === "km" && trip.title_km ? trip.title_km : trip.title);
                const description = lang === "km" && trip.description_km ? trip.description_km : trip.description;
                const days = [...(trip.days ?? [])].sort((a, b) => a.day_number - b.day_number);
                return (
                  <li key={trip.id} className="relative">
                    <span aria-hidden="true" className="tv-route-node absolute -left-10 top-6 sm:-left-16" />
                    <motion.article
                      initial={{ opacity: 0, y: 28 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
                      transition={{ duration: 0.9, ease, delay: index * 0.05 }}
                      className="tv-trip group grid grid-cols-1 overflow-hidden rounded-2xl md:grid-cols-12"
                    >
                      <Link href={`/travel/trips/${trip.slug}`} aria-label={title} tabIndex={-1} className="relative block aspect-[4/3] md:col-span-5 md:aspect-auto md:min-h-[320px]">
                        <div className="photo-zoom absolute inset-0">
                          <JourneyImage
                            src={trip.hero_image_url}
                            alt={title}
                            label={copy.photoMissing}
                            sizes="(min-width: 768px) 460px, 100vw"
                          />
                        </div>
                      </Link>

                      <div className="flex flex-col gap-3 p-6 sm:p-8 md:col-span-7">
                        <p className="tv-eyebrow text-tv-gold-soft">
                          {copy.days(trip.duration_days)}
                          {trip.travel_style ? ` · ${cleanText(trip.travel_style)}` : ""}
                          {trip.budget_level ? ` · ${cleanText(trip.budget_level)} ${copy.budget}` : ""}
                        </p>
                        <h3 className="font-display text-2xl leading-snug tracking-tight sm:text-3xl">
                          <Link
                            href={`/travel/trips/${trip.slug}`}
                            className="rounded-sm transition-colors hover:text-tv-gold-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tv-gold-soft"
                          >
                            {title}
                          </Link>
                        </h3>
                        {description && <p className="line-clamp-3 text-sm leading-relaxed text-tv-ivory/70">{cleanText(description)}</p>}

                        {days.length > 0 && (
                          <ol className="mt-2 space-y-0 border-l border-dashed border-tv-ivory/20">
                            {days.map((day, di) => (
                              <motion.li
                                key={day.id}
                                className="relative py-2 pl-5 text-sm"
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, ease, delay: 0.25 + di * 0.12 }}
                              >
                                <span aria-hidden="true" className="absolute -left-[5px] top-[0.95rem] h-2.5 w-2.5 rounded-full border-2 border-tv-gold bg-tv-night" />
                                <span className="mr-2 font-semibold text-tv-gold-soft">
                                  {copy.day} {num(day.day_number)}
                                </span>
                                <span className="text-tv-ivory/80">{cleanText(day.title.replace(/^Day\s*\d+\s*[:\-–]\s*/i, ""))}</span>
                              </motion.li>
                            ))}
                          </ol>
                        )}

                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-tv-ivory/10 pt-4 text-xs text-tv-ivory/60">
                          <span className="tabular-nums">
                            {days.length > 0 ? copy.scheduledDays(days.length) : copy.noSchedule}
                          </span>
                          <Link
                            href={`/travel/trips/${trip.slug}`}
                            className="tv-link-gold group/cta inline-flex items-center gap-1 text-sm font-semibold"
                          >
                            {copy.viewItinerary}
                            <ArrowRight size={14} aria-hidden="true" className="transition-transform duration-300 group-hover/cta:translate-x-0.5" />
                          </Link>
                        </div>
                      </div>
                    </motion.article>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        {/* ── Closing ─────────────────────────────────────────────────────── */}
        <div className="relative mx-auto flex max-w-3xl flex-col items-center pb-10 pt-28 text-center sm:pt-36">
          <span aria-hidden="true" className="tv-lotus" />
          <motion.h2
            id="tv-finale-title"
            className={`mt-6 font-display text-tv-ivory ${lang === "km" ? "text-3xl leading-[1.5] sm:text-5xl" : "text-4xl leading-[1.05] tracking-tight sm:text-6xl"}`}
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 1.2, ease }}
          >
            {copy.closingTitle}
          </motion.h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-tv-ivory/75">{copy.closingLead}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/travel/planner" className="tv-btn tv-btn-gold">
              <Navigation size={15} aria-hidden="true" />
              {copy.startPlanning}
            </Link>
            <Link href="/travel/suggest" className="tv-btn tv-btn-ghost">
              <PlusCircle size={15} aria-hidden="true" />
              {copy.suggestPlace}
            </Link>
          </div>
        </div>
      </div>

      {/* The hero's temple, at dusk */}
      <svg viewBox="0 0 1600 340" preserveAspectRatio="xMidYMax slice" className="relative block h-[150px] w-full sm:h-[220px]" aria-hidden="true">
        <defs>
          <radialGradient id="tvf-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffcf8a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e07a35" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="800" cy="300" r="260" fill="url(#tvf-sun)" opacity="0.55" />
        <polygon points={DUSK_BODY} fill="#120d0b" />
        {DUSK_TOWERS.map((t, i) => (
          <polygon key={i} points={towerPoints(t.x, t.base, t.top, t.hw)} fill="#120d0b" />
        ))}
        <path d={DUSK_TREES} fill="#0d0a09" />
        <rect x="0" y="318" width="1600" height="22" fill="#0d0a09" />
      </svg>
    </section>
  );
}
