"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  Compass,
  Link2,
  Loader2,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { API_BASE, getDestinations } from "@/lib/api";
import type { Destination, Place } from "@/types";
import {
  INTEREST_IDS,
  addStop,
  buildItinerary,
  decodePlan,
  encodePlan,
  hoursConflicts,
  priceLevelSummary,
  setDayCount,
  toCoord,
  type InterestId,
  type Plan,
  type PlanPlace,
} from "@/lib/travel/itinerary";
import { deletePlan, savePlan, useSavedPlaces, useSavedPlans } from "@/lib/travel/trip-store";
import { usePlannerCopy } from "@/components/travel/planner/planner-copy";
import { ItineraryEditor } from "@/components/travel/planner/ItineraryEditor";
import type { RouteStop } from "@/components/travel/planner/ItineraryMapCanvas";
import { JourneyImage } from "@/components/travel/journey/JourneyImage";

const ItineraryMapCanvas = dynamic(() => import("@/components/travel/planner/ItineraryMapCanvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-muted" />,
});

type Pace = "relaxed" | "balanced" | "full";
const PACE_STOPS: Record<Pace, number> = { relaxed: 2, balanced: 3, full: 4 };
const BUDGETS = ["$", "$$", "$$$", "$$$$"];
const LEVEL_RANK: Record<string, number> = { FREE: 0, $: 1, $$: 2, $$$: 3, $$$$: 4 };
const INTEREST_ICONS: Record<InterestId, string> = {
  temples: "🛕",
  beaches: "🏝️",
  nature: "🌿",
  mountains: "⛰️",
  culture: "🪷",
  food: "🍜",
  city: "🏙️",
  family: "👨‍👩‍👧",
  photography: "📷",
  wildlife: "🐘",
};

function toPlanPlace(p: Place, destinationSlug: string): PlanPlace {
  return {
    slug: p.slug,
    name: p.name,
    local_name: p.local_name,
    place_type: p.place_type,
    description: p.description,
    latitude: p.latitude,
    longitude: p.longitude,
    opening_hours: p.opening_hours,
    price_level: p.price_level,
    hero_image_url: p.hero_image_url,
    destination_slug: destinationSlug,
  };
}

const field = "flex flex-col gap-2";
const fieldLabel = "text-xs font-semibold uppercase tracking-[0.08em] text-foreground";
const control =
  "min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const pill = (on: boolean) =>
  `inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
    on ? "border-transparent bg-tv-jungle text-tv-ivory" : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
  }`;

/**
 * The trip planner.
 *
 * Step 1 collects preferences (only the province and length are needed), step 2 interests, and
 * step 3 is the itinerary: built by the deterministic rules in `lib/travel/itinerary.ts` from the
 * province's directory rows, then fully editable — reorder by drag or by buttons, move between
 * days, set times and notes, add or remove places. Saving keeps the plan in this browser and says
 * so; the share link carries the plan itself, so it opens on any device without an account.
 *
 * The old version's "Save" only flashed a tick and "Share" copied the bare page URL; both now do
 * what they say. Its budget tiers quoted dollar-per-day ranges with no source — the planner now
 * uses the price *levels* the directory records and labels them as such.
 */
