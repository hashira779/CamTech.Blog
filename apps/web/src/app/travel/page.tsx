import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight, Navigation, PlusCircle, CalendarDays } from "lucide-react";
import {
  getDestinations,
  getPlaces,
  getTrips,
  getTravelGuides,
  getTravelEvents,
  searchTransportRoutes,
} from "@/lib/api";
import { TravelGuideCard } from "@/components/travel/TravelGuideCard";
import { TravelEventCard } from "@/components/travel/TravelEventCard";
import { TransportRouteCard } from "@/components/travel/TransportRouteCard";
import { ProvinceHubGrid } from "@/components/travel/ProvinceHubGrid";
import { TouristAttractionsGrid } from "@/components/travel/TouristAttractionsGrid";
import { HeroDestinationSlider } from "@/components/travel/HeroDestinationSlider";
import { Container, Section } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import { cleanText } from "@/lib/format";

export const metadata: Metadata = {
  title: "Travel & Trip Discovery across Cambodia",
  description:
    "Explore verified destinations across all 25 provinces, sacred ancient temples, tropical islands, bus schedules, and curated trip itineraries.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * The travel section front page — a magazine cover for the flagship vertical.
 *
 * Restyled onto the design tokens, and the honesty fixes that came with it: itineraries used to
 * borrow a stock Angkor Wat frame whenever a trip had no verified image of its own, the day counts
 * defaulted to "3" when the record carried no schedule, and every rail was labelled "Verified
 * Database" whatever it held. Photographs now come from `Photo`, which renders the same
 * "Photo not verified yet" tile the places use, and counts are the real rows the API returned.
 */
export default async function TravelHubPage() {
  const [destinations, touristPlacesData, trips, guides, events, transportData] =
    await Promise.all([
      getDestinations(),
      getPlaces({
        type: "ATTRACTION,TEMPLE,WATERFALL,BEACH,NATIONAL_PARK,LAKE",
        limit: 16,
        offset: 0,
      }),
      getTrips({ featured: true }),
      getTravelGuides(),
      getTravelEvents(),
      searchTransportRoutes("phnom-penh", "siem-reap"),
    ]);

  const touristPlaces = touristPlacesData.items;
  const routes = transportData.routes;

  return (
    <div className="flex w-full flex-1 flex-col">
      {/* ── 1. Cover: one province, one verified photograph ─────────────────── */}
      <HeroDestinationSlider destinations={destinations} />

      {/* ── 2. Landmarks ────────────────────────────────────────────────────── */}
      {touristPlaces.length > 0 && (
        <Section>
          <Container>
            <SectionHeader
              label="Landmarks"
              title="Must-visit attractions"
              description="Temples, waterfalls, islands and protected landscapes in the directory. Tiles marked as unverified simply have no photograph we can attribute to the place yet."
              actionHref="/travel/siem-reap?type=TEMPLE,ATTRACTION"
              actionLabel="All attractions"
            />

            <TouristAttractionsGrid places={touristPlaces} />
          </Container>
        </Section>
      )}

      {/* ── 3. The 25 provincial hubs ───────────────────────────────────────── */}
      {destinations.length > 0 && (
        <div className="border-y border-border bg-surface-muted/50">
          <Section>
            <Container>
              <SectionHeader
                label="Directory"
                title="Explore Cambodia by province"
                description={`${destinations.length} provincial hubs. Filter by region, then open a hub for its places, map and routes.`}
              />

              <ProvinceHubGrid destinations={destinations} />
            </Container>
          </Section>
        </div>
      )}

      {/* ── 4. Curated itineraries ──────────────────────────────────────────── */}
      {trips.length > 0 && (
        <Section>
          <Container>
            <SectionHeader
              label="Itineraries"
              title="Multi-day plans"
              description="Assembled from the places listed for each province."
              actionHref="/travel/planner"
              actionLabel="Build a custom plan"
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {trips.map((trip, index) => {
                const stopCount = trip.days?.length ?? 0;
                return (
                  <Reveal
                    as="article"
                    key={trip.id}
                    index={index}
                    className="group flex overflow-hidden rounded-lg border border-border bg-card shadow-xs hover-lift hover:border-border-strong sm:flex-row"
                  >
                    <Link
                      href={`/travel/trips/${trip.slug}`}
                      aria-label={trip.title}
                      className="block sm:w-2/5"
                    >
                      <Photo zoom
                        src={trip.hero_image_url}
                        alt={trip.title}
                        ratio="none"
                        radius="none"
                        showCredit={false}
                        placeholderLabel="Photo not verified yet"
                        className="aspect-[4/3] w-full sm:h-full sm:aspect-auto"
                      />
                    </Link>

                    <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
                      <p className="section-label">
                        {trip.duration_days} days
                        {trip.travel_style ? ` · ${cleanText(trip.travel_style)}` : ""}
                        {trip.budget_level ? ` · ${cleanText(trip.budget_level)} budget` : ""}
                      </p>

                      <h3 className="font-display text-xl leading-snug tracking-tight text-foreground">
                        <Link
                          href={`/travel/trips/${trip.slug}`}
                          className="transition-colors hover:text-accent"
                        >
                          {cleanText(trip.title)}
                        </Link>
                      </h3>

                      {trip.description && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {cleanText(trip.description)}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {stopCount > 0
                            ? `${stopCount} scheduled day${stopCount === 1 ? "" : "s"}`
                            : "Day-by-day schedule not published yet"}
                        </span>
                        <Link
                          href={`/travel/trips/${trip.slug}`}
                          className="group/cta inline-flex items-center gap-1 font-semibold text-accent transition-colors hover:text-foreground"
                        >
                          View itinerary
                          <ArrowRight
                            size={14}
                            aria-hidden="true"
                            className="transition-transform duration-300 group-hover/cta:translate-x-0.5"
                          />
                        </Link>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </Container>
        </Section>
      )}

      {/* ── 5. Getting around ───────────────────────────────────────────────── */}
      {routes.length > 0 && (
        <Section className="pt-0">
          <Container>
            <SectionHeader
              label="Getting around"
              title="Buses, vans and schedules"
              description={`${routes.length} recorded options between Phnom Penh and Siem Reap. Fares and departure times change often, so reconfirm with the operator before you travel.`}
              actionHref="/travel/transport"
              actionLabel="All routes"
            />

            <Reveal>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {routes.slice(0, 4).map((route) => (
                  <TransportRouteCard key={route.id} route={route} />
                ))}
              </div>
            </Reveal>
          </Container>
        </Section>
      )}

      {/* ── 6. Field guides ─────────────────────────────────────────────────── */}
      {guides.length > 0 && (
        <Section className="pt-0">
          <Container>
            <SectionHeader
              label="Field guides"
              title="Practical travel knowledge"
              description="Logistics, dress codes, dawn timings and temple etiquette."
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {guides.map((guide, index) => (
                <Reveal key={guide.id} index={index} className="h-full">
                  <TravelGuideCard guide={guide} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── 7. Cultural calendar ────────────────────────────────────────────── */}
      {events.length > 0 && (
        <Section className="pt-0">
          <Container>
            <SectionHeader
              label="Cultural calendar"
              title="Festivals and gatherings"
              description={`${events.length} upcoming events in the directory.`}
            />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {events.map((event, index) => (
                <Reveal key={event.id} index={index} className="h-full">
                  <TravelEventCard event={event} />
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ── 8. Planner invitation ──────────────────────────────────────────── */}
      <Section className="pt-0">
        <Container>
          <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface-muted/60 p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <span className="section-label inline-flex items-center gap-2 text-accent">
                <CalendarDays size={14} aria-hidden="true" />
                Trip planner
              </span>
              <h2 className="mt-3 font-display text-2xl leading-tight tracking-tight text-foreground sm:text-3xl">
                Plan a route through the places we can verify
              </h2>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                Choose your dates and travel style, and the planner assembles a day-by-day route from
                the directory — with the places that have no photograph or hours recorded shown as
                such.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/travel/planner"
                className="pressable inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Navigation size={15} aria-hidden="true" />
                Start planning
              </Link>
              <Link
                href="/travel/suggest"
                className="pressable inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-card px-5 text-sm font-medium text-foreground hover:border-foreground/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <PlusCircle size={15} aria-hidden="true" />
                Suggest a place
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
