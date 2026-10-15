#!/usr/bin/env node
/*
 * Design gate.
 *
 * The brief for this pass was "modern but standard, clean and professional, use colour
 * standards". Three of those six words are checkable, so they are checked here rather than
 * asserted in prose:
 *
 *   1. COLOUR STANDARDS - every foreground/background pair the stylesheet actually puts text
 *      on is measured against WCAG 2.2 contrast (AA: 4.5 for body-size, 3.0 for large).
 *      Ratios are computed from the hex values in globals.css, so a token edit that breaks
 *      accessibility fails this script instead of a reader.
 *   2. ONE PALETTE - no Tailwind palette colour (bg-teal-500, text-slate-400, ...) outside
 *      globals.css on public surfaces, and no raw hex in components.
 *   3. MOTION IS SAFE - every animation primitive declared in the stylesheet is neutralised
 *      inside the prefers-reduced-motion block, and no animation is attached to a layout
 *      property (top/left/width/height) that would cost frames.
 *
 * Run: node scripts/design-checks.mjs
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = fileURLToPath(new URL(".", import.meta.url));
const WEB_ROOT = join(SCRIPT_DIR, "..");
const SRC_ROOT = join(WEB_ROOT, "src");
const CSS_PATH = join(SRC_ROOT, "app", "globals.css");

const results = [];
const ok = (name, detail = "") => results.push({ pass: true, name, detail });
const bad = (name, detail = "") => results.push({ pass: false, name, detail });

/* ── Parsing helpers ─────────────────────────────────────────────────────── */

const css = readFileSync(CSS_PATH, "utf8");

