/**
 * Every ad decision on the site comes from this file: whether ads run at all, which AdSense
 * account they run for, which ad unit fills each placement, and what ads.txt declares.
 *
 * The rule it exists to enforce is that no account number lives in application code. Before this,
 * `ca-pub-…` was written in five places (the verification meta tag, the loader script, a fallback
 * inside the slot component, the ads.txt route and a duplicate static file), so a build could — and
 * did — ship a slot whose `data-ad-slot` was the word "HOME_TOP" instead of a numeric ad unit ID.
 * Google requires the ID from the dashboard; a label is an invalid request, so the unit never fills,
 * the visitor sees an empty framed box, and the impression earns nothing.
 *
/**
 * WHY THE ENV READS BELOW LOOK REPETITIVE
 *
 * Values are read as `process.env.NEXT_PUBLIC_*` written out in full, never as
 * `process.env[`NEXT_PUBLIC_…${suffix}`]`. Next replaces statically-written member expressions
 * with their literal values when it builds the browser bundle; a computed key survives into the
 * client as a lookup against a `process.env` that does not exist in a browser, and quietly returns
 * undefined. A dynamic loop over placements would therefore have looked correct in review, type
 * checked, worked on the server, and served zero ad units to real visitors.
 *
 * That is also why the ad unit IDs travel as ONE variable holding a small `PLACEMENT=id` list
 * instead of ten separate `NEXT_PUBLIC_ADSENSE_SLOT_*` variables: a single static read has to cross
 * into the browser bundle, and one line in the Dockerfile and in docker-compose beats twenty.
 *
 * All of these are BUILD-time values. Editing them in a running container changes nothing — the web
 * image has to be rebuilt. See docs/monetization.md.
 */

export type AdPlacement =
  | "HOME_TOP"
  | "HOME_MID"
  | "ARTICLE_TOP"
  | "ARTICLE_MID"
  | "ARTICLE_BOTTOM"
  | "SIDEBAR"
  | "DISCOVERY_MID"
  | "TOOL_BOTTOM"
  | "GUIDE_BOTTOM"
  | "TRENDING_MID";

/** `ca-pub-` followed by exactly 16 digits. Anything else is not a publisher account. */
const CLIENT_RE = /^ca-pub-\d{16}$/;
/** Ad unit IDs in the AdSense dashboard are numeric, currently 10-16 digits. */
const SLOT_RE = /^\d{10,16}$/;
/** The all-zeros sample Google shows in its docs. It is not an account and must never load a script. */
const PLACEHOLDER_CLIENT = "ca-pub-0000000000000000";

function clean(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

const RAW_CLIENT = clean(process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID);
const RAW_ENABLED = clean(process.env.NEXT_PUBLIC_ADSENSE_ENABLED).toLowerCase();
const RAW_CHANNEL = clean(process.env.NEXT_PUBLIC_ADSENSE_CHANNEL);
const RAW_SLOT_LIST = clean(process.env.NEXT_PUBLIC_ADSENSE_SLOTS);

/**
 * `HOME_TOP=1234567890, ARTICLE_TOP=2345678901` → `{ HOME_TOP: "1234567890", … }`.
 *
 * Comma, semicolon and whitespace all separate entries so the same string can be pasted from the
 * dashboard, a shell, or compose without reformatting. Anything that is not a bare numeric ID is
 * dropped: an unknown placement name or a pasted HTML snippet simply does not enable a slot, rather
 * than producing an invalid ad request.
 */
function parseSlotList(raw: string): Record<string, string> {
  const slots: Record<string, string> = {};
  for (const entry of raw.split(/[,;\s]+/)) {
    const separator = entry.indexOf("=");
    if (separator <= 0) continue;
    const name = entry.slice(0, separator).trim().toUpperCase();
    const id = entry.slice(separator + 1).trim();
    if (name && SLOT_RE.test(id)) slots[name] = id;
  }
  return slots;
}

const SLOT_IDS = parseSlotList(RAW_SLOT_LIST);

/** The validated publisher account, or null when this build is not allowed to serve ads. */
export function getAdsenseClient(): string | null {
  if (!CLIENT_RE.test(RAW_CLIENT) || RAW_CLIENT === PLACEHOLDER_CLIENT) return null;
  return RAW_CLIENT;
}

/**
 * Ads run when the account validates and nobody has switched them off. The flag fails open on
 * purpose — `unset` means enabled — because the account check above is the real gate, and a
 * forgotten variable should not silently stop revenue on a site that is configured correctly.
 */
export function isAdsEnabled(): boolean {
  if (["false", "0", "off", "no"].includes(RAW_ENABLED)) return false;
  return getAdsenseClient() !== null;
}

/**
 * The numeric ad unit ID for one placement, or null when it has not been created in the dashboard.
 * A placement without an ID renders nothing rather than sending an invalid request.
 */
export function getAdSlotId(placement: AdPlacement): string | null {
  const slot = SLOT_IDS[placement];
  return slot && SLOT_RE.test(slot) ? slot : null;
}

/**
 * Optional AdSense channel: a label that splits reporting by section so one account can show which
 * surface actually earns. Restricted to URL-safe characters because it travels in page metadata.
 */
export function getAdChannel(): string | null {
  return /^[A-Za-z0-9_-]{1,64}$/.test(RAW_CHANNEL) ? RAW_CHANNEL : null;
}

/** Loader URL for the adsbygoogle library, or null when ads are off. */
export function getAdsenseScriptUrl(): string | null {
  const client = getAdsenseClient();
  return client
    ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`
    : null;
}

/**
 * Reserved height per placement, in pixels, while an ad is being decided.
 *
 * Without a reservation the ad arrives after first paint and pushes the article down — a layout
 * shift, which is both a bad read and a Core Web Vitals penalty, and Google ties page experience to
 * earnings. The numbers are the rendered heights of the formats each surface uses (90 = mobile
 * banner, 250 = rectangle, 600 = half page).
 */
const RESERVED_HEIGHT: Record<AdPlacement, number> = {
  HOME_TOP: 90,
  HOME_MID: 250,
  ARTICLE_TOP: 90,
  ARTICLE_MID: 250,
  ARTICLE_BOTTOM: 250,
  SIDEBAR: 250,
  DISCOVERY_MID: 250,
  TOOL_BOTTOM: 250,
  GUIDE_BOTTOM: 250,
  TRENDING_MID: 250,
};

export function getReservedHeight(placement: AdPlacement): number {
  return RESERVED_HEIGHT[placement] ?? 250;
}

/** Every placement, for the env template and the checks script. */
export const ALL_PLACEMENTS = Object.keys(RESERVED_HEIGHT) as AdPlacement[];

/**
 * ads.txt body, derived from the same account the pages use. `ca-pub-` becomes `pub-` because that
 * is the authorized-seller syntax, and the trailing hash is Google's own publisher ID for itself as
 * a direct seller — it is a constant, not a secret.
 */
export function adsTxtBody(): string {
  const client = getAdsenseClient();
  if (!client) return "";
  return `google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`;
}