function Planner() {
  const params = useSearchParams();
  const { t, lang, num } = usePlannerCopy();
  const savedPlaces = useSavedPlaces();
  const savedPlans = useSavedPlans();

  const [shared] = useState(() => decodePlan(params.get("plan")));
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [chosenProvince, setChosenProvince] = useState<string | null>(() => shared?.destination ?? params.get("destination"));
  const [days, setDays] = useState(() => (shared ? shared.days.length : 3));
  const [travelers, setTravelers] = useState("");
  const [budget, setBudget] = useState("");
  const [pace, setPace] = useState<Pace>("balanced");
  const [mobility, setMobility] = useState(false);
  const [interests, setInterests] = useState<InterestId[]>([]);
  const [step, setStep] = useState(shared ? 3 : 1);
  const [plan, setPlan] = useState<Plan | null>(shared);
  const [reasons, setReasons] = useState<Record<string, string[]>>({});
  const [overflow, setOverflow] = useState<string[]>([]);
  const [placesState, setPlacesState] = useState<{ slug: string; ok: boolean; places: PlanPlace[] } | null>(null);
  const [tripName, setTripName] = useState("");
  const [savedMsg, setSavedMsg] = useState<"" | "ok" | "fail">("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [overflowDay, setOverflowDay] = useState(0);

  // Coming from "Your trip": start in the province holding most saved places.
  const savedProvince = useMemo(() => {
    if (params.get("from") !== "saved") return null;
    const counts = new Map<string, number>();
    for (const p of savedPlaces) if (p.destination_slug) counts.set(p.destination_slug, (counts.get(p.destination_slug) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [params, savedPlaces]);
  const province = chosenProvince ?? savedProvince ?? "siem-reap";
  const destination = destinations.find((d) => d.slug === province);
  const destName = destination ? (lang === "km" && destination.name_km ? destination.name_km : destination.name) : province;

  useEffect(() => {
    let cancelled = false;
    getDestinations().then((list) => {
      if (!cancelled && list.length) setDestinations(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The province's places, fetched whenever the province changes. The API caps a page at 100.
  useEffect(() => {
    let cancelled = false;
    const page = (offset: number) =>
      fetch(`${API_BASE}/travel/places?destination=${encodeURIComponent(province)}&limit=100&offset=${offset}`, {
        signal: AbortSignal.timeout(10000),
      }).then((r) => (r.ok ? (r.json() as Promise<{ items: Place[]; total: number }>) : Promise.reject(new Error(String(r.status)))));
    (async () => {
      const first = await page(0);
      const items = [...first.items];
      for (let offset = 100; offset < Math.min(first.total, 500); offset += 100) items.push(...(await page(offset)).items);
      return items;
    })()
      .then((items) => {
        if (!cancelled) setPlacesState({ slug: province, ok: true, places: items.map((p) => toPlanPlace(p, province)) });
      })
      .catch(() => {
        if (!cancelled) setPlacesState({ slug: province, ok: false, places: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [province]);

  const loadingPlaces = placesState?.slug !== province;
  const places = useMemo(() => (placesState?.slug === province ? placesState.places : []), [placesState, province]);
  const bySlug = useMemo(() => new Map(places.map((p) => [p.slug, p])), [places]);
  const pinned = savedPlaces.filter((p) => p.destination_slug === province || (!p.destination_slug && bySlug.has(p.slug))).map((p) => p.slug);
  const savedElsewhere = savedPlaces.filter((p) => p.destination_slug && p.destination_slug !== province);

  const build = () => {
    const maxStops = mobility ? Math.min(PACE_STOPS[pace], 2) : PACE_STOPS[pace];
    const budgetRank = budget ? LEVEL_RANK[budget] : Infinity;
    const pool = places.filter((p) => pinned.includes(p.slug) || !p.price_level || (LEVEL_RANK[p.price_level] ?? 0) <= budgetRank);
    const result = buildItinerary({ places: pool, days, interests, pinned, destination: province, maxStopsPerDay: maxStops });
    setPlan(result.plan);
    setReasons(result.reasons);
    setOverflow(result.overflow);
    setShareUrl("");
    setSavedMsg("");
    setStep(3);
  };

  const conflicts = useMemo(() => new Set(plan ? hoursConflicts(plan, bySlug) : []), [plan, bySlug]);
  const prices = plan ? priceLevelSummary(plan, bySlug) : null;
  const stopCount = plan ? plan.days.reduce((n, d) => n + d.stops.length, 0) : 0;
  const unknownStops = plan && !loadingPlaces ? plan.days.flatMap((d) => d.stops).filter((s) => !bySlug.has(s.slug)).length : 0;
  const routeStops: RouteStop[] = useMemo(
    () =>
      plan
        ? plan.days.flatMap((d, di) =>
            d.stops.flatMap((s, si) => {
              const p = bySlug.get(s.slug);
              const c = p ? toCoord(p) : null;
              return p && c ? [{ slug: s.slug, name: p.name, lat: c[0], lng: c[1], day: di, order: si }] : [];
            })
          )
        : [],
    [plan, bySlug]
  );

  const doShare = async () => {
    if (!plan) return;
    const url = `${window.location.origin}/travel/planner?plan=${encodeURIComponent(encodePlan(plan))}`;
    setShareUrl(url);
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked: the link is shown in a field to copy by hand.
    }
  };

  const doSave = () => {
    if (!plan) return;
    const notes: Record<string, string> = {};
    for (const d of plan.days) for (const s of d.stops) if (s.note) notes[s.slug] = s.note;
    const entry = savePlan({ name: tripName.trim() || `${destName} · ${t.daysUnit(plan.days.length)}`, code: encodePlan(plan), notes });
    setSavedMsg(entry ? "ok" : "fail");
  };

  const openSaved = (code: string, notes?: Record<string, string>) => {
    const decoded = decodePlan(code);
    if (!decoded) return;
    decoded.days.forEach((d) => d.stops.forEach((s) => notes?.[s.slug] && (s.note = notes[s.slug])));
    setChosenProvince(decoded.destination);
    setDays(decoded.days.length);
    setPlan(decoded);
    setReasons({});
    setOverflow([]);
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleInterest = (id: InterestId) =>
    setInterests((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const stepButton = (n: number, label: string) => {
    const enabled = n < 3 || plan !== null;
    return (
      <li key={n} className="flex items-center gap-2">
        <button
          type="button"
          disabled={!enabled}
          aria-current={step === n ? "step" : undefined}
          onClick={() => setStep(n)}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
            step === n ? "bg-tv-jungle text-tv-ivory" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${step === n ? "bg-tv-ivory/20" : "bg-surface-muted"}`}>
            {step > n ? <Check size={13} aria-hidden="true" /> : num(n)}
          </span>
          {label}
        </button>
        {n < 3 && <span aria-hidden="true" className="h-px w-6 bg-border sm:w-10" />}
      </li>
    );
  };

  return (
    <div className="it-page min-h-screen bg-background pb-24 text-foreground">
      {/* ── Masthead ─────────────────────────────────────────────────────── */}
      <section className="tv-planner-head relative overflow-hidden border-b border-border">
        <div className="container-page relative py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="it-no-print mb-6 text-xs text-muted-foreground">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/travel" className="hover:text-foreground">
                  {lang === "km" ? "ទេសចរណ៍" : "Travel"}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground">
                {t.label}
              </li>
            </ol>
          </nav>
          <p className="tv-eyebrow text-category-travel">{t.label}</p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight tracking-tight sm:text-5xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{t.lead}</p>
          <ol className="it-no-print mt-8 flex flex-wrap items-center gap-1" aria-label={t.stepOf(step, 3)}>
            {t.steps.map((label, i) => stepButton(i + 1, label))}
          </ol>
        </div>
      </section>

      <div className="container-page mt-10">
          {/* ── Step 1: preferences ─────────────────────────────────────── */}
          {step === 1 && (
            <form
              key="s1"
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
              className="tv-swap-in mx-auto max-w-3xl space-y-8 rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              <p className="section-label">{t.stepOf(1, 3)}</p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className={`${field} sm:col-span-2`}>
                  <label htmlFor="it-province" className={fieldLabel}>
                    {t.province}
                  </label>
                  <select id="it-province" value={province} onChange={(e) => setChosenProvince(e.target.value)} className={control} required>
                    {destinations.length === 0 && <option value={province}>{destName}</option>}
                    {[...destinations]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((d) => (
                        <option key={d.slug} value={d.slug}>
                          {d.name}
                          {d.name_km ? ` · ${d.name_km}` : ""}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-muted-foreground">{t.provinceHint}</p>
                </div>

                <div className={field}>
                  <span id="it-days-label" className={fieldLabel}>
                    {t.days}
                  </span>
                  <div className="flex items-center gap-2" role="group" aria-labelledby="it-days-label">
                    <button type="button" aria-label="−1" onClick={() => setDays((d) => Math.max(1, d - 1))} className="it-icon-btn h-11 w-11">
                      <Minus size={16} aria-hidden="true" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={days}
                      onChange={(e) => setDays(Math.min(14, Math.max(1, Number(e.target.value) || 1)))}
                      aria-labelledby="it-days-label"
                      className={`${control} w-20 text-center tabular-nums`}
                    />
                    <button type="button" aria-label="+1" onClick={() => setDays((d) => Math.min(14, d + 1))} className="it-icon-btn h-11 w-11">
                      <Plus size={16} aria-hidden="true" />
                    </button>
                    <span className="text-sm text-muted-foreground">{t.daysUnit(days)}</span>
                  </div>
                </div>

                <div className={field}>
                  <label htmlFor="it-travelers" className={fieldLabel}>
                    {t.travelers}
                  </label>
                  <input
                    id="it-travelers"
                    type="number"
                    min={1}
                    max={50}
                    inputMode="numeric"
                    value={travelers}
                    onChange={(e) => setTravelers(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
                    className={control}
                  />
                </div>

                <fieldset className={`${field} sm:col-span-2`}>
                  <legend className={`${fieldLabel} mb-2`}>{t.budget}</legend>
                  <div className="flex flex-wrap gap-2">
                    {["", ...BUDGETS].map((b) => (
                      <button key={b || "any"} type="button" aria-pressed={budget === b} onClick={() => setBudget(b)} className={pill(budget === b)}>
                        {b || t.budgetAny}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{t.budgetHint}</p>
                </fieldset>

                <fieldset className={`${field} sm:col-span-2`}>
                  <legend className={`${fieldLabel} mb-2`}>{t.pace}</legend>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(PACE_STOPS) as Pace[]).map((p) => (
                      <button key={p} type="button" aria-pressed={pace === p} onClick={() => setPace(p)} className={pill(pace === p)}>
                        {t.paces[p]}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="flex items-start gap-3 sm:col-span-2">
                  <input type="checkbox" checked={mobility} onChange={(e) => setMobility(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--tv-jungle)]" />
                  <span>
                    <span className="text-sm font-semibold text-foreground">{t.mobility}</span>
                    <span className="block text-xs text-muted-foreground">{t.mobilityHint}</span>
                  </span>
                </label>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="tv-btn tv-btn-gold">
                  {t.next}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: interests ───────────────────────────────────────── */}
          {step === 2 && (
            <div
              key="s2"
              className="tv-swap-in mx-auto max-w-4xl space-y-8 rounded-2xl border border-border bg-card p-6 sm:p-8"
            >
              <div>
                <p className="section-label">{t.stepOf(2, 3)}</p>
                <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">{t.interestsTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t.interestsLead}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5" role="group" aria-label={t.interestsTitle}>
                {INTEREST_IDS.map((id) => {
                  const on = interests.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleInterest(id)}
                      className={`it-interest group relative flex min-h-28 flex-col items-start justify-between gap-3 rounded-xl border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                        on ? "border-transparent bg-tv-jungle text-tv-ivory shadow-md" : "border-border bg-background text-foreground hover:-translate-y-0.5 hover:border-border-strong"
                      }`}
                    >
                      <span aria-hidden="true" className="text-2xl">
                        {INTEREST_ICONS[id]}
                      </span>
                      <span className="text-sm font-semibold leading-snug">{t.interests[id]}</span>
                      {on && <Check size={16} aria-hidden="true" className="absolute right-3 top-3" />}
                    </button>
                  );
                })}
              </div>

              {loadingPlaces && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                  <Loader2 size={15} aria-hidden="true" className="animate-spin" />
                  {t.loadingPlaces}
                </p>
              )}
              {!loadingPlaces && placesState && !placesState.ok && (
                <p role="alert" className="text-sm text-destructive">
                  {t.placesFailed}
                </p>
              )}
              {!loadingPlaces && placesState?.ok && places.length === 0 && (
                <p role="status" className="text-sm text-muted-foreground">
                  {t.noPlaces(destName)}
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => setStep(1)} className="tv-btn-sm">
                  <ArrowLeft size={15} aria-hidden="true" />
                  {t.back}
                </button>
                <button type="button" onClick={build} disabled={loadingPlaces || places.length === 0} className="tv-btn tv-btn-gold disabled:opacity-50">
                  <Compass size={16} aria-hidden="true" />
                  {t.build}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: itinerary ───────────────────────────────────────── */}
          {step === 3 && plan && (
            <div key="s3" className="tv-swap-in grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="section-label">{t.stepOf(3, 3)}</p>
                    <h2 className="mt-2 font-display text-3xl tracking-tight">
                      {destName} · {t.daysUnit(plan.days.length)}
                    </h2>
                    {shared && plan === shared && <p className="mt-1 text-sm text-muted-foreground">{t.sharedLoaded}</p>}
                  </div>
                  <div className="it-no-print flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1" role="group" aria-label={t.days}>
                      <button type="button" aria-label="−1" onClick={() => setPlan(setDayCount(plan, plan.days.length - 1))} disabled={plan.days.length <= 1} className="it-icon-btn">
                        <Minus size={15} aria-hidden="true" />
                      </button>
                      <span className="min-w-14 text-center text-sm tabular-nums">{t.daysUnit(plan.days.length)}</span>
                      <button type="button" aria-label="+1" onClick={() => setPlan(setDayCount(plan, plan.days.length + 1))} disabled={plan.days.length >= 14} className="it-icon-btn">
                        <Plus size={15} aria-hidden="true" />
                      </button>
                    </div>
                    <button type="button" onClick={() => setStep(2)} className="tv-btn-sm">
                      <RotateCcw size={14} aria-hidden="true" />
                      {t.rebuild}
                    </button>
                  </div>
                </div>

                {loadingPlaces ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                    <Loader2 size={15} aria-hidden="true" className="animate-spin" />
                    {t.loadingPlaces}
                  </p>
                ) : (
                  <>
                    {placesState && !placesState.ok && (
                      <p role="alert" className="mb-4 text-sm text-destructive">
                        {t.placesFailed}
                      </p>
                    )}
                    {unknownStops > 0 && placesState?.ok && (
                      <p role="status" className="mb-4 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground">
                        {t.unknownPlace}
                      </p>
                    )}
                    <ItineraryEditor plan={plan} onChange={setPlan} bySlug={bySlug} reasons={reasons} conflicts={conflicts} />
                  </>
                )}

                {overflow.filter((s) => bySlug.has(s) && !plan.days.some((d) => d.stops.some((x) => x.slug === s))).length > 0 && (
                  <section className="it-no-print mt-10 rounded-2xl border border-border bg-surface-muted/50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-display text-lg">{t.overflowTitle}</h3>
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="sr-only">{t.moveToDay}</span>
                        <select value={overflowDay} onChange={(e) => setOverflowDay(Number(e.target.value))} className="min-h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                          {plan.days.map((_, d) => (
                            <option key={d} value={d}>
                              {t.toDay(d + 1)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {overflow
                        .filter((s) => bySlug.has(s) && !plan.days.some((d) => d.stops.some((x) => x.slug === s)))
                        .map((s) => (
                          <li key={s}>
                            <button type="button" onClick={() => setPlan(addStop(plan, Math.min(overflowDay, plan.days.length - 1), s))} className="tv-btn-sm">
                              <Plus size={13} aria-hidden="true" />
                              {bySlug.get(s)?.name}
                            </button>
                          </li>
                        ))}
                    </ul>
                  </section>
                )}

                {savedElsewhere.length > 0 && (
                  <section className="it-no-print mt-6 rounded-2xl border border-border p-5">
                    <h3 className="font-display text-lg">{t.savedElsewhere}</h3>
                    <p className="text-xs text-muted-foreground">{t.savedElsewhereHint}</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {savedElsewhere.map((p) => (
                        <li key={p.slug}>
                          <Link href={`/travel/place/${p.slug}`} className="tv-btn-sm">
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              {/* ── Summary & actions ───────────────────────────────────── */}
              <aside className="space-y-6 lg:col-span-5">
                <div className="space-y-6 lg:sticky lg:top-24">
                  <div className="overflow-hidden rounded-2xl border border-border bg-card">
                    <div className="it-map relative h-72">
                      <ItineraryMapCanvas stops={routeStops} />
                    </div>
                    <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">{t.mapNote}</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="font-display text-lg">{t.summary}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.daysUnit(plan.days.length)} · {t.stops(stopCount)}
                      {travelers ? ` · ${num(travelers)} 👤` : ""}
                    </p>
                    {prices && (
                      <div className="mt-4">
                        <p className="section-label">{t.priceLevels}</p>
                        <p className="mt-1 text-sm text-foreground">
                          {Object.entries(prices.counts)
                            .sort((a, b) => (LEVEL_RANK[a[0]] ?? 0) - (LEVEL_RANK[b[0]] ?? 0))
                            .map(([lvl, n]) => `${num(n)} × ${lvl}`)
                            .join(" · ") || "—"}
                          {prices.unknown > 0 ? ` · ${t.priceUnknown(prices.unknown)}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{t.priceNote}</p>
                      </div>
                    )}
                    {conflicts.size > 0 && <p className="mt-3 text-xs text-warning">{t.conflicts(conflicts.size)}</p>}

                    <details className="mt-4 text-sm">
                      <summary className="cursor-pointer font-semibold text-foreground">{t.assumptions}</summary>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                        {t.assumptionList.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </details>
                  </div>

                  <div className="it-no-print space-y-3 rounded-2xl border border-border bg-card p-5">
                    <label htmlFor="it-trip-name" className={fieldLabel}>
                      {t.tripName}
                    </label>
                    <input
                      id="it-trip-name"
                      value={tripName}
                      maxLength={80}
                      onChange={(e) => setTripName(e.target.value)}
                      placeholder={`${destName} · ${t.daysUnit(plan.days.length)}`}
                      className={`${control} w-full`}
                    />
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={doSave} className="tv-btn-sm tv-btn-sm-solid">
                        {savedMsg === "ok" ? <Check size={14} aria-hidden="true" /> : <Bookmark size={14} aria-hidden="true" />}
                        {savedMsg === "ok" ? t.saved : t.save}
                      </button>
                      <button type="button" onClick={doShare} className="tv-btn-sm">
                        {copied ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}
                        {copied ? t.copied : t.share}
                      </button>
                      <button type="button" onClick={() => window.print()} className="tv-btn-sm">
                        <Printer size={14} aria-hidden="true" />
                        {t.print}
                      </button>
                    </div>
                    {savedMsg === "fail" && (
                      <p role="alert" className="text-xs text-destructive">
                        {t.saveFailed}
                      </p>
                    )}
                    {shareUrl && (
                      <div className="space-y-1">
                        <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} aria-label={t.share} className={`${control} w-full text-xs`} />
                        <p className="text-xs text-muted-foreground">{t.shareHint}</p>
                      </div>
                    )}
                    <Link href={`/travel/${province}`} className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-foreground">
                      {t.explore}
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </aside>
            </div>
          )}

        {/* ── Saved trips ───────────────────────────────────────────────── */}
        <section className="it-no-print mx-auto mt-14 max-w-4xl">
          <h2 className="font-display text-xl">{t.savedTrips}</h2>
          {savedPlans.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{t.noSavedTrips}</p>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
              {savedPlans.map((sp) => {
                const decoded = decodePlan(sp.code);
                const d = destinations.find((x) => x.slug === decoded?.destination);
                return (
                  <li key={sp.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                      <JourneyImage src={d?.hero_image_url} alt="" sizes="64px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{sp.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(sp.savedAt).toLocaleString(lang === "km" ? "km-KH" : "en-GB")}</p>
                    </div>
                    <button type="button" onClick={() => openSaved(sp.code, sp.notes)} className="tv-btn-sm">
                      {t.open}
                    </button>
                    <button type="button" onClick={() => deletePlan(sp.id)} aria-label={`${t.delete}: ${sp.name}`} className="it-icon-btn hover:text-destructive">
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function TripPlannerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Planner />
    </Suspense>
  );
}
