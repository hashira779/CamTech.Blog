/**
 * The trip-planning engine: deterministic rules over real directory rows.
 *
 * Deliberately free of imports (and of anything but erasable TypeScript) so the same file runs in
 * the planner, on the server, and under `node --test` without a bundler.
 *
 * Ground rules, because a travel plan is advice someone acts on:
 *   - Only places from the directory are scheduled. Nothing is invented to fill a slot.
 *   - Distances are straight-line (haversine) and are labelled that way everywhere. They are a
 *     lower bound on road distance, never a drive time.
 *   - A day never chains stops whose straight-line hops exceed `maxHopKm`; a far place starts a
 *     new day instead, and a place far from the trip's base is flagged as needing travel time.
 *   - Opening hours are only used when the record carries a parseable range; otherwise the stop
 *     is marked "hours not recorded" rather than assumed open.
 *   - No money figures: the directory has price *levels*, not prices, so the budget summary
 *     counts levels and says so.
 */

export interface PlanPlace {
  slug: string;
  name: string;
  local_name?: string | null;
  place_type: string;
  description?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  opening_hours?: string | null;
  price_level?: string | null;
  hero_image_url?: string | null;
  destination_slug?: string | null;
}

export type InterestId =
  | "temples"
  | "beaches"
  | "nature"
  | "mountains"
  | "culture"
  | "food"
  | "city"
  | "family"
  | "photography"
  | "wildlife";

export const INTEREST_IDS: InterestId[] = [
  "temples",
  "beaches",
  "nature",
  "mountains",
  "culture",
  "food",
  "city",
  "family",
  "photography",
  "wildlife",
];

/** How each interest maps onto the directory's place types and, for a few, name/description keywords. */
const INTEREST_RULES: Record<InterestId, { types: string[]; keywords?: RegExp }> = {
  // No bare "wat": restaurant names borrow it ("Cuisine Wat Damnak"); pagodas are typed TEMPLE.
  temples: { types: ["TEMPLE"], keywords: /temple|prasat|angkor|pagoda|archaeolog/i },
  beaches: { types: ["BEACH", "RESORT"], keywords: /beach|island|koh |bay\b/i },
  nature: { types: ["WATERFALL", "NATIONAL_PARK", "LAKE", "HIDDEN_GEM"] },
  mountains: { types: ["NATIONAL_PARK"], keywords: /mountain|phnom |plateau|trek|hill|ridge|cardamom/i },
  culture: { types: ["MUSEUM", "TEMPLE"], keywords: /culture|heritage|craft|silk|palace|museum|tradition/i },
  food: { types: ["RESTAURANT", "CAFE", "MARKET"] },
  city: { types: ["MARKET", "MUSEUM", "ACTIVITY"], keywords: /city|street|riverside|palace|market/i },
  family: { types: ["LAKE", "NATIONAL_PARK", "BEACH", "MUSEUM"], keywords: /family|children|kids/i },
  photography: { types: ["TEMPLE", "WATERFALL", "LAKE", "BEACH"], keywords: /sunrise|sunset|viewpoint|photo/i },
  wildlife: { types: [], keywords: /wildlife|elephant|dolphin|bird|sanctuary|gibbon|mangrove/i },
};

/** Place types that are never scheduled as a visit (you sleep there; they live in their own list). */
const NOT_A_VISIT = new Set(["ACCOMMODATION"]);

export interface ScheduledStop {
  slug: string;
  /** "morning" | "afternoon" | "evening" — a suggestion from opening hours, editable. */
  slot: Slot;
  /** Free text the traveller types; never generated. */
  note?: string;
  /** Planned time "HH:MM" (24h), set by the traveller; empty by default. */
  time?: string;
}

export type Slot = "morning" | "afternoon" | "evening";

export interface PlanDay {
  stops: ScheduledStop[];
}

export interface Plan {
  destination: string;
  days: PlanDay[];
}

export interface BuildOptions {
  places: PlanPlace[];
  days: number;
  interests: InterestId[];
  /** Slugs the traveller saved with "Add to trip"; they are scheduled first. */
  pinned?: string[];
  destination: string;
  maxStopsPerDay?: number;
  maxHopKm?: number;
}

