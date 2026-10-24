"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Destination } from "@/types";
import { useJourneyCopy } from "./copy";
import { useMediaQuery, useOnScreen, useReducedMotionPref } from "./hooks";
import { JourneyImage } from "./JourneyImage";
import { sugarPalm, towerPoints, treeLine } from "./angkor-art";

type WorldKey = "temples" | "islands" | "highlands" | "capital" | "countryside";

interface World {
  key: WorldKey;
  /** The provincial hub the panel opens. The link is only shown when that hub exists. */
  hub: string;
  title: { en: string; km: string };
  line: { en: string; km: string };
  /** Project photographs, each one already used by the directory for the place it names. */
  photos: { src: string; name: string }[];
}

const WORLDS: World[] = [
  {
    key: "temples",
    hub: "siem-reap",
    title: { en: "Temples", km: "ប្រាសាទ" },
    line: {
      en: "Sandstone towers, root-wrapped galleries and the hush before dawn at Angkor.",
      km: "កំពូលប្រាសាទថ្មភក់ ឫសឈើរុំថែវ និងភាពស្ងាត់មុនព្រលឹមនៅអង្គរ។",
    },
    photos: [
      { src: "/images/places/ta-prohm.jpg", name: "Ta Prohm" },
      { src: "/images/places/bayon-temple.jpg", name: "Bayon" },
    ],
  },
  {
    key: "islands",
    hub: "sihanoukville",
    title: { en: "Islands", km: "កោះ" },
    line: {
      en: "White-sand bays in the Gulf of Thailand, slow boats and water clear to the reef.",
      km: "ឆ្នេរខ្សាច់សនៅឈូងសមុទ្រថៃ ទូកយឺតៗ និងទឹកថ្លារហូតដល់ថ្មប៉ប្រះទឹក។",
    },
    photos: [
      { src: "/images/places/saracen-bay-koh-rong-sanloem.jpg", name: "Saracen Bay, Koh Rong Sanloem" },
      { src: "/images/destinations/kep.jpg", name: "Kep" },
    ],
  },
  {
    key: "highlands",
    hub: "mondulkiri",
    title: { en: "Jungles & highlands", km: "ព្រៃ និងខ្ពង់រាប" },
    line: {
      en: "Rolling grassland, crater lakes and waterfalls in the cool north-east.",
      km: "វាលស្មៅរលកៗ បឹងភ្នំភ្លើង និងទឹកធ្លាក់នៅភាគឦសានដ៏ត្រជាក់។",
    },
    photos: [
      { src: "/images/places/yeak-laom-volcanic-lake.jpg", name: "Yeak Laom Lake, Ratanakiri" },
      { src: "/images/places/bousra-waterfall.jpg", name: "Bousra Waterfall, Mondulkiri" },
    ],
  },
  {
    key: "capital",
    hub: "phnom-penh",
    title: { en: "Phnom Penh", km: "ភ្នំពេញ" },
    line: {
      en: "Golden palace spires where the Mekong meets the Tonlé Sap, and a city that never sits still.",
      km: "កំពូលព្រះបរមរាជវាំងពណ៌មាស នៅចំណុចប្រសព្វទន្លេមេគង្គ និងទន្លេសាប។",
    },
    photos: [
      { src: "/images/places/royal-palace-phnom-penh.jpg", name: "Royal Palace, Phnom Penh" },
      { src: "/images/destinations/phnom-penh.jpg", name: "Phnom Penh" },
    ],
  },
  {
    key: "countryside",
    hub: "battambang",
    title: { en: "Countryside", km: "ជនបទ" },
    line: {
      en: "Rice paddies under sugar palms, stilt houses and the bamboo train's old line.",
      km: "វាលស្រែក្រោមដើមត្នោត ផ្ទះឈើខ្ពស់ និងផ្លូវរថភ្លើងឫស្សីចាស់។",
    },
    photos: [
      { src: "/images/destinations/battambang.jpg", name: "Battambang" },
      { src: "/images/places/phnom-sampeau-battambang.jpg", name: "Phnom Sampeau, Battambang" },
    ],
  },
];

