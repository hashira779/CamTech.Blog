"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Bus, Footprints, Navigation, PlusCircle } from "lucide-react";
import { useJourneyCopy } from "./copy";
import { useOnScreen, useReducedMotionPref } from "./hooks";
import { sugarPalm, templeBodyPoints, templeTowers, towerPoints, treeLine } from "./angkor-art";

const VB_W = 1600;
const VB_H = 900;
const GROUND = 724;
const SCALE = 0.8;

const TOWERS = templeTowers(VB_W / 2, GROUND, SCALE);
const BODY = templeBodyPoints(VB_W / 2, GROUND, SCALE);
const FAR_TREES = treeLine(GROUND - 4, VB_W, 16, 1.3);
const NEAR_TREES = treeLine(GROUND + 6, VB_W, 10, 4.1, 34);
const PALMS_LEFT = [sugarPalm(150, VB_H, 600, 18, 1), sugarPalm(300, VB_H, 470, -10, 2), sugarPalm(40, VB_H, 380, 6, 3)];
const PALMS_RIGHT = [sugarPalm(1450, VB_H, 560, -16, 4), sugarPalm(1320, VB_H, 420, 12, 5), sugarPalm(1570, VB_H, 400, -4, 6)];

const ease = [0.16, 1, 0.3, 1] as const;

function Temple({ id }: { id: string }) {
  return (
    <g>
      <polygon points={BODY} fill={`url(#${id}-stone)`} />
      {TOWERS.map((t, i) => (
        <polygon key={i} points={towerPoints(t.x, t.base, t.top, t.hw)} fill={`url(#${id}-stone)`} />
      ))}
      {/* Sun-catching rim along the terraces */}
      <polyline
        points={BODY}
        fill="none"
        stroke="#f6c27a"
        strokeOpacity="0.18"
        strokeWidth="1.2"
      />
    </g>
  );
}

/**
 * Scene A — Angkor at sunrise.
 *
 * A 200vh section with a sticky stage. Native scroll drives everything: as the reader scrolls,
 * the camera pushes into the temple, the palms part past the lens, the mist thickens and a veil
 * fades the stage into the charcoal the discovery scene opens on, so the two read as one shot.
 * On mount the sun rises and the headline arrives word by word.
 *
 * Reduced motion: a single still frame, 100svh tall, no pinning, no drift, nothing withheld.
 */