export interface BuildResult {
  plan: Plan;
  /** Places that matched but did not fit in the days available. */
  overflow: string[];
  /** Why each scheduled place was chosen, for the "why this" line. */
  reasons: Record<string, string[]>;
}

// ── Geometry ─────────────────────────────────────────────────────────────────

export function toCoord(p: Pick<PlanPlace, "latitude" | "longitude">): [number, number] | null {
  if (p.latitude == null || p.longitude == null || p.latitude === "" || p.longitude === "") return null;
  const lat = Number(p.latitude);
  const lng = Number(p.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
}

/** Great-circle distance in kilometres. Straight line — not a road distance. */
export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function distanceBetween(a: PlanPlace | undefined, b: PlanPlace | undefined): number | null {
  if (!a || !b) return null;
  const ca = toCoord(a);
  const cb = toCoord(b);
  return ca && cb ? haversineKm(ca, cb) : null;
}

/** Places sorted by straight-line distance from `origin`, excluding itself and the unplottable. */
export function nearestTo(origin: PlanPlace, pool: PlanPlace[], limit = 4, maxKm = Infinity) {
  const o = toCoord(origin);
  if (!o) return [];
  return pool
    .filter((p) => p.slug !== origin.slug)
    .map((p) => {
      const c = toCoord(p);
      return c ? { place: p, km: haversineKm(o, c) } : null;
    })
    .filter((x): x is { place: PlanPlace; km: number } => x !== null && x.km <= maxKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);
}

// ── Opening hours ────────────────────────────────────────────────────────────

/**
 * Parses the first "07:30 AM - 05:30 PM" style range in a free-text hours field into minutes
 * after midnight. Returns null when the field does not hold a clear range; a close time earlier
 * than the open time is read as past midnight.
 */
export function parseHours(text?: string | null): { open: number; close: number } | null {
  if (!text) return null;
  if (/24\s*hours/i.test(text)) return { open: 0, close: 24 * 60 };
  const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!m) return null;
  const toMin = (h: string, min: string | undefined, ap: string | undefined) => {
    const raw = Number(h);
    if (raw > 24 || Number(min ?? 0) > 59) return NaN;
    let hour = ap ? raw % 12 : raw;
    if (ap && ap.toUpperCase() === "PM") hour += 12;
    return hour * 60 + Number(min ?? 0);
  };
  const open = toMin(m[1], m[2], m[3]);
  let close = toMin(m[4], m[5], m[6]);
  if (!Number.isFinite(open) || !Number.isFinite(close)) return null;
  if (close <= open) close += 24 * 60;
  return { open, close };
}

/** The slot a place suits from its hours; evening-only places (opening 4 pm or later) go last. */
export function suggestSlot(p: PlanPlace, fallback: Slot): Slot {
  const h = parseHours(p.opening_hours);
  if (!h) return fallback;
  if (h.open >= 16 * 60) return "evening";
  if (h.close <= 13 * 60) return "morning";
  return fallback;
}

// ── Interests ────────────────────────────────────────────────────────────────

export function matchInterests(p: PlanPlace, interests: InterestId[]): InterestId[] {
  const text = `${p.name} ${p.description ?? ""}`;
  return interests.filter((id) => {
    const rule = INTEREST_RULES[id];
    if (rule.types.includes(p.place_type)) return true;
    return rule.keywords ? rule.keywords.test(text) : false;
  });
}

// ── Building ─────────────────────────────────────────────────────────────────

const SLOT_ORDER: Slot[] = ["morning", "afternoon", "evening"];

/**
 * Builds a plan for one province:
 *   1. candidates = pinned places + places matching at least one interest (all visit-type places
 *      when no interest is chosen), ranked by pinned → number of interests matched → original order;
 *   2. days are filled by a nearest-neighbour walk from the strongest remaining candidate, never
 *      taking a hop longer than `maxHopKm`, up to `maxStopsPerDay`;
 *   3. within a day, stops are ordered by suggested slot so evening-only places come last.
 */
