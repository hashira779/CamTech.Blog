import React from "react";
import { Metadata } from "next";
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
import { JourneyShell } from "@/components/travel/journey/JourneyShell";
import { JourneyHero } from "@/components/travel/journey/JourneyHero";
import { DiscoveryScene } from "@/components/travel/journey/DiscoveryScene";
import { WorldsScene } from "@/components/travel/journey/WorldsScene";
import { FinaleScene } from "@/components/travel/journey/FinaleScene";
import { JourneyHeader } from "@/components/travel/journey/JourneyHeader";
import { Container, Section } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Travel & Trip Discovery across Cambodia",
  description:
    "Explore verified destinations across all 25 provinces, sacred ancient temples, tropical islands, bus schedules, and curated trip itineraries.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * The travel section front page — a journey through the country, sunrise to dusk.
 *
 *   A. Angkor at sunrise (illustrated, scroll-driven camera)
 *   B. The discovery map — a route across the provinces' recorded coordinates
 *   C. Five worlds — temples, islands, highlands, the capital, the countryside
 *   D. Landmarks — the attraction rows, filters and links, unchanged in substance
 *   E. The province directory, with a marker map
 *      Practical — transport, field guides, the cultural calendar
 *   F. Itineraries as a route timeline, ending on the dusk silhouette
 *
 * The honesty rules from the magazine version still hold: photographs come only from the
 * directory (or the project files the directory already uses), a missing one is shown as
 * missing, and every count is the real number of rows the API returned.
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
    <JourneyShell>
      {/* ── A. Sunrise ──────────────────────────────────────────────────────── */}
      <JourneyHero />

      {/* ── B. Discovery map ────────────────────────────────────────────────── */}
      {destinations.length > 1 && <DiscoveryScene destinations={destinations} />}

      {/* ── C. Five worlds ──────────────────────────────────────────────────── */}
      <WorldsScene destinations={destinations} />

      {/* ── D. Landmarks ────────────────────────────────────────────────────── */}
      {touristPlaces.length > 0 && (
        <div className="tv-daylight">
          <Section className="py-16 sm:py-24">
            <Container>
              <JourneyHeader chapter="attractions" />
              <TouristAttractionsGrid places={touristPlaces} />
            </Container>
          </Section>
        </div>
      )}

      {/* ── E. The provincial hubs ──────────────────────────────────────────── */}
      {destinations.length > 0 && (
        <div className="tv-sandstone border-y border-border">
          <Section className="py-16 sm:py-24">
            <Container>
              <JourneyHeader chapter="provinces" count={destinations.length} />
              <ProvinceHubGrid destinations={destinations} />
            </Container>
          </Section>
        </div>
      )}

      {/* ── Practical: getting around ───────────────────────────────────────── */}
      {routes.length > 0 && (
        <Section className="py-16 sm:py-20">
          <Container>
            <JourneyHeader chapter="transport" count={routes.length} />

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

      {/* ── Practical: field guides ─────────────────────────────────────────── */}
      {guides.length > 0 && (
        <Section className="pt-0">
          <Container>
            <JourneyHeader chapter="guides" />

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

      {/* ── Practical: cultural calendar ────────────────────────────────────── */}
      {events.length > 0 && (
        <Section className="pt-0">
          <Container>
            <JourneyHeader chapter="events" count={events.length} />

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

      {/* ── F. Itinerary route and the closing line ─────────────────────────── */}
      <FinaleScene trips={trips} />
    </JourneyShell>
  );
}
