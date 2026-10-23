"use client";

import { PageHeader } from "@/components/layout/page-header";
import React, { useState, useEffect } from "react";
import { Compass } from "lucide-react";
import { searchNearby, getPlaces } from "@/lib/api";
import { NearbySearchResponse, Place } from "@/types";
import { NearbyPlaceCard } from "@/components/travel/NearbyPlaceCard";
import { Container } from "@/components/ui/container";
import { FormField } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { humanize } from "@/lib/format";
import travelConfig from "@/data/travel_config.json";

export default function NearbySearchPage() {
  const [selectedPlace, setSelectedPlace] = useState("angkor-wat");
  const [radius, setRadius] = useState<number>(10.0);
  const [placeType, setPlaceType] = useState<string>("");
  const [placesList, setPlacesList] = useState<Place[]>([]);
  const [data, setData] = useState<NearbySearchResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlaces({ limit: 150 }).then((res) => {
      if (res && res.items && res.items.length > 0) {
        setPlacesList(res.items);
      }
    });
  }, []);

  useEffect(() => {
    async function loadNearby() {
      setLoading(true);
      try {
        const res = await searchNearby({
          place: selectedPlace,
          radius: radius,
          type: placeType || undefined,
          limit: 30
        });
        setData(res);
      } catch (err) {
        console.error("Nearby search failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNearby();
  }, [selectedPlace, radius, placeType]);

  const referenceName = data?.reference_name || humanize(selectedPlace);

  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        breadcrumbs={[{ label: "Travel", href: "/travel" }, { label: "Nearby" }]}
        category="travel"
        eyebrow="Nearby"
        title="What is around this place"
        description="Places within a chosen radius of a landmark, ordered by straight-line distance from its coordinates. Walking and road times are estimated from that distance, not measured on the street."
      />

      {/* ── Controls ──────────────────────────────────────────────────────────── */}
      <Container className="pb-10 pt-8">
        <div className="max-w-4xl rounded-lg border border-border bg-card p-5 shadow-xs sm:p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Reference place" id="nearby-place">
              <Select
                id="nearby-place"
                value={selectedPlace}
                onChange={(e) => setSelectedPlace(e.target.value)}
              >
                {placesList.length > 0
                  ? placesList.map((lm) => (
                      <option key={lm.slug} value={lm.slug}>
                        {lm.name} {lm.local_name ? `(${lm.local_name})` : ""}
                      </option>
                    ))
                  : travelConfig.fallback_reference_landmarks.map((lm) => (
                      <option key={lm.slug} value={lm.slug}>
                        {lm.name}
                      </option>
                    ))}
              </Select>
            </FormField>

            <FormField label="Radius" id="nearby-radius" helperText="Measured as the crow flies.">
              <Select
                id="nearby-radius"
                value={radius}
                onChange={(e) => setRadius(parseFloat(e.target.value))}
              >
                {travelConfig.search_radii.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Category" id="nearby-type">
              <Select id="nearby-type" value={placeType} onChange={(e) => setPlaceType(e.target.value)}>
                {travelConfig.place_categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </div>
      </Container>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <Container as="section" className="border-t border-border pb-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3 py-8">
          <h2 className="font-display text-2xl leading-tight tracking-tight text-foreground sm:text-3xl">
            Within {radius} km of <span className="text-accent">{referenceName}</span>
          </h2>
          {data && (
            <p className="text-xs tabular-nums text-muted-foreground">
              {data.total} place{data.total === 1 ? "" : "s"} found
            </p>
          )}
        </div>

        {loading ? (
          <p className="border-t border-border py-12 text-sm text-muted-foreground">
            Measuring distances…
          </p>
        ) : data && data.results.length > 0 ? (
          <div className="border-t border-border">
            {data.results.map((item) => (
              <NearbyPlaceCard key={item.place.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="max-w-xl border-t border-border py-10">
            <Compass size={20} className="text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-3 font-display text-lg leading-snug text-foreground">
              Nothing registered inside this radius
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Only places in the CamTech.Blog registry are listed. Widen the radius to look further out.
            </p>
            <Button className="mt-4" variant="outline" size="sm" onClick={() => setRadius(20.0)}>
              Search within 20 km
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
