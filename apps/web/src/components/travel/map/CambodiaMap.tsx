"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Layers, LocateFixed, MapPin, Navigation } from "lucide-react";
import type { Destination } from "@/types";
import regionData from "@/data/region_categories.json";
import { humanize } from "@/lib/format";
import { nearestTo, toCoord, type PlanPlace } from "@/lib/travel/itinerary";
import { PLACE_TYPE_KM, REGION_LABEL_KM, useJourneyCopy } from "@/components/travel/journey/copy";
import { JourneyImage } from "@/components/travel/journey/JourneyImage";
import { isProvinceStandIn } from "@/lib/travel/photo";
import { AddToTripButton } from "@/components/travel/trip/AddToTripButton";
import type { MapPoint } from "./CambodiaMapCanvas";

const CambodiaMapCanvas = dynamic(() => import("./CambodiaMapCanvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-muted" />,
});

/** The fields the map needs from a place row — the page trims the API rows down to these. */
export interface MapPlace {
  slug: string;
  name: string;
  local_name?: string | null;
  place_type: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  description_km?: string | null;
  hero_image_url?: string | null;
  destination_id?: string | null;
}

type Selection = { kind: "province" | "place"; slug: string } | null;

const REGIONS = regionData.region_categories as { id: string; label: string; slugs: string[] }[];

function asPlan(p: { slug: string; name: string; place_type?: string; latitude?: number | string | null; longitude?: number | string | null }): PlanPlace {
  return { slug: p.slug, name: p.name, place_type: p.place_type ?? "PROVINCE", latitude: p.latitude, longitude: p.longitude };
}

/**
 * Scene IV — Cambodia on a real map.
 *
 * Province hubs and attractions are plotted at the latitude/longitude their rows carry; a row
 * without coordinates is simply not on the map (it is still in the lists elsewhere on the page).
 * Filters really narrow the markers; choosing a marker, or a province from the dropdown, opens a
 * preview with the photograph, both names, a description, links and the nearest plotted places
 * by straight-line distance. If the tiles fail, the markers, preview and lists keep working.
 */
