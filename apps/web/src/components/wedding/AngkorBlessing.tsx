"use client";

import React, { useEffect, useRef } from "react";
import { LotusMedallionDivider } from "./KhmerOrnaments";

/* Closing blessing: Angkor Wat at dawn as a gilded sandstone bas-relief.

   The temple is drawn as filled SVG shapes (not outlines) and given relief
   with SVG lighting filters: a blurred-alpha height field plus stone grain,
   lit by a distant light (diffuse for the carving, specular for the gold
   catching it), with a cast shadow onto the paper. The moat reflection is
   the same silhouette mirrored and cut into horizontal slices that sway on
   a sine wave; mist is soft gradients drifting along the waterline.

   One scrubbed GSAP timeline, labelled by stage:
     establish 0–20%   sun rises, terraces and the base lines appear
     relief    20–45%  tower outlines finish, the carved stone fills in
     material  45–65%  gold light sweeps the edges, the moat reflects
     ornament  65–82%  the lotus divider opens out from its medallion
     finale    82–100% «សិរីសួស្ដី ជ័យមង្គល», then the blessing
   Scrolling back reverses it; the finished scene is the server markup, so
   reduced motion (or GSAP failing to load) still shows everything. */

const W = 1000;
const WATER = 400; // waterline
const H = 560;

/* ─── Geometry ──────────────────────────────────────────────────────────── */

type Node = { x: number; y: number; c?: [number, number] }; // c = control point of the segment arriving here

/** One prang: tiers of lotus-bud courses, each bulging and stepped in at its joint, to a pointed finial */
function prang(cx: number, baseY: number, h: number, halfW: number, tiers = 7) {
  const bodyH = h * 0.84;
  const ratios: number[] = [];
  let r = 1;
  for (let i = 0; i < tiers; i++) {
    ratios.push(r);
    r *= 0.8;
  }
  const sum = ratios.reduce((a, b) => a + b, 0);
  const ys: number[] = [baseY];
  for (const q of ratios) ys.push(ys[ys.length - 1] - (q / sum) * bodyH);
  const width = (y: number) => {
    const t = (baseY - y) / bodyH;
    return halfW * (1 - 0.9 * Math.pow(Math.min(1, t), 1.45));
  };
  // Left side, bottom to top
  const left: Node[] = [{ x: cx - halfW, y: baseY }];
  const bands: string[] = [];
  const lips: string[] = [];
  const undercuts: string[] = [];
  for (let i = 0; i < tiers; i++) {
    const y0 = ys[i], y1 = ys[i + 1];
    const w0 = width(y0) * (i === 0 ? 1 : 0.97), w1 = width(y1);
    const mid = (y0 + y1) / 2;
    left.push({ x: cx - w1 * 1.03, y: y1 + 1.6, c: [cx - w0 * 1.07, mid] });
    // Joint: stepped in, then the next course starts a little proud of it
    left.push({ x: cx - w1 * 0.86, y: y1 + 0.6 });
    left.push({ x: cx - w1 * 0.97, y: y1 - 1.2 });
    // A band per course so each tier reads as its own block of stone
    const bw0 = width(y0) * 0.98, bw1 = w1 * 1.0;
    bands.push(
      `M${cx - bw0} ${y0} Q${cx - bw0 * 1.07} ${mid} ${cx - bw1 * 1.03} ${y1 + 1.6} L${cx + bw1 * 1.03} ${y1 + 1.6} Q${cx + bw0 * 1.07} ${mid} ${cx + bw0} ${y0} Z`
    );
    // Sunlit upper edge of the course, and the shadow its overhang throws
    const ly = y1 + (y0 - y1) * 0.22, lw = width(ly) * 1.02;
    lips.push(`M${cx - lw} ${ly} L${cx + lw} ${ly} L${cx + lw * 0.97} ${ly + 1.7} L${cx - lw * 0.97} ${ly + 1.7} Z`);
    const sw0 = width(y0) * 0.99;
    undercuts.push(`M${cx - sw0} ${y0 - 0.2} L${cx + sw0} ${y0 - 0.2} L${cx + sw0 * 0.98} ${y0 - 3.6} L${cx - sw0 * 0.98} ${y0 - 3.6} Z`);
  }
  const top = baseY - h;
  const lastW = width(ys[tiers]);
  left.push({ x: cx, y: top, c: [cx - lastW * 0.9, (ys[tiers] + top) / 2 + 4] });

  const seg = (n: Node) => (n.c ? `Q${n.c[0]} ${n.c[1]} ${n.x} ${n.y}` : `L${n.x} ${n.y}`);
  let d = `M${left[0].x} ${left[0].y}`;
  for (let i = 1; i < left.length; i++) d += " " + seg(left[i]);
  // Mirror down the right side: reverse the nodes, keep each segment's control
  for (let i = left.length - 1; i > 0; i--) {
    const from = left[i], to = left[i - 1];
    const mx = 2 * cx - to.x;
    d += from.c ? ` Q${2 * cx - from.c[0]} ${from.c[1]} ${mx} ${to.y}` : ` L${mx} ${to.y}`;
  }
  d += " Z";
  // Finial spike above the bud
  const finial = `M${cx - 2.2} ${top + 2} L${cx} ${top - h * 0.07} L${cx + 2.2} ${top + 2} Z`;
  // Shrine block under the tower, with its doorway
  const sw = halfW * 1.12, sh = h * 0.13;
  const shrine = `M${cx - sw} ${baseY + sh} L${cx - sw} ${baseY} L${cx + sw} ${baseY} L${cx + sw} ${baseY + sh} Z`;
  const door = `M${cx - sw * 0.22} ${baseY + sh} L${cx - sw * 0.22} ${baseY + sh * 0.35} Q${cx} ${baseY + sh * 0.05} ${cx + sw * 0.22} ${baseY + sh * 0.35} L${cx + sw * 0.22} ${baseY + sh} Z`;
  return { outline: d, bands, lips, undercuts, finial, shrine, door };
}