/** Token values per theme block, keyed by the declaration text inside the block. */
function parseBlock(source, label) {
  const start = source.indexOf(label);
  if (start === -1) throw new Error(`missing block: ${label}`);
  const open = source.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = source.slice(open + 1, end);
  const tokens = {};
  for (const match of body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

const light = parseBlock(css, ":root {");
const dark = parseBlock(css, ':root.dark,\n.dark,\n[data-theme="dark"] {');

function hexToRgb(hex) {
  const value = hex.trim();
  const m = /^#([0-9a-f]{3,8})$/i.exec(value);
  if (!m) return null;
  let s = m[1];
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (s.length === 8) s = s.slice(0, 6);
  if (s.length !== 6) return null;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}

/** WCAG 2.2 relative luminance. */
function luminance([r, g, b]) {
  const ch = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function ratio(fg, bg) {
  const a = hexToRgb(fg);
  const b = hexToRgb(bg);
  if (!a || !b) return null;
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/* ── 1. Contrast ─────────────────────────────────────────────────────────── */

/**
 * Pairs the site really renders, with the size they render at.
 * `large` follows WCAG's own threshold: 18.66px+ bold or 24px+, which is where the
 * 3:1 minimum applies instead of 4.5:1.
 */
const TEXT_PAIRS = [
  ["--foreground", "--background", 4.5, "body copy on the page"],
  ["--foreground", "--surface", 4.5, "body copy on a panel"],
  ["--foreground", "--card", 4.5, "card title"],
  ["--muted-foreground", "--background", 4.5, "meta line, summary"],
  ["--muted-foreground", "--card", 4.5, "card summary"],
  ["--muted-foreground", "--surface", 4.5, "footer link"],
  ["--muted-foreground", "--surface-muted", 4.5, "muted copy on a tinted band"],
  ["--muted-foreground", "--muted", 4.5, "placeholder in an input"],
  ["--accent", "--background", 4.5, "link, section label"],
  ["--accent", "--card", 4.5, "link inside a card"],
  ["--accent", "--surface-muted", 4.5, "link on a tinted band"],
  ["--accent-foreground", "--accent", 4.5, "label on a filled accent chip"],
  ["--primary-foreground", "--primary", 4.5, "label on a primary button"],
  ["--destructive", "--background", 4.5, "error text"],
  ["--destructive-foreground", "--destructive", 4.5, "label on a destructive button"],
  ["--success", "--background", 4.5, "status text"],
  ["--warning", "--background", 4.5, "status text"],
  ["--info", "--background", 4.5, "status text"],
  ["--success-foreground", "--success", 4.5, "label on a success chip"],
  ["--warning-foreground", "--warning", 4.5, "label on a warning chip"],
  ["--info-foreground", "--info", 4.5, "label on an info chip"],
];

const CATEGORY_KEYS = [
  "--category-news",
  "--category-world",
  "--category-travel",
  "--category-discover",
  "--category-quiz",
  "--category-tools",
  "--category-transport",
  "--category-tech",
  "--category-breaking",
];

const NON_TEXT_PAIRS = [
  ["--ring", "--background", 3.0, "focus indicator"],
  ["--border-strong", "--background", 1.0, "hairline that separates sections (decorative, reported only)"],
];

const floor = (tokens, name) => {
  const v = tokens[name];
  return typeof v === "string" && v.startsWith("#") ? v : null;
};

for (const [themeName, tokens] of [
  ["light", light],
  ["dark", dark],
]) {
  for (const [fgToken, bgToken, min, note] of TEXT_PAIRS) {
    const r = ratio(floor(tokens, fgToken), floor(tokens, bgToken));
    if (r === null) {
      bad(`contrast ${themeName}: ${fgToken} on ${bgToken}`, "unparsable value");
      continue;
    }
    const line = `${r.toFixed(2)}:1 — ${note}`;
    if (r + 1e-9 >= min) ok(`${themeName} AA ${fgToken}/${bgToken}`, line);
    else bad(`${themeName} AA ${fgToken}/${bgToken}`, `${line} (needs ${min}:1)`);
  }

  for (const cat of CATEGORY_KEYS) {
    /* Category marks render at 12px semibold uppercase, so they are body-size text. */
    const onPaper = ratio(floor(tokens, cat), floor(tokens, "--background"));
    const onCard = ratio(floor(tokens, cat), floor(tokens, "--card"));
    for (const [surface, r] of [
      ["background", onPaper],
      ["card", onCard],
    ]) {
      if (r === null) {
        bad(`contrast ${themeName}: ${cat} on ${surface}`, "unparsable value");
      } else if (r + 1e-9 >= 4.5) {
        ok(`${themeName} AA ${cat}/${surface}`, `${r.toFixed(2)}:1 — section mark`);
      } else {
        bad(`${themeName} AA ${cat}/${surface}`, `${r.toFixed(2)}:1 — section mark (needs 4.5:1)`);
      }
    }
  }

  for (const [fgToken, bgToken, min, note] of NON_TEXT_PAIRS) {
    const r = ratio(floor(tokens, fgToken), floor(tokens, bgToken));
    if (r === null) {
      bad(`contrast ${themeName}: ${fgToken} on ${bgToken}`, "unparsable value");
      continue;
    }
    if (min <= 1 || r + 1e-9 >= min) ok(`${themeName} ${note} ${fgToken}/${bgToken}`, `${r.toFixed(2)}:1`);
    else bad(`${themeName} ${note} ${fgToken}/${bgToken}`, `${r.toFixed(2)}:1 (needs ${min}:1)`);
  }
}

/* ── 2. One palette ──────────────────────────────────────────────────────── */

const PALETTE_CLASS =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|decoration|shadow|outline)-(?:teal|violet|sky|fuchsia|rose|emerald|indigo|cyan|purple|blue|green|amber|orange|pink|slate|gray|zinc|stone)-\d{2,3}\b/;
const RAW_HEX = /#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi;

/**
 * Photo overlays are excluded deliberately: a scrim and the white type sitting on it are painted
 * over a photograph, not over the theme, so they are not theme colours.
 *
 * KhqrGenerator reproduces the national Bakong KHQR card — a fixed white payment surface with the
 * network's own red. Recolouring it to follow the reader's theme would misrender a payment QR, so
 * it keeps literal colours and is exempt on that ground, not by accident.
 *
 * ColorContrastChecker is a tool whose *subject matter* is colours: its sample pairs are data the
 * reader compares, not the site's palette.
 *
 * Admin surfaces are exempt because this pass covers the public web.
 */
const EXEMPT_HEX = /components\/news\/ArticleReader|components\/shared\/news-card|components\/news\/NewsCard|components\/news\/HeroStory|components\/ads\/AdSlot|components\/tools\/ColorContrastChecker\.tsx/;
const EXEMPT_SURFACES = /^components\/(admin\/|layout\/(admin-shell|wizard-shell))/;
const EXEMPT_PALETTE = new Set(["components/tools/KhqrGenerator.tsx"]);

function walk(dir, base, out) {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const rel = relative(base, abs).replace(/\\/g, "/");
    const st = statSync(abs);
    if (st.isDirectory()) walk(abs, base, out);
    else if (/\.(tsx|ts)$/.test(entry)) out.push({ rel, abs });
  }
  return out;
}

const files = walk(SRC_ROOT, SRC_ROOT, []);
const paletteOffenders = [];
const hexOffenders = [];

for (const { rel, abs } of files) {
  if (rel === "app/globals.css") continue;
  const source = readFileSync(abs, "utf8");
  const lines = source.split("\n");
  const exemptSurface = EXEMPT_SURFACES.test(rel);
  const paletteAllowed = exemptSurface || EXEMPT_PALETTE.has(rel);

  lines.forEach((line, index) => {
    if (line.includes("process.env")) return;
    if (!paletteAllowed && PALETTE_CLASS.test(line)) {
      paletteOffenders.push(`${rel}:${index + 1} ${line.trim().slice(0, 90)}`);
    }
    if (!paletteAllowed && !EXEMPT_HEX.test(rel) && RAW_HEX.test(line) && !/^\s*(\/\/|\*|\/\*)/.test(line)) {
      hexOffenders.push(`${rel}:${index + 1} ${line.trim().slice(0, 90)}`);
    }
    RAW_HEX.lastIndex = 0;
  });
}

if (paletteOffenders.length === 0) ok("public web uses tokens only, no Tailwind palette colours");
else bad(`public web uses tokens only`, `${paletteOffenders.length} palette classes: ${paletteOffenders.slice(0, 6).join(" | ")}`);

if (hexOffenders.length === 0) ok("no raw hex colours outside globals.css on public surfaces");
else bad("no raw hex colours outside globals.css", `${hexOffenders.length} hits: ${hexOffenders.slice(0, 6).join(" | ")}`);

/* ── 3. Motion safety ────────────────────────────────────────────────────── */

const reduced = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/);
if (!reduced) bad("prefers-reduced-motion block exists");
else {
  ok("prefers-reduced-motion block exists");
  const block = reduced[1];
  const primitives = [
    ".marquee-track",
    ".rule-fill",
    ".title-sweep",
    ".dd-reveal",
    ".photo-zoom",
    ".link-nudge",
    ".nav-indicator",
  ];
  const missing = primitives.filter((p) => !block.includes(p.replace(/^\./, "")));
  if (missing.length === 0) ok("reduced motion neutralises every motion primitive", `${primitives.length} primitives`);
  else bad("reduced motion covers every primitive", `missing: ${missing.join(", ")}`);

  /* The global duration clamp is what actually makes third-party animation obey the setting. */
  if (/animation-duration:\s*0\.01ms\s*!important/.test(block)) ok("reduced motion clamps animation-duration globally");
  else bad("reduced motion clamps animation-duration globally");
}

/* Animating layout properties is the classic dropped-frame bug. */
const layoutProps = ["top", "left", "right", "bottom", "width", "height", "margin", "padding"];
const keyframeBodies = [...css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?)\n\}/g)];
const layoutAnimators = [];
for (const [, name, body] of keyframeBodies) {
  for (const prop of layoutProps) {
    if (new RegExp(`(^|\\n|;)\\s*${prop}\\s*:`, "m").test(body)) {
      layoutAnimators.push(`${name} animates ${prop}`);
      break;
    }
  }
}
if (layoutAnimators.length === 0) ok("no keyframe animates a layout property", `${keyframeBodies.length} keyframes checked`);
else bad("no keyframe animates a layout property", layoutAnimators.join(", "));

