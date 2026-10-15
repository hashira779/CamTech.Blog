/**
 * One place for every human-readable value on the site.
 *
 * Dates used to be formatted inline per page, so the homepage showed
 * "October 14, 2026", "Oct 14" and "Sep 20" for the same week, and empty dates
 * fell back to invented strings like "Today" and "Recently". Everything here
 * returns an empty string when there is no real value to show.
 */

const LONG: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
const MEDIUM: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
const SHORT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

function toDate(value?: string | number | Date | null): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type DateStyle = "long" | "medium" | "short";

const STYLE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  long: LONG,
  medium: MEDIUM,
  short: SHORT,
};

/** "14 October 2026" / "14 Oct 2026" / "14 Oct". Empty string when unknown. */
export function formatDate(value?: string | number | Date | null, style: DateStyle = "medium"): string {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en-GB", STYLE_OPTIONS[style]).format(date);
}

/** ISO string for <time datetime>, safe to pass through when absent. */
export function toIsoString(value?: string | number | Date | null): string | undefined {
  const date = toDate(value);
  return date ? date.toISOString() : undefined;
}

/** "1.4k" / "2,127". Empty string for nullish input, "0" stays "0". */
export function formatCount(value?: number | string | null): string {
  if (value === null || value === undefined || value === "") return "";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "";
  if (Math.abs(n) < 1000) return String(Math.round(n));
  return new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/**
 * A read time derived from the article's own word count (~225 wpm), never a
 * hardcoded default. Returns null when there is no body copy to measure, so the
 * UI can omit the label instead of printing a guess.
 */
export function estimateReadingMinutes(content?: string | null): number | null {
  if (!content) return null;
  const words = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  if (words < 40) return null;
  return Math.max(1, Math.round(words / 225));
}

/** "3 min read" or "" — never a fabricated number. */
export function formatReadingTime(content?: string | null): string {
  const minutes = estimateReadingMinutes(content);
  return minutes === null ? "" : `${minutes} min read`;
}

/** Sentence-case a slug or label without shouting: "phnom-penh" -> "Phnom Penh". */
export function humanize(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Tidies copy that arrived from the ingestion pipeline.
 *
 * Syndicated summaries reach the page with literal `&nbsp;` runs and stray HTML
 * entities baked in ("...defacing flag &nbsp;&nbsp; thmey."), which render as
 * visible garbage. This is presentation-level cleanup only — the generator that
 * produces those summaries is fixed separately in the API.
 */
export function cleanText(value?: string | null): string {
  if (!value) return "";
  return String(value)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