export function JourneyHero() {
  const { copy, lang } = useJourneyCopy();
  const reduce = useReducedMotionPref();
  const sectionRef = React.useRef<HTMLElement>(null);
  const onScreen = useOnScreen(sectionRef, "0px");
  const [headerH, setHeaderH] = React.useState(0);

  // The stage is a full viewport, pinned under the sticky masthead. On first load the unfolded
  // masthead pushes the stage's lower edge below the fold, so the bottom copy is lifted by the
  // masthead's height. Measured once (and on a width change near the top) rather than tracked,
  // so the masthead folding later never moves anything.
  React.useLayoutEffect(() => {
    const measure = () => setHeaderH(document.querySelector("header")?.getBoundingClientRect().height ?? 0);
    measure();
    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth !== lastW) {
        lastW = window.innerWidth;
        if (window.scrollY < 40) measure();
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });

  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.42]);
  const sceneY = useTransform(scrollYProgress, [0, 1], ["0%", "6%"]);
  const sunY = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const skyY = useTransform(scrollYProgress, [0, 1], ["0%", "-6%"]);
  const palmsScale = useTransform(scrollYProgress, [0, 1], [1, 1.9]);
  const palmsLeftX = useTransform(scrollYProgress, [0, 1], ["0%", "-16%"]);
  const palmsRightX = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const mistY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const mistOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [0.55, 0.85, 1]);
  const textY = useTransform(scrollYProgress, [0, 0.5], [0, -90]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.12, 0.42], [1, 1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const veil = useTransform(scrollYProgress, [0.62, 0.98], [0, 1]);

  const still = reduce;
  const words = [copy.heroTitleA, copy.heroTitleB];
  const tools = [
    { href: "/travel/planner", icon: Navigation, label: copy.tools.planner },
    { href: "/travel/transport", icon: Bus, label: copy.tools.transport },
    { href: "/travel/nearby", icon: Footprints, label: copy.tools.nearby },
    { href: "/travel/suggest", icon: PlusCircle, label: copy.tools.suggest },
  ];

  const lift = headerH || 64;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="tv-hero-title"
      data-active={onScreen ? "true" : "false"}
      className="tv-scene relative bg-tv-night"
      style={{ height: still ? "100svh" : "200svh" }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* ── Sky ───────────────────────────────────────────────────────── */}
        <motion.div aria-hidden="true" className="tv-hero-sky absolute inset-[-8%_0_0_0]" style={still ? undefined : { y: skyY }} />

        {/* ── The illustrated scene, pushed in by the scroll ─────────────── */}
        <motion.div
          role="img"
          aria-label={copy.heroArtLabel}
          className="absolute inset-0 origin-[50%_72%]"
          initial={still ? false : { scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.8, ease }}
        >
          <motion.div className="absolute inset-0 origin-[50%_72%]" style={still ? undefined : { scale: sceneScale, y: sceneY }}>
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              preserveAspectRatio="xMidYMax slice"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="tvh-sun" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fff4d6" />
                  <stop offset="35%" stopColor="#ffd98a" />
                  <stop offset="70%" stopColor="#f3a24d" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#e07a35" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="tvh-stone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b2a22" />
                  <stop offset="55%" stopColor="#1c1512" />
                  <stop offset="100%" stopColor="#100c0a" />
                </linearGradient>
                <linearGradient id="tvh-water" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d98a48" stopOpacity="0.55" />
                  <stop offset="40%" stopColor="#5a3a35" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#120f12" />
                </linearGradient>
                <linearGradient id="tvh-reflect" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <mask id="tvh-reflect-mask">
                  <rect x="0" y={GROUND} width={VB_W} height={VB_H - GROUND} fill="url(#tvh-reflect)" />
                </mask>
              </defs>

              {/* Sun, rising behind the central tower */}
              <motion.g
                initial={still ? false : { y: 120, opacity: 0.4 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 3.2, ease, delay: 0.2 }}
              >
                <motion.g style={still ? undefined : { y: sunY }}>
                  <circle cx={VB_W / 2} cy={GROUND - 190} r="420" fill="url(#tvh-sun)" opacity="0.55" />
                  <circle cx={VB_W / 2} cy={GROUND - 190} r="74" fill="#fff1cf" />
                </motion.g>
              </motion.g>

              <path d={FAR_TREES} fill="#3a2630" opacity="0.85" />
              <Temple id="tvh" />
              <path d={NEAR_TREES} fill="#1a1311" />

              {/* Reflection pond */}
              <rect x="0" y={GROUND} width={VB_W} height={VB_H - GROUND} fill="url(#tvh-water)" />
              <g mask="url(#tvh-reflect-mask)" transform={`translate(0 ${GROUND * 2}) scale(1 -1)`} opacity="0.55">
                <Temple id="tvh" />
              </g>
              <g className="tv-shimmer" stroke="#ffd59a" strokeLinecap="round">
                <line x1="700" y1={GROUND + 26} x2="900" y2={GROUND + 26} strokeOpacity="0.5" strokeWidth="2" />
                <line x1="640" y1={GROUND + 58} x2="760" y2={GROUND + 58} strokeOpacity="0.3" strokeWidth="1.5" />
                <line x1="850" y1={GROUND + 88} x2="990" y2={GROUND + 88} strokeOpacity="0.28" strokeWidth="1.5" />
                <line x1="560" y1={GROUND + 130} x2="680" y2={GROUND + 130} strokeOpacity="0.18" strokeWidth="1.2" />
              </g>
            </svg>
          </motion.div>
        </motion.div>

        {/* ── Mist bands ─────────────────────────────────────────────────── */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-[8%] h-[46%]"
          style={still ? { opacity: 0.55 } : { y: mistY, opacity: mistOpacity }}
        >
          <div className="tv-mist tv-mist-a" />
          <div className="tv-mist tv-mist-b" />
          <div className="tv-mist tv-mist-c" />
        </motion.div>

        {/* ── Foreground palms, parting past the lens ────────────────────── */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 origin-bottom-left"
          style={still ? undefined : { scale: palmsScale, x: palmsLeftX }}
        >
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMinYMax slice" className="absolute inset-0 h-full w-full max-sm:-translate-x-[42%] max-sm:scale-90 max-sm:origin-bottom-left">
            {PALMS_LEFT.map((p, i) => (
              <g key={i} fill="#0b0908">
                <path d={p.trunk} />
                <path d={p.fronds} />
              </g>
            ))}
          </svg>
        </motion.div>
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 origin-bottom-right"
          style={still ? undefined : { scale: palmsScale, x: palmsRightX }}
        >
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMaxYMax slice" className="absolute inset-0 h-full w-full max-sm:translate-x-[42%] max-sm:scale-90 max-sm:origin-bottom-right">
            {PALMS_RIGHT.map((p, i) => (
              <g key={i} fill="#0b0908">
                <path d={p.trunk} />
                <path d={p.fronds} />
              </g>
            ))}
          </svg>
        </motion.div>

        <div aria-hidden="true" className="tv-vignette pointer-events-none absolute inset-0" />

        {/* ── Type ───────────────────────────────────────────────────────── */}
        <motion.div
          className="absolute inset-0 flex flex-col"
          style={still ? undefined : { y: textY, opacity: textOpacity }}
        >
          <div className="container-page flex flex-1 flex-col items-center pt-[9svh] text-center sm:pt-[11svh]">
            <motion.p
              className="tv-eyebrow inline-flex items-center gap-3 text-tv-gold-soft"
              initial={still ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease, delay: 0.3 }}
            >
              <span aria-hidden="true" className="tv-kbach" />
              {copy.eyebrow}
              <span aria-hidden="true" className="tv-kbach tv-kbach-flip" />
            </motion.p>

            <h1
              id="tv-hero-title"
              key={lang}
              className={`mt-5 font-display text-tv-ivory ${
                lang === "km"
                  ? "text-[2.1rem] leading-[1.45] sm:text-5xl lg:text-6xl"
                  : "text-[2.6rem] leading-[1.02] tracking-[-0.02em] sm:text-6xl lg:text-[5.4rem]"
              }`}
            >
              {words.map((line, li) => (
                <span key={li} className={`block ${li === 1 ? "tv-gold-text italic" : ""}`}>
                  {line.split(" ").map((word, wi) => (
                    <motion.span
                      key={`${li}-${wi}`}
                      className="inline-block whitespace-pre"
                      initial={still ? false : { opacity: 0, y: 36, filter: "blur(10px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 1.1, ease, delay: 0.55 + li * 0.45 + wi * 0.11 }}
                    >
                      {word}
                      {wi < line.split(" ").length - 1 ? " " : ""}
                    </motion.span>
                  ))}
                </span>
              ))}
            </h1>
          </div>

          <div className="tv-hero-foot" style={{ paddingBottom: lift }}>
            <div className="container-page flex flex-col items-center gap-5 pb-[max(1.5rem,4svh)] text-center">
              <motion.p
                className="max-w-xl text-[0.95rem] leading-relaxed text-tv-ivory/90 [text-shadow:0_1px_14px_rgba(0,0,0,0.85)] sm:text-base"
                initial={still ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease, delay: 1.6 }}
              >
                {copy.heroLead}
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center justify-center gap-3"
                initial={still ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease, delay: 1.85 }}
              >
                <a href="#tv-discovery" className="tv-btn tv-btn-gold group">
                  {copy.ctaExplore}
                  <ArrowRight size={16} aria-hidden="true" className="link-nudge" />
                </a>
                <Link href="/travel/planner" className="tv-btn tv-btn-ghost">
                  <Navigation size={15} aria-hidden="true" />
                  {copy.ctaPlan}
                </Link>
              </motion.div>

              <motion.nav
                aria-label={copy.toolsLabel}
                className="hidden items-center gap-5 pt-1 sm:flex"
                initial={still ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 2.2 }}
              >
                {tools.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="inline-flex items-center gap-1.5 rounded-sm text-xs font-medium text-tv-ivory/70 transition-colors hover:text-tv-gold-soft focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tv-gold-soft"
                  >
                    <Icon size={14} aria-hidden="true" />
                    {label}
                  </Link>
                ))}
              </motion.nav>
            </div>
          </div>
        </motion.div>

        {/* ── Scroll cue ─────────────────────────────────────────────────── */}
        {!still && (
          <motion.a
            href="#tv-discovery"
            aria-label={copy.scrollCue}
            className="tv-scroll-cue absolute right-5 hidden flex-col items-center gap-2 text-tv-ivory/70 sm:flex lg:right-10"
            style={{ opacity: cueOpacity, bottom: lift + 20 }}
          >
            <motion.span
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 2.6 }}
            >
              <span className="tv-eyebrow [writing-mode:vertical-rl]">{copy.scrollCue}</span>
              <span aria-hidden="true" className="tv-scroll-line" />
            </motion.span>
          </motion.a>
        )}

        {/* ── Veil into the next scene ───────────────────────────────────── */}
        {!still && (
          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-tv-night" style={{ opacity: veil }} />
        )}
      </div>
    </section>
  );
}