export function buildItinerary(opts: BuildOptions): BuildResult {
  const days = Math.min(Math.max(Math.round(opts.days) || 1, 1), 14);
  const maxStops = opts.maxStopsPerDay ?? 3;
  const maxHop = opts.maxHopKm ?? 45;
  const pinned = new Set(opts.pinned ?? []);
  const reasons: Record<string, string[]> = {};

  const visitable = opts.places.filter((p) => !NOT_A_VISIT.has(p.place_type));
  const ranked = visitable
    .map((p, index) => {
      const matched = opts.interests.length ? matchInterests(p, opts.interests) : [];
      const isPinned = pinned.has(p.slug);
      return { p, index, matched, isPinned };
    })
    .filter((c) => c.isPinned || opts.interests.length === 0 || c.matched.length > 0)
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.matched.length - a.matched.length || a.index - b.index);

  for (const c of ranked) {
    const why: string[] = [];
    if (c.isPinned) why.push("saved");
    for (const m of c.matched) why.push(m);
    reasons[c.p.slug] = why;
  }

  const remaining = ranked.map((c) => c.p);
  const planDays: PlanDay[] = [];

  for (let d = 0; d < days && remaining.length > 0; d++) {
    const seed = remaining.shift() as PlanPlace;
    const chain: PlanPlace[] = [seed];
    while (chain.length < maxStops && remaining.length > 0) {
      const last = chain[chain.length - 1];
      const lastC = toCoord(last);
      let bestIdx = -1;
      let bestKm = Infinity;
      remaining.forEach((cand, i) => {
        const c = toCoord(cand);
        // Unplottable places can join a day only when the day itself has no coordinates to protect.
        const km = lastC && c ? haversineKm(lastC, c) : lastC || c ? Infinity : 0;
        if (km <= maxHop && km < bestKm) {
          bestKm = km;
          bestIdx = i;
        }
      });
      if (bestIdx < 0) break;
      chain.push(remaining.splice(bestIdx, 1)[0]);
    }
    const stops = chain
      .map((p, i) => ({ slug: p.slug, slot: suggestSlot(p, SLOT_ORDER[Math.min(i, 1)]) }))
      .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
    planDays.push({ stops });
  }

  while (planDays.length < days) planDays.push({ stops: [] });

  return {
    plan: { destination: opts.destination, days: planDays },
    overflow: remaining.map((p) => p.slug),
    reasons,
  };
}

// ── Editing (pure; every operation returns a new plan) ───────────────────────

function clonePlan(plan: Plan): Plan {
  return { destination: plan.destination, days: plan.days.map((d) => ({ stops: d.stops.map((s) => ({ ...s })) })) };
}

export function planHas(plan: Plan, slug: string): boolean {
  return plan.days.some((d) => d.stops.some((s) => s.slug === slug));
}

export function addStop(plan: Plan, day: number, slug: string, slot: Slot = "afternoon"): Plan {
  if (planHas(plan, slug)) return plan;
  const next = clonePlan(plan);
  while (next.days.length <= day) next.days.push({ stops: [] });
  next.days[day].stops.push({ slug, slot });
  return next;
}

export function removeStop(plan: Plan, day: number, index: number): Plan {
  const next = clonePlan(plan);
  next.days[day]?.stops.splice(index, 1);
  return next;
}

export function moveStop(plan: Plan, day: number, index: number, delta: number): Plan {
  const next = clonePlan(plan);
  const stops = next.days[day]?.stops;
  if (!stops) return plan;
  const to = index + delta;
  if (to < 0 || to >= stops.length) return plan;
  const [s] = stops.splice(index, 1);
  stops.splice(to, 0, s);
  return next;
}

export function moveStopToDay(plan: Plan, fromDay: number, index: number, toDay: number): Plan {
  if (fromDay === toDay) return plan;
  const next = clonePlan(plan);
  const [s] = next.days[fromDay]?.stops.splice(index, 1) ?? [];
  if (!s) return plan;
  while (next.days.length <= toDay) next.days.push({ stops: [] });
  next.days[toDay].stops.push(s);
  return next;
}

export function reorderDay(plan: Plan, day: number, slugs: string[]): Plan {
  const next = clonePlan(plan);
  const bySlug = new Map(next.days[day]?.stops.map((s) => [s.slug, s]));
  const ordered = slugs.map((s) => bySlug.get(s)).filter((s): s is ScheduledStop => Boolean(s));
  if (!next.days[day] || ordered.length !== next.days[day].stops.length) return plan;
  next.days[day].stops = ordered;
  return next;
}