/** A gallery level: stone block with a sloped roof band and colonnade openings */
function terrace(x0: number, x1: number, top: number, bottom: number) {
  const roofH = (bottom - top) * 0.28;
  const roof = `M${x0 - 8} ${top + roofH} L${x0 + 10} ${top} L${x1 - 10} ${top} L${x1 + 8} ${top + roofH} Z`;
  const body = `M${x0} ${bottom} L${x0} ${top + roofH} L${x1} ${top + roofH} L${x1} ${bottom} Z`;
  const cols: string[] = [];
  const n = Math.round((x1 - x0) / 22);
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const cx = x0 + step * (i + 0.5);
    const cw = step * 0.34;
    const y0 = top + roofH + (bottom - top - roofH) * 0.28;
    cols.push(`M${cx - cw} ${bottom - 2} L${cx - cw} ${y0 + cw} Q${cx} ${y0 - cw * 0.4} ${cx + cw} ${y0 + cw} L${cx + cw} ${bottom - 2} Z`);
  }
  // Horizontal joints between the stone courses of the gallery wall
  const courses: string[] = [];
  for (let y = top + roofH + 5; y < bottom - 3; y += 8) courses.push(`M${x0 + 1} ${y.toFixed(1)} L${x1 - 1} ${y.toFixed(1)}`);
  return { roof, body, cols, courses };
}

/** Axial stairway climbing a gallery level: a flight with its step edges */
function stair(cx: number, top: number, bottom: number, halfW: number) {
  const flight = `M${cx - halfW} ${bottom} L${cx - halfW * 0.72} ${top} L${cx + halfW * 0.72} ${top} L${cx + halfW} ${bottom} Z`;
  const steps: string[] = [];
  const n = Math.max(4, Math.round((bottom - top) / 4));
  for (let i = 1; i < n; i++) {
    const y = top + ((bottom - top) * i) / n;
    const w = halfW * (0.72 + (0.28 * i) / n);
    steps.push(`M${(cx - w).toFixed(1)} ${y.toFixed(1)} L${(cx + w).toFixed(1)} ${y.toFixed(1)}`);
  }
  return { flight, steps };
}

