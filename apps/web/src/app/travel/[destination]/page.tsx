import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  MapPin,
  Calendar,
  Info,
  Navigation,
  Bus,
  Footprints,
  ArrowRight,
} from "lucide-react";
import {
  getDestinationBySlug,
  getTrips,
  searchTransportRoutes,
  getTravelGuides,
  getTravelEvents,
} from "@/lib/api";
import { getProvinceSymbol } from "@/data/province_symbols";
import { ProvinceSymbolShowcase } from "@/components/travel/ProvinceSymbolShowcase";
import ProvinceMap from "@/components/travel/ProvinceMap";
import { PlaceFilterGrid } from "./PlaceFilterGrid";
import { TransportRouteCard } from "@/components/travel/TransportRouteCard";
import { TravelGuideCard } from "@/components/travel/TravelGuideCard";
import { TravelEventCard } from "@/components/travel/TravelEventCard";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Photo } from "@/components/ui/photo";
import { cleanText } from "@/lib/format";

interface PageProps {
  params: Promise<{ destination: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { destination: slug } = await params;
  const dest = await getDestinationBySlug(slug);
  if (!dest) return { title: "Destination Not Found" };

  return {
    title: `${dest.name}: places, hotels and itineraries`,
    description: dest.overview.slice(0, 160),
  };
}

/**
 * A province hub.
 *
 * The Leaflet + OpenStreetMap map and every count around it are untouched — "N of M places mapped",
 * "X places listed" and the route tally are the same real figures. What changed is the register: the
 * blurred dark banner with a gradient scrim is now a paper cover led by the province photograph, and
 * an itinerary that had no published schedule no longer claims three days of stops it does not have.
 */
export default async function DestinationPage({ params }: PageProps) {
  const { destination: slug } = await params;
  // The transport directory only pairs each province with one reference origin: the capital,
  // or Siem Reap when the province *is* the capital. The section labels this explicitly.
  const transportOriginSlug = slug === "phnom-penh" ? "siem-reap" : "phnom-penh";
  const [destination, trips, transportData, guides, events] = await Promise.all([
    getDestinationBySlug(slug),
    getTrips({ destination: slug }),
    searchTransportRoutes(transportOriginSlug, slug),
    getTravelGuides(slug),
    getTravelEvents(slug),
  ]);

  if (!destination) {
    notFound();
  }

  const transportOriginLabel = transportOriginSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // The destination payload carries every linked row, including archived/merged ones; the public
  // page shows only what is currently listed.
  const places = (destination.places || []).filter((p) => p.status === "ACTIVE");
  const provinceSymbol = getProvinceSymbol(destination.slug, destination);

  // Only places that actually carry GPS coordinates can be plotted; the rest stay in the grid.
  const mapPlaces = places
    .filter(
      (p) =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        Number.isFinite(p.latitude) &&
        Number.isFinite(p.longitude) &&
        !(p.latitude === 0 && p.longitude === 0),
    )
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      place_type: p.place_type,
      latitude: p.latitude as number,
      longitude: p.longitude as number,
    }));

  const hasCoordinates =
    typeof destination.latitude === "number" && typeof destination.longitude === "number";

  const facts = [
    destination.best_time_to_visit && {
      icon: Calendar,
      label: "Best time to visit",
      value: cleanText(destination.best_time_to_visit),
    },
    hasCoordinates && {
      icon: MapPin,
      label: "Coordinates",
      value: `${destination.latitude?.toFixed(4)}°N, ${destination.longitude?.toFixed(4)}°E`,
    },
    {
      icon: Info,
      label: "Places listed",
      value: `${places.length} in the directory`,
    },
    {
      icon: MapPin,
      label: "Mapped",
      value: `${mapPlaces.length} of ${places.length} have coordinates`,
    },
  ].filter(Boolean) as { icon: typeof Calendar; label: string; value: string }[];

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* ── 1. Cover ────────────────────────────────────────────────────────── */}
      <Section className="border-b border-border pb-10 pt-8 sm:pb-14 sm:pt-10">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <li>
                <Link href="/travel" className="transition-colors hover:text-accent">
                  Travel
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/travel" className="transition-colors hover:text-accent">
                  {destination.country?.name || "Cambodia"}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-foreground">{destination.name}</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <Photo
                src={destination.hero_image_url}
                alt={destination.name}
                ratio="3/2"
                radius="hero"
                priority
                placeholderLabel="Province photo not verified yet"
              />
            </div>

            <div className="flex flex-col gap-5 lg:col-span-5">
              <div>
                <span className="section-label text-accent">Province guide</span>
                <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                  {destination.name}
                </h1>
                {destination.name_km && (
                  <p className="mt-2 text-lg text-muted-foreground">{destination.name_km}</p>
                )}
              </div>

              {destination.overview && (
                <p className="text-base leading-relaxed text-muted-foreground">
                  {cleanText(destination.overview)}
                </p>
              )}

              <dl className="divide-y divide-border border-y border-border">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-center gap-3 py-3">
                    <fact.icon
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-border-strong"
                    />
                    <dt className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {fact.label}
                    </dt>
                    <dd className="ml-auto text-right text-sm tabular-nums text-foreground">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/travel/planner?destination=${destination.slug}`}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Navigation size={15} aria-hidden="true" />
                  Plan a {destination.name} trip
                </Link>
                <Link
                  href="/travel/transport"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Bus size={15} aria-hidden="true" />
                  Getting here
                </Link>
                <Link
                  href={`/travel/nearby?place=${destination.slug === "siem-reap" ? "angkor-wat" : ""}`}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Footprints size={15} aria-hidden="true" />
                  What&rsquo;s near here
                </Link>
                <Link
                  href="/travel/suggest"
                  className="inline-flex h-10 items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
                >
                  Suggest a place
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Container className="space-y-12 py-10 sm:space-y-14 sm:py-14">
        {/* ── 2. Provincial symbol ─────────────────────────────────────────── */}
        {provinceSymbol && <ProvinceSymbolShowcase symbol={provinceSymbol} />}

        {/* ── 3. Practical information, only when the record carries it ────── */}
        {destination.practical_info && (
          <aside className="flex items-start gap-4 rounded-lg border border-border bg-surface-muted/60 p-5 sm:p-6">
            <Info size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />
            <div>
              <h2 className="section-label">Practical information — {destination.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                {cleanText(destination.practical_info)}
              </p>
            </div>
          </aside>
        )}

        {/* ── 4. The map — Leaflet + OpenStreetMap, unchanged ──────────────── */}
        <ProvinceMap
          places={mapPlaces}
          totalPlaces={places.length}
          destinationName={destination.name}
          centerLat={hasCoordinates ? destination.latitude : undefined}
          centerLng={hasCoordinates ? destination.longitude : undefined}
        />

        {/* ── 5. Itineraries ───────────────────────────────────────────────── */}
        {trips.length > 0 && (
          <section>
            <SectionHeader
              label="Itineraries"
              title={`Curated ${destination.name} itineraries`}
              description="Day-by-day plans assembled from the places listed for this province."
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {trips.map((trip) => {
                const stopCount = trip.days?.length ?? 0;
                return (
                  <article
                    key={trip.id}
                    className="group flex flex-col justify-between gap-4 rounded-lg border border-border bg-card p-6 shadow-xs hover-lift hover:border-border-strong"
                  >
                    <div>
                      <p className="section-label">
                        {trip.duration_days} days
                        {trip.travel_style ? ` · ${cleanText(trip.travel_style)}` : ""}
                        {trip.budget_level ? ` · ${cleanText(trip.budget_level)} budget` : ""}
                      </p>
                      <h3 className="mt-2 font-display text-xl leading-snug tracking-tight text-foreground">
                        <Link
                          href={`/travel/trips/${trip.slug}`}
                          className="transition-colors hover:text-accent"
                        >
                          {cleanText(trip.title)}
                        </Link>
                      </h3>
                      {trip.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {cleanText(trip.description)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {stopCount > 0
                          ? `${stopCount} scheduled day${stopCount === 1 ? "" : "s"}`
                          : "Day-by-day schedule not published yet"}
                      </span>
                      <Link
                        href={`/travel/trips/${trip.slug}`}
                        className="group/cta inline-flex items-center gap-1 font-semibold text-accent transition-colors hover:text-foreground"
                      >
                        Explore itinerary
                        <ArrowRight
                          size={14}
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover/cta:translate-x-0.5"
                        />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 6. Getting here ──────────────────────────────────────────────── */}
        {transportData.routes.length > 0 && (
          <section>
            <SectionHeader
              label="Getting here"
              title={`Buses and minivans to ${destination.name}`}
              description={`${transportData.routes.length} route${transportData.routes.length === 1 ? "" : "s"} from ${transportOriginLabel} recorded in our transport directory. Fares and departure times change often, so reconfirm with the operator before you travel.`}
              actionHref="/travel/transport"
              actionLabel="All transport routes"
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {transportData.routes.map((route) => (
                <TransportRouteCard key={route.id} route={route} />
              ))}
            </div>
          </section>
        )}

        {/* ── 7. Field guides ──────────────────────────────────────────────── */}
        {guides.length > 0 && (
          <section>
            <SectionHeader
              label="Field guides"
              title={`Guides and etiquette for ${destination.name}`}
              description="Practical timing advice, photography viewpoints and cultural heritage rules."
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {guides.map((guide) => (
                <TravelGuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          </section>
        )}

        {/* ── 8. Festivals ─────────────────────────────────────────────────── */}
        {events.length > 0 && (
          <section>
            <SectionHeader
              label="Cultural calendar"
              title={`Festivals in ${destination.name}`}
              description={`${events.length} upcoming events recorded for this province.`}
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {events.map((event) => (
                <TravelEventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* ── 9. Every place in the province ───────────────────────────────── */}
        <section>
          <SectionHeader
            label="The directory"
            title={`Places to visit and stay in ${destination.name}`}
            description={`${places.length} listed places. The filters search the rows this province carries, so an empty category means nothing of that type is recorded here yet.`}
          />

          <PlaceFilterGrid places={places} destinationSlug={destination.slug} />
        </section>
      </Container>
    </div>
  );
}
