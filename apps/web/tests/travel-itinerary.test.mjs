// Run with `npm test` (node --test). Node 24 strips the TypeScript types on import.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildItinerary,
  haversineKm,
  parseHours,
  suggestSlot,
  matchInterests,
  addStop,
  removeStop,
  moveStop,
  moveStopToDay,
  reorderDay,
  updateStop,
  setDayCount,
  encodePlan,
  decodePlan,
  dayLegs,
  priceLevelSummary,
  hoursConflicts,
  nearestTo,
  toCoord,
} from "../src/lib/travel/itinerary.ts";

// A slice of the real Siem Reap rows (coordinates and hours as stored in the directory).
const SIEM_REAP = [
  { slug: "angkor-wat", name: "Angkor Wat", place_type: "TEMPLE", latitude: 13.4125, longitude: 103.867, opening_hours: "05:00 AM - 05:30 PM daily", price_level: "$$$" },
  { slug: "ta-prohm", name: "Ta Prohm", place_type: "TEMPLE", latitude: 13.4348, longitude: 103.8893, opening_hours: "07:30 AM - 05:30 PM daily", price_level: "$$$" },
  { slug: "bayon-temple", name: "Bayon Temple", place_type: "TEMPLE", latitude: 13.4413, longitude: 103.8587, opening_hours: "07:30 AM - 05:30 PM daily", price_level: "$$$" },
  { slug: "banteay-srei", name: "Banteay Srei", place_type: "TEMPLE", latitude: 13.5989, longitude: 103.963, opening_hours: "07:30 AM - 05:00 PM daily", price_level: "$$$" },
  { slug: "phnom-kulen-waterfall", name: "Phnom Kulen Waterfall", place_type: "WATERFALL", latitude: 13.5684, longitude: 104.1037, opening_hours: "07:30 AM - 04:30 PM daily", price_level: "$$$" },
  { slug: "siem-reap-old-market", name: "Old Market", place_type: "MARKET", latitude: 13.3547, longitude: 103.8549, opening_hours: "07:00 AM - 09:00 PM daily", price_level: "$" },
  { slug: "siem-reap-pub-street", name: "Pub Street", place_type: "ACTIVITY", latitude: 13.3551, longitude: 103.854, opening_hours: "05:00 PM - 02:00 AM daily", price_level: "$$" },
  { slug: "raffles", name: "Raffles Grand Hotel", place_type: "ACCOMMODATION", latitude: 13.3664, longitude: 103.8598, opening_hours: "24 hours reception", price_level: "$$$$" },
  { slug: "cuisine-wat-damnak", name: "Cuisine Wat Damnak", place_type: "RESTAURANT", latitude: 13.3538, longitude: 103.8589, opening_hours: "06:30 PM - 11:00 PM (Tuesday-Saturday)", price_level: "$$$" },
];
const bySlug = new Map(SIEM_REAP.map((p) => [p.slug, p]));

test("haversine: Angkor Wat to Banteay Srei is ~21 km in a straight line", () => {
  const km = haversineKm([13.4125, 103.867], [13.5989, 103.963]);
  assert.ok(km > 20 && km < 24, `got ${km}`);
});

test("toCoord rejects missing, zero and out-of-range coordinates", () => {
  assert.equal(toCoord({ latitude: null, longitude: 1 }), null);
  assert.equal(toCoord({ latitude: 0, longitude: 0 }), null);
  assert.equal(toCoord({ latitude: 120, longitude: 10 }), null);
  assert.deepEqual(toCoord({ latitude: "13.4", longitude: "103.8" }), [13.4, 103.8]);
});

test("parseHours reads 12-hour ranges, 24-hour text and past-midnight closes", () => {
  assert.deepEqual(parseHours("07:30 AM - 05:30 PM daily"), { open: 450, close: 1050 });
  assert.deepEqual(parseHours("24 hours reception"), { open: 0, close: 1440 });
  assert.deepEqual(parseHours("05:00 PM - 02:00 AM daily"), { open: 1020, close: 1560 });
  assert.equal(parseHours("Varies by season"), null);
  assert.equal(parseHours(""), null);
});

test("evening-only places are suggested for the evening slot", () => {
  assert.equal(suggestSlot(bySlug.get("siem-reap-pub-street"), "morning"), "evening");
  assert.equal(suggestSlot(bySlug.get("angkor-wat"), "morning"), "morning");
  assert.equal(suggestSlot({ slug: "x", name: "x", place_type: "TEMPLE" }, "afternoon"), "afternoon");
});

test("interest matching uses place types and keywords", () => {
  assert.deepEqual(matchInterests(bySlug.get("angkor-wat"), ["temples", "food"]), ["temples"]);
  assert.deepEqual(matchInterests({ slug: "e", name: "Elephant Valley Project", place_type: "ATTRACTION" }, ["wildlife"]), ["wildlife"]);
});

test("3-day temples plan: only temples, never accommodation, nearby stops grouped", () => {
  const { plan, overflow, reasons } = buildItinerary({ places: SIEM_REAP, days: 3, interests: ["temples"], destination: "siem-reap" });
  const all = plan.days.flatMap((d) => d.stops.map((s) => s.slug));
  assert.equal(plan.days.length, 3);
  assert.ok(all.every((s) => bySlug.get(s).place_type === "TEMPLE"));
  assert.ok(!all.includes("raffles"));
  assert.equal(new Set(all).size, all.length, "no place is scheduled twice");
  assert.equal(overflow.length, 0);
  assert.ok(reasons["angkor-wat"].includes("temples"));
  // No hop within a day exceeds the 45 km straight-line limit.
  for (const d of plan.days) for (const km of dayLegs(d, bySlug)) assert.ok(km === null || km <= 45);
});

