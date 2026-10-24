"use client";

import * as React from "react";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import type { Destination } from "@/types";
import { useJourneyCopy } from "./copy";
import { useMediaQuery, useOnScreen, useReducedMotionPref } from "./hooks";
import { JourneyImage } from "./JourneyImage";
import { MAP_H, MAP_W, arcPath, landShapes, projectDestinations, type MapPoint } from "./geo";

/**
 * The route the scene follows, in story order: the temples of the north-west, down to the
 * capital and the coast, then up the Mekong into the highlands. A slug that is missing from
 * the data, or has no recorded coordinates, is skipped rather than guessed.
 */
const ROUTE = [
  "siem-reap",
  "battambang",
  "phnom-penh",
  "kampot",
  "sihanoukville",
  "kratie",
  "mondulkiri",
  "ratanakiri",
];

const TILT = 52;

function RouteSegment({ d, index, progress }: { d: string; index: number; progress: MotionValue<number> }) {
  const pathLength = useTransform(progress, [index, index + 1], [0, 1], { clamp: true });
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="url(#tvd-route)"
      strokeWidth="4"
      strokeLinecap="round"
      style={{ pathLength }}
    />
  );
}

/**
 * Scene B — the discovery map.
 *
 * Scrollytelling with native scroll: the stop cards are ordinary blocks in the page flow, and a
 * stylised map sits beside them (desktop) or above them (mobile) with `position: sticky`, so
 * there is no JS pinning to break and the scene behaves identically scrolling up or down. The
 * map is a CSS-3D plane — layered SVG at different depths under a perspective tilt — rather than
 * WebGL: the effect is a camera over terrain, it costs no GPU context, and it degrades to a flat
 * map wherever 3D transforms are unavailable.
 *
 * The route draws itself segment by segment from the scroll position, and the camera glides to
 * the stop whose card is in the middle of the viewport.
 */