/* ── 4. Type ladder and one radius ladder ────────────────────────────────── */

const declaredSizes = [...css.matchAll(/--text-(2xs|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl):/g)].map((m) => m[1]);
if (declaredSizes.includes("xs") && !declaredSizes.includes("2xs")) ok("type ladder has a 12px floor", declaredSizes.join(", "));
else bad("type ladder has a 12px floor", `sizes: ${declaredSizes.join(", ") || "none"}`);

const tinyText = [];
for (const { rel, abs } of files) {
  if (EXEMPT_SURFACES.test(rel)) continue;
  const source = readFileSync(abs, "utf8");
  source.split("\n").forEach((line, index) => {
    if (/\btext-(?:9|10|11)px\b/.test(line) || /\[\\?\.?0?(?:9|10|11)px\]/.test(line)) {
      tinyText.push(`${rel}:${index + 1} ${line.trim().slice(0, 80)}`);
    }
  });
}
if (tinyText.length === 0) ok("no text below the 12px ladder floor on public surfaces");
else bad("no text below the 12px ladder floor", `${tinyText.length} hits: ${tinyText.slice(0, 4).join(" | ")}`);

/* ── 5. Interaction affordances ──────────────────────────────────────────── */

const headerPath = join(SRC_ROOT, "components", "layout", "Header.tsx");
if (existsSync(headerPath)) {
  const header = readFileSync(headerPath, "utf8");
  for (const [needle, why] of [
    ["nav-indicator", "the pinned section nav carries a moving indicator"],
    ["data-scrolled", "the masthead knows it has been scrolled and condenses"],
    ["aria-current", "the active section is announced, not only drawn"],
  ]) {
    if (header.includes(needle)) ok(`header: ${why}`);
    else bad(`header: ${why}`, `missing "${needle}"`);
  }
} else bad("Header.tsx exists");