test("pinned places are scheduled even when no interest matches them", () => {
  const { plan, reasons } = buildItinerary({ places: SIEM_REAP, days: 1, interests: ["temples"], pinned: ["siem-reap-old-market"], destination: "siem-reap" });
  assert.equal(plan.days[0].stops.some((s) => s.slug === "siem-reap-old-market"), true);
  assert.deepEqual(reasons["siem-reap-old-market"], ["saved"]);
});

test("a far place starts a new day instead of joining a distant chain", () => {
  const places = [
    { slug: "a", name: "A", place_type: "TEMPLE", latitude: 13.41, longitude: 103.86 },
    { slug: "far", name: "Far", place_type: "TEMPLE", latitude: 11.55, longitude: 104.92 },
    { slug: "b", name: "B", place_type: "TEMPLE", latitude: 13.43, longitude: 103.88 },
  ];
  const { plan } = buildItinerary({ places, days: 2, interests: ["temples"], destination: "x" });
  assert.deepEqual(plan.days[0].stops.map((s) => s.slug).sort(), ["a", "b"]);
  assert.deepEqual(plan.days[1].stops.map((s) => s.slug), ["far"]);
});

test("more matches than room: the rest is reported as overflow, not dropped silently", () => {
  const { plan, overflow } = buildItinerary({ places: SIEM_REAP, days: 1, interests: [], destination: "siem-reap", maxStopsPerDay: 3 });
  assert.equal(plan.days[0].stops.length, 3);
  assert.ok(overflow.length > 0);
});

test("an empty province yields empty days, not invented stops", () => {
  const { plan } = buildItinerary({ places: [], days: 2, interests: ["temples"], destination: "pailin" });
  assert.equal(plan.days.length, 2);
  assert.equal(plan.days.flatMap((d) => d.stops).length, 0);
});

test("edit operations: add, remove, move, move to day, reorder, update, resize", () => {
  let plan = { destination: "siem-reap", days: [{ stops: [{ slug: "angkor-wat", slot: "morning" }, { slug: "ta-prohm", slot: "afternoon" }] }, { stops: [] }] };
  plan = addStop(plan, 1, "bayon-temple");
  assert.equal(plan.days[1].stops[0].slug, "bayon-temple");
  assert.equal(addStop(plan, 0, "bayon-temple"), plan, "no duplicates");
  plan = moveStop(plan, 0, 1, -1);
  assert.deepEqual(plan.days[0].stops.map((s) => s.slug), ["ta-prohm", "angkor-wat"]);
  assert.equal(moveStop(plan, 0, 0, -1), plan, "moving past the edge is a no-op");
  plan = moveStopToDay(plan, 0, 0, 1);
  assert.deepEqual(plan.days[1].stops.map((s) => s.slug), ["bayon-temple", "ta-prohm"]);
  plan = reorderDay(plan, 1, ["ta-prohm", "bayon-temple"]);
  assert.deepEqual(plan.days[1].stops.map((s) => s.slug), ["ta-prohm", "bayon-temple"]);
  plan = updateStop(plan, 1, 0, { note: "Bring water", time: "09:15" });
  assert.equal(plan.days[1].stops[0].note, "Bring water");
  plan = removeStop(plan, 0, 0);
  assert.equal(plan.days[0].stops.length, 0);
  plan = setDayCount(plan, 1);
  assert.equal(plan.days.length, 1);
  assert.equal(plan.days[0].stops.length, 2, "stops on removed days are kept");
});

test("share link round-trips destination, order, slots and times (not notes)", () => {
  const plan = { destination: "siem-reap", days: [{ stops: [{ slug: "angkor-wat", slot: "morning", time: "05:15", note: "secret" }] }, { stops: [{ slug: "siem-reap-pub-street", slot: "evening" }] }] };
  const decoded = decodePlan(encodePlan(plan));
  assert.deepEqual(decoded, { destination: "siem-reap", days: [{ stops: [{ slug: "angkor-wat", slot: "morning", time: "05:15" }] }, { stops: [{ slug: "siem-reap-pub-street", slot: "evening" }] }] });
  assert.equal(decodePlan("<script>~x"), null);
  assert.equal(decodePlan(""), null);
  assert.deepEqual(decodePlan("kep~bad slug!,ok-slug.m").days[0].stops, [{ slug: "ok-slug", slot: "morning" }]);
});

test("summaries: price levels counted, hours conflicts flagged, nearest sorted", () => {
  const plan = { destination: "siem-reap", days: [{ stops: [{ slug: "siem-reap-pub-street", slot: "morning" }, { slug: "angkor-wat", slot: "morning" }, { slug: "unknown", slot: "afternoon" }] }] };
  const summary = priceLevelSummary(plan, bySlug);
  assert.deepEqual(summary, { counts: { $$: 1, $$$: 1 }, unknown: 1 });
  assert.deepEqual(hoursConflicts(plan, bySlug), ["siem-reap-pub-street"]);
  const near = nearestTo(bySlug.get("angkor-wat"), SIEM_REAP, 2);
  assert.equal(near.length, 2);
  assert.ok(near[0].km <= near[1].km);
});