/** Sugar palm (ត្នោត): thick tapered trunk, crown of fan-shaped leaves */
function palm(x: number, baseY: number, h: number, lean: number) {
  const topX = x + lean, topY = baseY - h;
  const trunk = `M${x - 9} ${baseY} Q${x - 6 + lean * 0.4} ${baseY - h * 0.5} ${topX - 4} ${topY} L${topX + 4} ${topY} Q${x + 6 + lean * 0.4} ${baseY - h * 0.5} ${x + 9} ${baseY} Z`;
  const fans: string[] = [];
  /* Each leaf: a stalk out from the crown, then a pleated fan opening away
     from the trunk, split into fingers at the edge like a real palmyra leaf */
  const leaf = (angle: number, stalk: number, radius: number, spread: number) => {
    const a = (angle * Math.PI) / 180;
    const px = topX + Math.cos(a) * stalk, py = topY + Math.sin(a) * stalk;
    fans.push(`M${topX - 1.6} ${topY} L${(px - 1.2).toFixed(1)} ${py.toFixed(1)} L${(px + 1.2).toFixed(1)} ${py.toFixed(1)} L${topX + 1.6} ${topY} Z`);
    const n = 16;
    let p = `M${px.toFixed(1)} ${py.toFixed(1)}`;
    for (let k = 0; k <= n; k++) {
      const ak = ((angle - spread / 2 + (spread * k) / n) * Math.PI) / 180;
      const rr = radius * (k % 2 ? 1 : 0.62);
      p += ` L${(px + Math.cos(ak) * rr).toFixed(1)} ${(py + Math.sin(ak) * rr).toFixed(1)}`;
    }
    fans.push(p + " Z");
  };
  // Crown: young leaves up and out, older ones drooping below
  leaf(-90, 10, 30, 120);
  leaf(-145, 14, 30, 115);
  leaf(-35, 14, 30, 115);
  leaf(-195, 16, 26, 105);
  leaf(15, 16, 26, 105);
  leaf(140, 12, 22, 95);
  leaf(40, 12, 22, 95);
  return { trunk, fans };
}

const CENTER = prang(500, 236, 190, 30, 8);
const INNER = [prang(388, 262, 128, 23, 7), prang(612, 262, 128, 23, 7)];
const OUTER = [prang(286, 300, 96, 19, 6), prang(714, 300, 96, 19, 6)];
const TERRACES = [terrace(120, 880, 330, 400), terrace(220, 780, 290, 330), terrace(330, 670, 252, 290)];
const PALMS = [palm(64, 400, 190, -14), palm(132, 400, 140, 10), palm(936, 400, 200, 12), palm(872, 400, 150, -10)];
const TOWERS = [...OUTER, ...INNER, CENTER];
const STAIRS = [stair(500, 330, 400, 30), stair(500, 290, 330, 24), stair(500, 252, 290, 19)];

/* Every filled shape, back to front, for the relief and its reflection */
const STONE: string[] = [
  ...TERRACES.flatMap((t) => [t.body, t.roof]),
  ...STAIRS.map((s) => s.flight),
  ...TOWERS.flatMap((t) => [t.shrine, t.outline, t.finial]),
];
const COURSES = TOWERS.flatMap((t) => t.bands);
const LIPS = TOWERS.flatMap((t) => t.lips);
const UNDERCUTS = TOWERS.flatMap((t) => t.undercuts);
const JOINTS = [...TERRACES.flatMap((t) => t.courses), ...STAIRS.flatMap((s) => s.steps)];
const PALM_SHAPES = PALMS.flatMap((p) => [p.trunk, ...p.fans]);
/* Outlines drawn in first: the silhouette lines, then the joints of each course */
const STROKES = [...TERRACES.flatMap((t) => [t.roof, t.body]), ...TOWERS.flatMap((t) => [t.outline, t.shrine]), ...PALMS.map((p) => p.trunk)];

const SLICES = 16;
const SLICE_H = (H - WATER) / SLICES;