/** A small atmospheric backdrop per world, drawn in the same hand as the hero. */
function WorldArt({ world }: { world: WorldKey }) {
  const W = 1200;
  const H = 800;
  switch (world) {
    case "temples":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
          <path d={treeLine(560, W, 60, 2.2, 40)} fill="#163323" opacity="0.7" />
          {[300, 470, 640, 820].map((x, i) => (
            <polygon key={x} points={towerPoints(x, 640, 330 + (i % 2) * 70, 46)} fill="#0f2419" opacity="0.85" />
          ))}
          <path d={treeLine(660, W, 40, 5.1, 30)} fill="#0a1a11" />
        </svg>
      );
    case "islands":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
          <path d="M520,560 C600,470 700,440 800,470 C880,495 940,530 1000,560 Z" fill="#0f4a4e" opacity="0.65" />
          <path d="M760,560 C820,520 900,505 960,525 C1010,540 1060,552 1120,560 Z" fill="#0b3b3f" opacity="0.8" />
          <rect x="0" y="560" width={W} height={H - 560} fill="#0b3036" opacity="0.55" />
          {[600, 640, 690, 750].map((y, i) => (
            <line key={y} x1={140 + i * 60} y1={y} x2={520 + i * 90} y2={y} stroke="#bfe9e2" strokeOpacity={0.22 - i * 0.04} strokeWidth="2" />
          ))}
        </svg>
      );
    case "highlands":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
          <path d="M0,520 C200,420 360,380 520,450 C680,520 820,360 1000,400 C1100,420 1160,450 1200,470 L1200,800 L0,800 Z" fill="#2b4a35" opacity="0.55" />
          <path d="M0,600 C180,520 380,500 560,560 C740,620 900,520 1200,560 L1200,800 L0,800 Z" fill="#1c3626" opacity="0.8" />
          <path d={treeLine(690, W, 30, 3.3, 24)} fill="#0f2117" />
        </svg>
      );
    case "capital": {
      const spire = (x: number, h: number, w: number) =>
        `M${x - w},640 L${x - w},${640 - h * 0.35} L${x - w * 0.6},${640 - h * 0.45} L${x - w * 0.35},${640 - h * 0.7} L${x},${640 - h} L${x + w * 0.35},${640 - h * 0.7} L${x + w * 0.6},${640 - h * 0.45} L${x + w},${640 - h * 0.35} L${x + w},640 Z`;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
          <path d="M120,640 L120,560 L260,560 L260,520 L420,520 L420,600 L560,600 L560,540 L700,540 L700,640 Z" fill="#2a1f2c" opacity="0.6" />
          <path d={spire(780, 300, 70)} fill="#22161f" />
          <path d={spire(930, 200, 46)} fill="#22161f" opacity="0.9" />
          <path d="M640,640 L700,590 L860,590 L920,640 Z" fill="#22161f" />
          <rect x="0" y="640" width={W} height={H - 640} fill="#3a2a2c" opacity="0.6" />
          <line x1="200" y1="690" x2="1000" y2="690" stroke="#f3c46b" strokeOpacity="0.25" strokeWidth="2" />
        </svg>
      );
    }
    case "countryside": {
      const palms = [sugarPalm(820, 600, 300, 10, 7), sugarPalm(930, 610, 240, -8, 8), sugarPalm(260, 610, 220, 6, 9)];
      return (
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
          {[600, 640, 690, 750].map((y, i) => (
            <path key={y} d={`M0,${y} C300,${y - 14} 900,${y + 12} 1200,${y - 6} L1200,${y + 60} L0,${y + 60} Z`} fill={i % 2 ? "#5d6b2c" : "#6f7d33"} opacity={0.35 + i * 0.12} />
          ))}
          {palms.map((p, i) => (
            <g key={i} fill="#2b2a14" opacity="0.85">
              <path d={p.trunk} />
              <path d={p.fronds} />
            </g>
          ))}
        </svg>
      );
    }
  }
}

/**
 * Scene C — five worlds.
 *
 * Desktop with motion: a tall section whose sticky stage translates a horizontal track as the
 * page scrolls vertically, so the reader keeps using the wheel, trackpad or keyboard as normal
 * and the scene reverses exactly when they scroll back. The stage uses `overflow: clip`, which
 * the browser cannot scroll on its own when a link inside receives focus; a focus handler
 * instead scrolls the page to the scroll position that brings that panel on screen.
 *
 * Mobile and reduced motion: the same panels stacked vertically, nothing pinned.
 */