export function DiscoveryScene({ destinations }: { destinations: Destination[] }) {
  const { copy, lang, num } = useJourneyCopy();
  const reduce = useReducedMotionPref();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const sectionRef = React.useRef<HTMLElement>(null);
  const stepsRef = React.useRef<HTMLOListElement>(null);
  const onScreen = useOnScreen(sectionRef);

  const projected = React.useMemo(() => projectDestinations(destinations), [destinations]);
  const allPoints = React.useMemo(() => Array.from(projected.values()), [projected]);
  const { land, contours } = React.useMemo(() => landShapes(allPoints), [allPoints]);

  const stops = React.useMemo(() => {
    const bySlug = new Map(destinations.map((d) => [d.slug, d]));
    return ROUTE.flatMap((slug) => {
      const dest = bySlug.get(slug);
      const point = projected.get(slug);
      return dest && point ? [{ dest, point }] : [];
    });
  }, [destinations, projected]);

  const segments = React.useMemo(
    () => stops.slice(1).map((s, i) => arcPath(stops[i].point, s.point, i % 2 ? -0.16 : 0.16)),
    [stops]
  );

  const { scrollYProgress } = useScroll({ target: stepsRef, offset: ["start 55%", "end 55%"] });
  const span = Math.max(stops.length - 1, 1);
  const routeProgress = useTransform(scrollYProgress, (v) => (reduce ? span : v * span * 1.04));
  const [active, setActive] = React.useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(stops.length - 1, Math.max(0, Math.round(v * span)));
    setActive((cur) => (cur === next ? cur : next));
  });

  if (stops.length < 2) return null;

  const focus: MapPoint = stops[active]?.point ?? stops[0].point;
  const zoom = isDesktop ? 1.3 : 1.15;
  const camera = {
    x: `${zoom * (0.5 - focus.x / MAP_W) * 100}%`,
    y: `${zoom * (0.5 - focus.y / MAP_H) * 100}%`,
    scale: zoom,
  };
  const still = reduce || !onScreen;

  return (
    <section
      ref={sectionRef}
      id="tv-discovery"
      aria-labelledby="tv-discovery-title"
      data-active={onScreen ? "true" : "false"}
      className="tv-scene relative scroll-mt-16 bg-tv-night text-tv-ivory"
    >
      <div className="tv-discovery-bg pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="container-page relative pt-20 sm:pt-28">
        <div className="max-w-2xl">
          <p className="tv-eyebrow text-tv-gold-soft">{copy.discoveryLabel}</p>
          <h2 id="tv-discovery-title" className="mt-3 font-display text-3xl leading-tight tracking-tight sm:text-5xl">
            {copy.discoveryTitle}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-tv-ivory/75">{copy.discoveryLead}</p>
        </div>
      </div>

      <div className="container-page relative mt-10 grid grid-cols-1 lg:grid-cols-12 lg:gap-10">
        {/* ── The map: sticky above (mobile) or beside (desktop) the stops ─────────── */}
        <div className="sticky top-0 z-10 -mx-5 h-[46svh] bg-tv-night/95 lg:order-2 lg:col-span-7 lg:mx-0 lg:h-svh lg:bg-transparent">
          <div className="tv-map-mask relative flex h-full items-center justify-center overflow-hidden">
            <div
              role="img"
              aria-label={copy.mapLabel}
              className="tv-map-stage relative w-[min(118%,640px)] lg:w-full"
              style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}
            >
              <div className="tv-map-tilt absolute inset-0" style={{ transform: `rotateX(${TILT}deg)` }}>
                <motion.div
                  className="tv-map-plane absolute inset-0"
                  initial={false}
                  animate={camera}
                  transition={still ? { duration: 0 } : { type: "spring", stiffness: 40, damping: 18, mass: 1 }}
                >
                  <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
                    <defs>
                      <radialGradient id="tvd-land" cx="50%" cy="45%" r="60%">
                        <stop offset="0%" stopColor="#2f4a33" />
                        <stop offset="70%" stopColor="#1d3324" />
                        <stop offset="100%" stopColor="#14241a" />
                      </radialGradient>
                      <linearGradient id="tvd-route" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f3c46b" />
                        <stop offset="100%" stopColor="#e9894a" />
                      </linearGradient>
                    </defs>
                    <path d={land} fill="url(#tvd-land)" stroke="#d8b26a" strokeOpacity="0.35" strokeWidth="2" />
                    {contours.map((c, i) => (
                      <path key={i} d={c} fill="none" stroke="#cfe0c4" strokeOpacity={0.07 + i * 0.03} strokeWidth="1.4" />
                    ))}
                    {/* every plotted province, quietly */}
                    {allPoints.map((p) => (
                      <circle key={p.slug} cx={p.x} cy={p.y} r="4" fill="#f4ecd8" fillOpacity="0.28" />
                    ))}
                    {/* the full route, faint, then the travelled part drawn by the scroll */}
                    {segments.map((d, i) => (
                      <path key={`ghost-${i}`} d={d} fill="none" stroke="#f4ecd8" strokeOpacity="0.16" strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round" />
                    ))}
                    {segments.map((d, i) => (
                      <RouteSegment key={`seg-${i}`} d={d} index={i} progress={routeProgress} />
                    ))}
                  </svg>

                  {/* Stop markers stand up off the tilted plane */}
                  {stops.map(({ dest, point }, i) => {
                    const isActive = i === active;
                    const visited = i <= active;
                    return (
                      <div
                        key={dest.slug}
                        className="tv-pin absolute"
                        data-active={isActive ? "true" : "false"}
                        data-visited={visited ? "true" : "false"}
                        style={{ left: `${(point.x / MAP_W) * 100}%`, top: `${(point.y / MAP_H) * 100}%` }}
                      >
                        <span className="tv-pin-upright" style={{ transform: `translate(-50%, -100%) rotateX(-${TILT}deg)` }}>
                          <span className="tv-pin-label">{lang === "km" && dest.name_km ? dest.name_km : dest.name}</span>
                          <span className="tv-pin-stem" />
                        </span>
                        <span className="tv-pin-dot" />
                      </div>
                    );
                  })}

                  {/* Cloud layer floating above the terrain */}
                  <div className="tv-map-clouds absolute inset-0" aria-hidden="true">
                    <span className="tv-cloud" style={{ left: "12%", top: "20%" }} />
                    <span className="tv-cloud" style={{ left: "58%", top: "8%" }} />
                    <span className="tv-cloud" style={{ left: "70%", top: "62%" }} />
                  </div>
                </motion.div>
              </div>
            </div>

            <p className="absolute inset-x-5 bottom-3 text-center text-[0.68rem] leading-snug text-tv-ivory/55 lg:bottom-8">
              {copy.mapNote}
            </p>
          </div>
        </div>

        {/* ── The stops ───────────────────────────────────────────────────────────── */}
        <ol ref={stepsRef} className="relative lg:order-1 lg:col-span-5">
          {stops.map(({ dest }, i) => {
            const overview = lang === "km" && dest.overview_km ? dest.overview_km : dest.overview;
            const isActive = i === active;
            return (
              <li key={dest.slug} className="flex min-h-[70svh] items-center py-8 lg:min-h-[88svh]">
                <article
                  data-active={isActive ? "true" : "false"}
                  className="tv-stop-card w-full rounded-2xl p-5 sm:p-6"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="tv-eyebrow text-tv-gold-soft">
                      {copy.stop} {num(String(i + 1).padStart(2, "0"))} {copy.of} {num(String(stops.length).padStart(2, "0"))}
                    </p>
                    {dest.name_km && lang !== "km" && <span className="text-sm text-tv-ivory/60">{dest.name_km}</span>}
                  </div>

                  <h3 className="mt-2 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                    {lang === "km" && dest.name_km ? dest.name_km : dest.name}
                  </h3>

                  <div className="tv-stop-photo relative mt-4 aspect-[16/10] overflow-hidden rounded-xl bg-tv-ink">
                    <JourneyImage
                      src={dest.hero_image_url}
                      alt={dest.name}
                      sizes="(min-width: 1024px) 420px, 92vw"
                      label={copy.photoMissing}
                    />
                  </div>

                  {overview && <p className="mt-4 line-clamp-4 text-[0.95rem] leading-relaxed text-tv-ivory/80">{overview}</p>}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-tv-ivory/10 pt-4 text-sm">
                    {dest.best_time_to_visit ? (
                      <span className="inline-flex items-center gap-1.5 text-tv-ivory/65">
                        <Calendar size={14} aria-hidden="true" />
                        <span className="sr-only">{copy.bestTime}: </span>
                        {dest.best_time_to_visit}
                      </span>
                    ) : (
                      <span />
                    )}
                    <Link href={`/travel/${dest.slug}`} className="tv-link-gold group inline-flex items-center gap-1.5 font-semibold">
                      {copy.exploreHub}
                      <ArrowRight size={15} aria-hidden="true" className="link-nudge" />
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="h-16 sm:h-24" aria-hidden="true" />
    </section>
  );
}