/* The finale's heading. Approved wording; the stanza below comes from the
   card's translations so English invitations keep their own line. */
const FINALE_HEADING = "សិរីសួស្ដី ជ័យមង្គល";

export function AngkorBlessing({ label, line, labelClassName }: { label: string; line: string; labelClassName: string }) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // the markup's default is the finished scene

    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const q = gsap.utils.selector(root);
      const slices = Array.from(root.querySelectorAll<SVGGElement>("[data-slice]"));
      const wave = { amp: 0 };
      let mistTweens: gsap.core.Tween[] = [];
      let t = 0;
      const tick = (_time: number, dt: number) => {
        t += dt / 1000;
        for (let i = 0; i < slices.length; i++) {
          const depth = 0.35 + i / slices.length;
          slices[i].setAttribute("transform", `translate(${(wave.amp * depth * Math.sin(t * 1.7 + i * 0.62)).toFixed(2)} 0)`);
        }
      };

      const ctx = gsap.context(() => {
        // Starting state (the server-rendered markup is the finished scene)
        gsap.set(q("[data-stroke]"), { strokeDashoffset: 1 });
        gsap.set(q("[data-terrace]"), { opacity: 0 });
        gsap.set(q("[data-stone]"), { opacity: 0 });
        gsap.set(q("[data-sun]"), { y: 90, opacity: 0.1 });
        gsap.set(q("[data-sweep]"), { x: -420 });
        gsap.set(q("[data-moat]"), { opacity: 0.35 });
        gsap.set(q("[data-reflection]"), { opacity: 0 });
        gsap.set(q("[data-mist]"), { opacity: 0 });
        gsap.set(q("[data-divider]"), { clipPath: "inset(0 50% 0 50%)" });
        gsap.set(q("[data-label]"), { opacity: 0, y: 16 });
        gsap.set(q("[data-heading]"), { opacity: 0, y: 22 });
        gsap.set(q("[data-line]"), { opacity: 0, y: 14 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            id: "angkor-blessing",
            trigger: root,
            start: "top 85%",
            // Ends while the section is still fully reachable above the footer
            end: "bottom bottom",
            scrub: 0.8,
            invalidateOnRefresh: true,
            // Ripples and mist only run while the scene is on screen
            onToggle: (self) => {
              if (self.isActive) gsap.ticker.add(tick);
              else gsap.ticker.remove(tick);
              mistTweens.forEach((tw) => (self.isActive ? tw.play() : tw.pause()));
            },
          },
        });
        tl.addLabel("establish", 0)
          .to(q("[data-label]"), { opacity: 1, y: 0, duration: 8, ease: "power2.out" }, "establish")
          .to(q("[data-sun]"), { y: 0, opacity: 1, duration: 30, ease: "power1.out" }, "establish")
          .to(q("[data-terrace]"), { opacity: 1, duration: 18, ease: "power1.inOut" }, "establish+=2")
          .to(q("[data-stroke]"), { strokeDashoffset: 0, duration: 40, stagger: 0.25, ease: "power1.inOut" }, "establish+=2")
          .addLabel("relief", 20)
          .to(q("[data-stone]"), { opacity: 1, duration: 22, ease: "power1.inOut" }, "relief+=4")
          .to(q("[data-outline]"), { opacity: 0.3, duration: 16 }, "relief+=12")
          .addLabel("material", 45)
          .to(q("[data-sweep]"), { x: 1100, duration: 20, ease: "power2.inOut" }, "material")
          .to(q("[data-moat]"), { opacity: 1, duration: 12 }, "material")
          .to(q("[data-reflection]"), { opacity: 1, duration: 14 }, "material+=4")
          .to(wave, { amp: 2.4, duration: 16, ease: "power1.in" }, "material+=4")
          .addLabel("ornament", 65)
          .to(q("[data-divider]"), { clipPath: "inset(0 0% 0 0%)", duration: 15, ease: "power2.out" }, "ornament")
          .to(q("[data-mist]"), { opacity: 1, duration: 14, stagger: 2 }, "ornament")
          .addLabel("finale", 82)
          .to(q("[data-heading]"), { opacity: 1, y: 0, duration: 9, ease: "power2.out" }, "finale")
          .to(q("[data-line]"), { opacity: 1, y: 0, duration: 9, ease: "power2.out" }, "finale+=6");

        // Mist drifts slowly on its own; the ripple runs only while in view
        mistTweens = q("[data-mist]").map((m: Element, i: number) =>
          gsap.to(m, { x: i % 2 ? -50 : 60, duration: 10 + i * 3, ease: "sine.inOut", repeat: -1, yoyo: true, paused: true })
        );
      }, root);

      // Re-measure when the page above changes height: lazy gallery photos,
      // web fonts and the 3D pieces all land after this runs, and a stale
      // trigger would play the sequence at the wrong scroll position
      let pending = 0;
      const refresh = () => {
        cancelAnimationFrame(pending);
        pending = requestAnimationFrame(() => ScrollTrigger.refresh());
      };
      const ro = new ResizeObserver(refresh);
      ro.observe(document.body);
      document.fonts?.ready.then(refresh).catch(() => {});
      cleanup = () => {
        cancelAnimationFrame(pending);
        ro.disconnect();
        gsap.ticker.remove(tick);
        ctx.revert();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <section ref={rootRef} className="relative overflow-clip px-4 sm:px-6 pt-24 sm:pt-32 pb-20 text-center">
      <p data-label className={labelClassName}>{label}</p>

      {/* The scene is a stack of SVG layers sharing one viewBox. The filtered
          relief (terraces, towers) never changes inside its SVG, only the
          opacity of its wrapper, so the browser rasterises the lighting
          filters once and composites them; everything that moves every frame
          (sun, ripples, outlines, light sweep, mist) lives in light layers of
          its own. In one SVG, each of those changes re-ran the filters across
          the whole scene. */}
      <div className="relative mx-auto mt-8 w-full max-w-[980px]" style={{ aspectRatio: `${W} / ${H}` }} role="img" aria-label="Angkor Wat at dawn">
      {/* Shared definitions (gradients, filter, clips, the reflection source) */}
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          {/* Sandstone washed with old gold, lighter where the sun reaches */}
          <linearGradient id="ab-stone" x1="0" y1="40" x2="0" y2={WATER} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E5C158" />
            <stop offset="0.35" stopColor="#D4AF37" />
            <stop offset="0.7" stopColor="#C59B27" />
            <stop offset="1" stopColor="#8C6D37" />
          </linearGradient>
          <linearGradient id="ab-palm" x1="0" y1="190" x2="0" y2={WATER} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#B8902E" />
            <stop offset="1" stopColor="#6E5326" />
          </linearGradient>
          {/* The reflected stone: warm gold sinking into the water */}
          <linearGradient id="ab-reflect" x1="0" y1={WATER} x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#D9B45A" stopOpacity="0.62" />
            <stop offset="0.6" stopColor="#B08A3E" stopOpacity="0.25" />
            <stop offset="1" stopColor="#8C6D37" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="ab-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#FFE9B0" stopOpacity="0.95" />
            <stop offset="0.45" stopColor="#F3CF7A" stopOpacity="0.45" />
            <stop offset="1" stopColor="#F3CF7A" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ab-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFF6D8" stopOpacity="0" />
            <stop offset="0.5" stopColor="#FFF6D8" stopOpacity="0.85" />
            <stop offset="1" stopColor="#FFF6D8" stopOpacity="0" />
          </linearGradient>
          {/* Moat: dark turquoise water, fading to the paper at the far edges */}
          <linearGradient id="ab-water" x1="0" y1={WATER} x2="0" y2={H} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1E4A47" stopOpacity="0.92" />
            <stop offset="0.55" stopColor="#2C5E59" stopOpacity="0.7" />
            <stop offset="1" stopColor="#2C5E59" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ab-water-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.12" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.88" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="ab-moat-mask" maskUnits="userSpaceOnUse" x="0" y={WATER} width={W} height={H - WATER}>
            <rect x="0" y={WATER} width={W} height={H - WATER} fill="url(#ab-water-edge)" />
          </mask>
          <radialGradient id="ab-mist" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#FFFBF2" stopOpacity="0.75" />
            <stop offset="1" stopColor="#FFFBF2" stopOpacity="0" />
          </radialGradient>

          {/* Bas-relief: blurred silhouette + stone grain as a height field,
              lit from the upper left; diffuse gives the carving, specular
              the gold catching the light; cast shadow falls on the paper */}
          <filter id="ab-relief" x="-4%" y="-8%" width="108%" height="118%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="grain" />
            <feColorMatrix in="grain" type="saturate" values="0" result="grainGrey" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="soft" />
            <feComposite in="soft" in2="grainGrey" operator="arithmetic" k1="0" k2="1" k3="0.12" k4="0" result="height" />
            <feDiffuseLighting in="height" surfaceScale="4" diffuseConstant="1.05" lightingColor="#ffffff" result="diffuse">
              <feDistantLight azimuth="225" elevation="48" />
            </feDiffuseLighting>
            <feSpecularLighting in="height" surfaceScale="4.5" specularConstant="0.85" specularExponent="24" lightingColor="#FFF1C9" result="spec">
              <feDistantLight azimuth="225" elevation="38" />
            </feSpecularLighting>
            <feComposite in="SourceGraphic" in2="diffuse" operator="arithmetic" k1="1.15" k2="0" k3="0" k4="0" result="lit" />
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn" />
            <feComposite in="lit" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.7" k4="0" result="shine" />
            <feComposite in="shine" in2="SourceAlpha" operator="in" result="relief" />
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="shadowBlur" />
            <feOffset in="shadowBlur" dx="4" dy="5" result="shadowOff" />
            <feFlood floodColor="#3d2a10" floodOpacity="0.35" />
            <feComposite in2="shadowOff" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="relief" />
            </feMerge>
          </filter>

          <clipPath id="ab-temple-clip">
            {STONE.map((d, i) => <path key={i} d={d} />)}
          </clipPath>
          {Array.from({ length: SLICES }, (_, i) => (
            <clipPath key={i} id={`ab-slice-${i}`} clipPathUnits="userSpaceOnUse">
              <rect x="-40" y={WATER + i * SLICE_H} width={W + 80} height={SLICE_H + 0.6} />
            </clipPath>
          ))}

          {/* Flat silhouette used for the reflection */}
          <g id="ab-flat">
            {STONE.map((d, i) => <path key={i} d={d} />)}
            {PALM_SHAPES.map((d, i) => <path key={`p${i}`} d={d} />)}
          </g>
        </defs>
      </svg>

      {/* Layer: dawn sun behind the central tower */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
        <g data-sun>
          <circle cx="500" cy="150" r="150" fill="url(#ab-sun)" />
          <circle cx="500" cy="150" r="46" fill="#FFE3A3" opacity="0.65" />
        </g>
      </svg>

      {/* Layer: the moat */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
        {/* Moat: water, the temple reflected in it (cut into slices that sway
            on a sine wave), and a few soft glints on the surface */}
        <g mask="url(#ab-moat-mask)">
          <rect data-moat x="0" y={WATER} width={W} height={H - WATER} fill="url(#ab-water)" />
          <g data-reflection>
            {Array.from({ length: SLICES }, (_, i) => (
              <g key={i} clipPath={`url(#ab-slice-${i})`}>
                <g data-slice>
                  <use href="#ab-flat" transform={`translate(0 ${WATER * 2}) scale(1 -1)`} fill="url(#ab-reflect)" />
                </g>
              </g>
            ))}
          </g>
          {[[230, 418, 120], [560, 430, 160], [380, 452, 90], [760, 446, 110], [140, 470, 70], [640, 488, 90]].map(([x, y, w], i) => (
            <rect key={i} x={x} y={y} width={w} height="1.2" rx="0.6" fill="#E9F3EC" opacity="0.22" />
          ))}
        </g>
      </svg>

      {/* Layers: the carved stone. Terraces and stairways first, then the
          towers rise in relief; GSAP fades the wrappers, not the SVG inside */}
      <div data-terrace className="absolute inset-0 will-change-[opacity]">
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
        <g filter="url(#ab-relief)">
          {PALM_SHAPES.map((d, i) => <path key={`p${i}`} d={d} fill="url(#ab-palm)" />)}
          {TERRACES.flatMap((t) => [t.body, t.roof]).map((d, i) => <path key={`t${i}`} d={d} fill="url(#ab-stone)" />)}
          {STAIRS.map((st, i) => <path key={`s${i}`} d={st.flight} fill="url(#ab-stone)" />)}
          {JOINTS.map((d, i) => <path key={`j${i}`} d={d} stroke="#5E4620" strokeOpacity="0.28" strokeWidth="0.7" fill="none" />)}
          {TERRACES.flatMap((t) => t.cols).map((d, i) => <path key={`o${i}`} d={d} fill="#4A3618" fillOpacity="0.62" />)}
        </g>
      </svg>
      </div>
      <div data-stone className="absolute inset-0 will-change-[opacity]">
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true">
        <g filter="url(#ab-relief)">
          {TOWERS.flatMap((t) => [t.shrine, t.outline, t.finial]).map((d, i) => <path key={i} d={d} fill="url(#ab-stone)" />)}
          {COURSES.map((d, i) => (
            <path key={`c${i}`} d={d} fill="url(#ab-stone)" stroke="#6B5226" strokeOpacity="0.4" strokeWidth="0.7" />
          ))}
          {UNDERCUTS.map((d, i) => <path key={`u${i}`} d={d} fill="#4A3618" fillOpacity="0.34" />)}
          {LIPS.map((d, i) => <path key={`l${i}`} d={d} fill="#FBE7A6" fillOpacity="0.5" />)}
          {TOWERS.map((t, i) => <path key={`d${i}`} d={t.door} fill="#4A3618" fillOpacity="0.62" />)}
        </g>
      </svg>
      </div>

      {/* Layer: light sweep, outlines, waterline and mist */}
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden="true">
        {/* Gold light sweeping across the stone */}
        <g clipPath="url(#ab-temple-clip)" opacity="0.75">
          <rect data-sweep x="0" y="0" width="300" height={WATER} fill="url(#ab-sweep)" transform="translate(1100 0)" />
        </g>

        {/* Outlines that draw in first */}
        <g data-outline fill="none" stroke="#8C6D37" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
          {STROKES.map((d, i) => (
            <path key={i} data-stroke d={d} pathLength={1} strokeDasharray="1" strokeDashoffset="0" />
          ))}
        </g>

        {/* Waterline and mist drifting along the base */}
        <line x1="20" y1={WATER} x2={W - 20} y2={WATER} stroke="#8C6D37" strokeOpacity="0.5" strokeWidth="1" />
        <ellipse data-mist cx="300" cy="392" rx="260" ry="26" fill="url(#ab-mist)" />
        <ellipse data-mist cx="700" cy="404" rx="300" ry="30" fill="url(#ab-mist)" />
        <ellipse data-mist cx="500" cy="420" rx="340" ry="22" fill="url(#ab-mist)" />
      </svg>
      </div>

      <div data-divider className="mx-auto mt-4 w-full max-w-[420px]">
        <LotusMedallionDivider className="w-full h-auto" />
      </div>
      <h2
        data-heading
        className="mt-4 font-moul text-[clamp(26px,4.6vw,42px)] leading-[1.8] pt-1 bg-clip-text text-transparent bg-[linear-gradient(180deg,#A63030_0%,#8B1E1E_55%,#6E1414_100%)] [filter:drop-shadow(0_1px_0_rgba(229,193,88,.75))_drop-shadow(0_0_12px_rgba(212,175,55,.22))]"
      >
        {FINALE_HEADING}
      </h2>
      <p data-line className="mt-3 mx-auto max-w-xl wc-khmer text-[17px] leading-[1.9] text-[#2a241e]">{line}</p>
    </section>
  );
}