export function WorldsScene({ destinations }: { destinations: Destination[] }) {
  const { copy, lang, num } = useJourneyCopy();
  const reduce = useReducedMotionPref();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const horizontal = isDesktop && !reduce;

  const sectionRef = React.useRef<HTMLElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(sectionRef);
  const [distance, setDistance] = React.useState(0);

  const hubs = React.useMemo(() => new Set(destinations.map((d) => d.slug)), [destinations]);

  React.useEffect(() => {
    if (!horizontal) return;
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [horizontal]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.04, 0.96], [0, -distance], { clamp: true });
  const barScale = useTransform(scrollYProgress, [0.04, 0.96], [0, 1], { clamp: true });

  const onFocusCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!horizontal || !sectionRef.current) return;
    const panel = (e.target as HTMLElement).closest<HTMLElement>("[data-world-index]");
    if (!panel) return;
    const index = Number(panel.dataset.worldIndex);
    const section = sectionRef.current;
    // After the browser's own focus scrolling has run, or it would undo this.
    window.setTimeout(() => {
      const rect = section.getBoundingClientRect();
      const scrollable = section.offsetHeight - window.innerHeight;
      const top = window.scrollY + rect.top + scrollable * (0.04 + 0.92 * (index / Math.max(WORLDS.length - 1, 1)));
      window.scrollTo({ top, behavior: "auto" });
    }, 0);
  };

  const panels = WORLDS.map((world, i) => {
    const photo = world.photos[0];
    const second = world.photos[1];
    return (
      <article
        key={world.key}
        data-world-index={i}
        aria-labelledby={`tv-world-${world.key}`}
        className={`tv-world tv-world-${world.key} relative flex shrink-0 overflow-hidden rounded-[1.75rem] ${
          horizontal ? "h-[74svh] w-[min(78vw,1080px)]" : "min-h-[82svh] w-full"
        }`}
      >
        <div aria-hidden="true" className="tv-world-sky absolute inset-0" />
        <div aria-hidden="true" className="absolute inset-0">
          <WorldArt world={world.key} />
        </div>
        <div aria-hidden="true" className="tv-world-haze absolute inset-0" />

        <div className="relative grid w-full grid-cols-1 gap-8 p-6 sm:p-10 lg:grid-cols-12 lg:items-end lg:p-12">
          <div className="flex flex-col justify-end lg:col-span-5 lg:pb-4">
            <p className="tv-eyebrow text-tv-ivory/70">
              {num(String(i + 1).padStart(2, "0"))} / {num(String(WORLDS.length).padStart(2, "0"))}
            </p>
            <h3 id={`tv-world-${world.key}`} className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-tv-ivory sm:text-6xl">
              {world.title[lang]}
            </h3>
            <p className="mt-4 max-w-md text-base leading-relaxed text-tv-ivory/85">{world.line[lang]}</p>
            <Link
              href={hubs.has(world.hub) ? `/travel/${world.hub}` : "/travel"}
              className="tv-btn tv-btn-glass group mt-6 self-start"
            >
              {copy.visit} {world.title[lang]}
              <ArrowRight size={15} aria-hidden="true" className="link-nudge" />
            </Link>
          </div>

          <div className="relative min-h-[260px] lg:col-span-7 lg:min-h-[360px]">
            <figure className="tv-postcard absolute right-0 top-0 aspect-[4/3] w-[78%] max-w-[460px] rotate-[1.5deg]">
              <div className="relative h-full w-full overflow-hidden rounded-lg">
                <JourneyImage src={photo.src} alt={photo.name} sizes="(min-width: 1024px) 460px, 70vw" />
              </div>
              <figcaption className="tv-postcard-caption">{photo.name}</figcaption>
            </figure>
            {second && (
              <figure className="tv-postcard absolute bottom-0 left-0 aspect-[4/3] w-[48%] max-w-[260px] -rotate-[3deg]">
                <div className="relative h-full w-full overflow-hidden rounded-lg">
                  <JourneyImage src={second.src} alt={second.name} sizes="(min-width: 1024px) 260px, 45vw" />
                </div>
                <figcaption className="tv-postcard-caption">{second.name}</figcaption>
              </figure>
            )}
          </div>
        </div>
      </article>
    );
  });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="tv-worlds-title"
      data-active={onScreen ? "true" : "false"}
      className="tv-scene tv-worlds relative text-tv-ivory"
      style={horizontal ? { height: `${WORLDS.length * 90 + 40}svh` } : undefined}
    >
      {horizontal ? (
        <div className="sticky top-0 flex h-svh flex-col justify-center overflow-clip">
          <div className="container-page flex items-end justify-between gap-6 pb-6 pt-16">
            <div>
              <p className="tv-eyebrow text-tv-gold-soft">{copy.worldsLabel}</p>
              <h2 id="tv-worlds-title" className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
                {copy.worldsTitle}
              </h2>
            </div>
            <div className="hidden w-56 flex-col items-end gap-2 text-right lg:flex">
              <span className="text-xs text-tv-ivory/60">{copy.worldsHint}</span>
              <span aria-hidden="true" className="block h-px w-full overflow-hidden bg-tv-ivory/15">
                <motion.span className="block h-px origin-left bg-tv-gold" style={{ scaleX: barScale }} />
              </span>
            </div>
          </div>
          <motion.div
            ref={trackRef}
            onFocusCapture={onFocusCapture}
            className="flex w-max gap-6 pl-[max(1.25rem,calc((100vw-78rem)/2+2rem))] pr-[11vw]"
            style={{ x }}
          >
            {panels}
          </motion.div>
        </div>
      ) : (
        <div className="container-page py-20 sm:py-28">
          <p className="tv-eyebrow text-tv-gold-soft">{copy.worldsLabel}</p>
          <h2 id="tv-worlds-title" className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            {copy.worldsTitle}
          </h2>
          <p className="mt-3 text-tv-ivory/70">{copy.worldsLead}</p>
          <div className="mt-10 flex flex-col gap-6">{panels}</div>
        </div>
      )}
    </section>
  );
}