export function updateStop(plan: Plan, day: number, index: number, patch: Partial<Pick<ScheduledStop, "note" | "time" | "slot">>): Plan {
  const next = clonePlan(plan);
  const s = next.days[day]?.stops[index];
  if (!s) return plan;
  Object.assign(s, patch);
  return next;
}

export function setDayCount(plan: Plan, days: number): Plan {
  const next = clonePlan(plan);
  const n = Math.min(Math.max(days, 1), 14);
  while (next.days.length < n) next.days.push({ stops: [] });
  if (next.days.length > n) {
    // Stops on removed days move to the new last day rather than vanishing.
    const spill = next.days.splice(n).flatMap((d) => d.stops);
    next.days[n - 1].stops.push(...spill);
  }
  return next;
}

// ── Summaries ────────────────────────────────────────────────────────────────

/** Straight-line kilometres between consecutive plottable stops of one day. */
export function dayLegs(day: PlanDay, bySlug: Map<string, PlanPlace>): (number | null)[] {
  return day.stops.slice(1).map((s, i) => distanceBetween(bySlug.get(day.stops[i].slug), bySlug.get(s.slug)));
}

/** Count of stops per recorded price level — the directory carries levels, not prices. */
export function priceLevelSummary(plan: Plan, bySlug: Map<string, PlanPlace>) {
  const counts: Record<string, number> = {};
  let unknown = 0;
  for (const d of plan.days) {
    for (const s of d.stops) {
      const lvl = bySlug.get(s.slug)?.price_level;
      if (lvl) counts[lvl] = (counts[lvl] ?? 0) + 1;
      else unknown++;
    }
  }
  return { counts, unknown };
}

/** Stops whose opening hours do not cover the slot they are in, using only parseable hours. */
export function hoursConflicts(plan: Plan, bySlug: Map<string, PlanPlace>): string[] {
  const window: Record<Slot, [number, number]> = { morning: [8 * 60, 12 * 60], afternoon: [13 * 60, 17 * 60], evening: [18 * 60, 21 * 60] };
  const out: string[] = [];
  for (const d of plan.days) {
    for (const s of d.stops) {
      const h = parseHours(bySlug.get(s.slug)?.opening_hours);
      if (!h) continue;
      const [a, b] = window[s.slot];
      const overlaps = h.open < b && h.close > a;
      if (!overlaps) out.push(s.slug);
    }
  }
  return out;
}

// ── Sharing ──────────────────────────────────────────────────────────────────

/**
 * A plan as a URL-safe string: `destination~slug.slot.HHMM,slug.slot|day2…`. Notes are not
 * included (they are personal and could be long); times and slots are.
 */
export function encodePlan(plan: Plan): string {
  const slotCode: Record<Slot, string> = { morning: "m", afternoon: "a", evening: "e" };
  const days = plan.days
    .map((d) => d.stops.map((s) => [s.slug, slotCode[s.slot], (s.time ?? "").replace(":", "")].filter(Boolean).join(".")).join(","))
    .join("|");
  return `${plan.destination}~${days}`;
}

export function decodePlan(text: string | null | undefined): Plan | null {
  if (!text) return null;
  const [destination, rest] = text.split("~");
  if (!destination || !/^[a-z0-9-]+$/.test(destination) || rest === undefined) return null;
  const slotFrom: Record<string, Slot> = { m: "morning", a: "afternoon", e: "evening" };
  const days = rest.split("|").slice(0, 14).map((d) => ({
    stops: d
      ? d
          .split(",")
          .slice(0, 12)
          .map((part) => {
            const [slug, code, hhmm] = part.split(".");
            if (!slug || !/^[a-z0-9-]+$/.test(slug)) return null;
            const time = hhmm && /^\d{4}$/.test(hhmm) ? `${hhmm.slice(0, 2)}:${hhmm.slice(2)}` : undefined;
            return { slug, slot: slotFrom[code] ?? "afternoon", ...(time ? { time } : {}) } as ScheduledStop;
          })
          .filter((s): s is ScheduledStop => s !== null)
      : [],
  }));
  return { destination, days: days.length ? days : [{ stops: [] }] };
}