export function CambodiaMap({ destinations, places }: { destinations: Destination[]; places: MapPlace[] }) {
  const { copy, lang, num } = useJourneyCopy();
  const sectionRef = React.useRef<HTMLElement>(null);
  const [armed, setArmed] = React.useState(false);
  const [showProvinces, setShowProvinces] = React.useState(true);
  const [showPlaces, setShowPlaces] = React.useState(true);
  const [region, setRegion] = React.useState("ALL");
  const [type, setType] = React.useState("ALL");
  const [selection, setSelection] = React.useState<Selection>(null);
  const [resetNonce, setResetNonce] = React.useState(0);
  const [tilesFailed, setTilesFailed] = React.useState(false);

  // Mount Leaflet only when the section comes near the viewport, then keep it.
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const destById = React.useMemo(() => new Map(destinations.map((d) => [d.id, d])), [destinations]);
  const regionSlugs = React.useMemo(() => {
    const r = REGIONS.find((x) => x.id === region);
    return r && r.slugs.length ? new Set(r.slugs) : null;
  }, [region]);
  const inRegion = React.useCallback(
    (provinceSlug?: string | null) => !regionSlugs || (provinceSlug ? regionSlugs.has(provinceSlug) : false),
    [regionSlugs]
  );

  const plottedProvinces = React.useMemo(() => destinations.filter((d) => toCoord(d)), [destinations]);
  const plottedPlaces = React.useMemo(() => places.filter((p) => toCoord(p)), [places]);
  const types = React.useMemo(() => Array.from(new Set(plottedPlaces.map((p) => p.place_type))).sort(), [plottedPlaces]);

  const visibleProvinces = React.useMemo(
    () => (showProvinces ? plottedProvinces.filter((d) => inRegion(d.slug)) : []),
    [showProvinces, plottedProvinces, inRegion]
  );
  const visiblePlaces = React.useMemo(
    () =>
      showPlaces
        ? plottedPlaces.filter(
            (p) => (type === "ALL" || p.place_type === type) && inRegion(destById.get(p.destination_id ?? "")?.slug)
          )
        : [],
    [showPlaces, plottedPlaces, type, inRegion, destById]
  );

  const points: MapPoint[] = React.useMemo(
    () => [
      ...visibleProvinces.map((d) => ({
        key: `province:${d.slug}`,
        kind: "province" as const,
        name: lang === "km" && d.name_km ? d.name_km : d.name,
        lat: Number(d.latitude),
        lng: Number(d.longitude),
      })),
      ...visiblePlaces.map((p) => ({
        key: `place:${p.slug}`,
        kind: "place" as const,
        name: p.name,
        lat: Number(p.latitude),
        lng: Number(p.longitude),
      })),
    ],
    [visibleProvinces, visiblePlaces, lang]
  );

  const selectedKey = selection ? `${selection.kind}:${selection.slug}` : null;
  const onSelect = React.useCallback((key: string) => {
    const [kind, slug] = key.split(":") as ["province" | "place", string];
    setSelection({ kind, slug });
  }, []);

  const selectedProvince = selection?.kind === "province" ? destinations.find((d) => d.slug === selection.slug) : undefined;
  const selectedPlace = selection?.kind === "place" ? places.find((p) => p.slug === selection.slug) : undefined;
  const selectedOrigin = selectedProvince ? asPlan(selectedProvince) : selectedPlace ? asPlan(selectedPlace) : null;
  const nearby = selectedOrigin ? nearestTo(selectedOrigin, plottedPlaces.map(asPlan), 5, 60) : [];
  const provinceOfPlace = selectedPlace ? destById.get(selectedPlace.destination_id ?? "") : undefined;
  const placesInProvince = selectedProvince ? places.filter((p) => p.destination_id === selectedProvince.id).length : 0;

  const typeLabel = (t: string) => (lang === "km" && PLACE_TYPE_KM[t] ? PLACE_TYPE_KM[t] : humanize(t));
  const regionLabel = (r: { id: string; label: string }) => (lang === "km" ? REGION_LABEL_KM[r.id] ?? r.label : r.label);
  const fmtKm = (km: number) => copy.kmAway(km < 10 ? km.toFixed(1) : String(Math.round(km)));

  const chip = (active: boolean) =>
    `inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
      active ? "border-transparent bg-tv-jungle text-tv-ivory" : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground"
    }`;

  return (
    <section ref={sectionRef} id="tv-map" aria-labelledby="tv-map-title" className="tv-map-section scroll-mt-20 py-16 sm:py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="tv-eyebrow text-category-travel">{copy.mapLabel2}</p>
          <h2 id="tv-map-title" className="mt-2 font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
            {copy.mapTitle}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{copy.mapLead}</p>
        </div>

        {/* ── Controls ──────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={copy.mapLabel2}>
            <button type="button" aria-pressed={showProvinces} onClick={() => setShowProvinces((v) => !v)} className={chip(showProvinces)}>
              <MapPin size={14} aria-hidden="true" />
              {copy.mapProvinces}
            </button>
            <button type="button" aria-pressed={showPlaces} onClick={() => setShowPlaces((v) => !v)} className={chip(showPlaces)}>
              <Layers size={14} aria-hidden="true" />
              {copy.mapAttractions}
            </button>
            <label className="sr-only" htmlFor="tv-map-region">
              {copy.region}
            </label>
            <select
              id="tv-map-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="min-h-10 rounded-full border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {regionLabel(r)}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="tv-map-type">
              {copy.mapAttractions}
            </label>
            <select
              id="tv-map-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={!showPlaces}
              className="min-h-10 rounded-full border border-border bg-card px-3.5 text-sm text-foreground disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <option value="ALL">{copy.allTypes}</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {typeLabel(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="tv-map-jump">
              {copy.mapChoose}
            </label>
            <select
              id="tv-map-jump"
              value={selectedProvince?.slug ?? ""}
              onChange={(e) => e.target.value && setSelection({ kind: "province", slug: e.target.value })}
              className="min-h-10 rounded-full border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <option value="">{copy.mapChooseNone}</option>
              {[...plottedProvinces]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {lang === "km" && d.name_km ? d.name_km : d.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setSelection(null);
                setResetNonce((n) => n + 1);
              }}
              className={chip(false)}
            >
              <LocateFixed size={14} aria-hidden="true" />
              {copy.mapReset}
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
          {copy.markerCount(visibleProvinces.length, visiblePlaces.length)}
        </p>

        {/* ── Map + preview ─────────────────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="tv-map-frame relative h-[58svh] min-h-[340px] overflow-hidden rounded-2xl border border-border lg:col-span-8 lg:h-[620px]">
            {armed ? (
              <CambodiaMapCanvas
                points={points}
                selectedKey={selectedKey}
                onSelect={onSelect}
                resetNonce={resetNonce}
                onTilesFailed={() => setTilesFailed(true)}
                labels={{ zoomIn: copy.mapZoomIn, zoomOut: copy.mapZoomOut }}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-surface-muted text-sm text-muted-foreground">{copy.mapLoading}</div>
            )}
            {tilesFailed && (
              <p role="status" className="absolute inset-x-3 top-3 z-[500] rounded-lg bg-card/95 px-3 py-2 text-xs text-foreground shadow-sm">
                {copy.mapFailed}
              </p>
            )}
          </div>

          <aside aria-live="polite" className="tv-map-preview rounded-2xl border border-border bg-card lg:col-span-4">
              {selectedProvince || selectedPlace ? (
                <div key={selectedKey} className="tv-swap-in flex h-full flex-col">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-surface-muted">
                    <JourneyImage
                      src={(selectedProvince ?? selectedPlace)?.hero_image_url}
                      alt={(selectedProvince ?? selectedPlace)?.name ?? ""}
                      sizes="(min-width: 1024px) 400px, 100vw"
                      label={copy.photoMissing}
                    />
                    {selectedPlace && isProvinceStandIn(selectedPlace.hero_image_url) && (
                      <span className="absolute inset-x-2 bottom-2 truncate rounded-md bg-tv-night/75 px-2 py-1 text-[0.68rem] font-medium text-tv-ivory">
                        {copy.provincePhoto}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <p className="tv-eyebrow text-category-travel">
                      {selectedProvince ? copy.mapProvinces : typeLabel(selectedPlace!.place_type)}
                      {provinceOfPlace ? ` · ${lang === "km" && provinceOfPlace.name_km ? provinceOfPlace.name_km : provinceOfPlace.name}` : ""}
                    </p>
                    <h3 className="font-display text-2xl leading-tight tracking-tight text-foreground">
                      {selectedProvince
                        ? lang === "km" && selectedProvince.name_km
                          ? selectedProvince.name_km
                          : selectedProvince.name
                        : selectedPlace!.name}
                    </h3>
                    {(selectedProvince?.name_km && lang !== "km") || selectedPlace?.local_name ? (
                      <p className="text-sm text-muted-foreground">{selectedProvince?.name_km ?? selectedPlace?.local_name}</p>
                    ) : null}
                    <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                      {selectedProvince
                        ? lang === "km" && selectedProvince.overview_km
                          ? selectedProvince.overview_km
                          : selectedProvince.overview
                        : lang === "km" && selectedPlace!.description_km
                          ? selectedPlace!.description_km
                          : selectedPlace!.description}
                    </p>
                    {selectedProvince && placesInProvince > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {num(placesInProvince)} · {copy.mapAttractions}
                      </p>
                    )}

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {selectedProvince ? (
                        <>
                          <Link href={`/travel/${selectedProvince.slug}`} className="tv-btn-sm tv-btn-sm-solid group">
                            {copy.exploreHub}
                            <ArrowRight size={14} aria-hidden="true" className="link-nudge" />
                          </Link>
                          <Link href={`/travel/planner?destination=${selectedProvince.slug}`} className="tv-btn-sm">
                            <Navigation size={14} aria-hidden="true" />
                            {copy.planHere}
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href={`/travel/place/${selectedPlace!.slug}`} className="tv-btn-sm tv-btn-sm-solid group">
                            {copy.openPlace}
                            <ArrowRight size={14} aria-hidden="true" className="link-nudge" />
                          </Link>
                          <AddToTripButton
                            place={{
                              slug: selectedPlace!.slug,
                              name: selectedPlace!.name,
                              destination_slug: provinceOfPlace?.slug,
                              hero_image_url: selectedPlace!.hero_image_url,
                            }}
                          />
                        </>
                      )}
                    </div>
                    {selectedOrigin && toCoord(selectedOrigin) && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${toCoord(selectedOrigin)!.join(",")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 self-start rounded-sm text-xs font-semibold text-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        {copy.directions} ↗
                      </a>
                    )}

                    <div className="mt-2 border-t border-border pt-3">
                      <p className="section-label">{copy.nearby}</p>
                      {nearby.length === 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">{copy.nearbyNone}</p>
                      ) : (
                        <ul className="mt-2 space-y-1">
                          {nearby.map(({ place, km }) => (
                            <li key={place.slug}>
                              <button
                                type="button"
                                onClick={() => setSelection({ kind: "place", slug: place.slug })}
                                className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                              >
                                <span className="truncate">{place.name}</span>
                                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{fmtKm(km)}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-2 text-[0.7rem] leading-snug text-muted-foreground">{copy.straightLineNote}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div key="empty" className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <MapPin size={22} aria-hidden="true" className="text-category-travel" />
                  <p className="max-w-xs text-sm text-muted-foreground">{copy.mapPreviewEmpty}</p>
                </div>
              )}
          </aside>
        </div>
      </div>
    </section>
  );
}