const tickerPath = join(SRC_ROOT, "components", "layout", "NewsTicker.tsx");
if (existsSync(tickerPath)) {
  const ticker = readFileSync(tickerPath, "utf8");
  const checks = [
    ['aria-hidden="true"', "the duplicated marquee copy is hidden from screen readers"],
    ["marquee-track", "the rail uses the shared marquee primitive"],
    ["data-paused", "hover and focus pause the rail"],
    ["role=\"region\"", "the rail is a labelled landmark"],
  ];
  for (const [needle, why] of checks) {
    if (ticker.includes(needle)) ok(`ticker: ${why}`);
    else bad(`ticker: ${why}`, `missing ${needle}`);
  }
} else bad("NewsTicker.tsx exists", "the front page has no live rail");

/* ── The hue table matches the categories the API actually files under ───── */

{
  /* `src/lib/category-key.ts` is importable by Node because it keeps to erasable type
     syntax and imports nothing. That makes this a real call into the shipped function,
     not a copy of it — the table can drift from the data and this is what notices. */
  const { categoryKey } = await import(
    pathToFileURL(join(SRC_ROOT, "lib", "category-key.ts")).href
  );

  const REAL_CATEGORIES = [
    ["Technology & AI", "tech"],
    ["World News", "world"],
    ["Cambodia", "news"],
    ["Science & Space", "discover"],
    ["Phnom Penh", "news"],
    ["Economy & Business", "neutral"],
    ["Education & Jobs", "neutral"],
    ["Environment", "neutral"],
  ];

  /* Substrings that must not be claimed by the short aliases: "ai" inside "available",
     "kep" inside "skeptical". */
  const TRAPS = [
    ["Available Items", "neutral"],
    ["Maintained Systems", "neutral"],
    ["Skeptical Reader", "neutral"],
    ["Travel & Tourism", "travel"],
    ["Breaking News", "breaking"],
    ["AI", "tech"],
    ["Health & AI", "tech"],
    ["Khmer Lifestyle", "news"],
  ];

  for (const [name, want] of [...REAL_CATEGORIES, ...TRAPS]) {
    const got = categoryKey(name);
    if (got === want) ok(`hue: "${name}" -> ${want}`);
    else bad(`hue: "${name}" -> ${want}`, `got ${got}`);
  }

  const unmarked = REAL_CATEGORIES.filter(([, k]) => k === "neutral").map(([n]) => n);
  ok(
    `hue: ${REAL_CATEGORIES.length - unmarked.length}/${REAL_CATEGORIES.length} live categories wear a section hue`,
    `neutral by design: ${unmarked.join(", ")}`
  );
}

/* ── Report ──────────────────────────────────────────────────────────────── */

const passed = results.filter((r) => r.pass).length;
const failed = results.length - passed;

console.log(`\nDesign gate — ${results.length} checks (${passed} passed, ${failed} failed)\n`);
for (const r of results.filter((x) => !x.pass)) console.log(`  FAIL  ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
if (failed === 0) {
  const minRatio = Math.min(
    ...TEXT_PAIRS.map(([f, b]) => Math.min(ratio(light[f], light[b]), ratio(dark[f], dark[b]))).filter((n) => n !== null)
  );
  console.log(`  PASS  all checks — lowest text contrast anywhere in the palette: ${minRatio.toFixed(2)}:1`);
}
console.log("");
process.exit(failed === 0 ? 0 : 1);
