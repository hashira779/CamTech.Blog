/**
 * The one section-hue lookup.
 *
 * Kept free of React and of any import so `scripts/design-checks.mjs` can run the real
 * function against the real category names the API files under, rather than trusting
 * that the table matches the data. The type-only syntax here is deliberate: it has to
 * stay loadable by Node's type stripper.
 *
 * Category colour used to be chosen per page (teal on news, rose on breaking, amber on
 * quiz, emerald on travel), so the same concept looked different on every route. There
 * is now one restrained hue per section, defined as a token in `globals.css`, and it is
 * only ever used for small marks and chips — never as a large fill.
 */
export type CategoryKey =
  | "news"
  | "world"
  | "travel"
  | "discover"
  | "quiz"
  | "tools"
  | "transport"
  | "tech"
  | "breaking"
  | "neutral";

/**
 * Cambodian province names as the API files them. `\b` guards the short ones — an
 * unguarded "kep" would match any category containing "kept" or "skeptical".
 */
const CAMBODIA_BEAT =
  /(?:phnom penh|siem reap|sihanouk|battambang|koh kong|\bkep\b|kampong|kandal|mondulkiri|ratanakiri|preah vihear|\botrus\b)/;

/** Normalises the many spellings the API and page props use into one key. */
export function categoryKey(value?: string | null): CategoryKey {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v) return "neutral";
  if (v.includes("break")) return "breaking";
  if (v.includes("travel") || v.includes("tourism")) return "travel";
  if (v.includes("world") || v.includes("international") || v.includes("global")) return "world";
  if (v.includes("discover") || v.includes("science") || v.includes("explainer")) return "discover";
  if (v.includes("quiz")) return "quiz";
  if (v.includes("tool") || v.includes("utility")) return "tools";
  if (v.includes("transport") || v.includes("transit")) return "transport";
  /* "Technology & AI" is the largest category on the site and matched nothing here, so
     most cards wore a grey dot. The word boundary is deliberate — a bare `includes("ai")`
     would claim "available", "maintain" and "campaign". */
  if (
    v.includes("tech") ||
    v.includes("digital") ||
    v.includes("innovation") ||
    v.includes("startup") ||
    /(?:^|[^a-z])ai(?:[^a-z]|$)/.test(v)
  )
    return "tech";
  /* Provincial beats are Cambodian reporting; the province name *is* the category, so the
     hue has to come from a list rather than from the word "news". */
  if (CAMBODIA_BEAT.test(v)) return "news";
  if (
    v.includes("cambodia") ||
    v.includes("khmer") ||
    v.includes("news") ||
    v.includes("national")
  )
    return "news";
  /* Economy & Business, Education & Jobs and Environment stay neutral on purpose: they are
     beats, not sections, and borrowing another section's hue would make the mark lie about
     where the story sits. */
  return "neutral";
}
