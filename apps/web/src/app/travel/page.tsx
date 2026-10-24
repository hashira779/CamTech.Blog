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
import { publicImageWidths } from "@/lib/travel/image-meta";
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
import { CambodiaMap, type MapPlace } from "@/components/travel/map/CambodiaMap";
import { CultureSection } from "@/components/travel/culture/CultureSection";
import { TripBasketLink } from "@/components/travel/trip/AddToTripButton";
import { Container, Section } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

const TITLE = "Travel in Cambodia — destinations, map, attractions and trip planner";
const DESCRIPTION =
  "Explore all 25 provinces of Cambodia: Angkor and other Khmer temples, islands, highlands and riverside cities, on a real map, with verified attractions, bus routes, cultural stories and a day-by-day trip planner.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/travel" },
  openGraph: {
    type: "website",
    url: "/travel",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/images/places/saracen-bay-koh-rong-sanloem.jpg", alt: "Saracen Bay, Koh Rong Sanloem, Cambodia" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** The provinces the hero's switcher offers, in order; any missing from the data are skipped. */
const HERO_FEATURED = ["siem-reap", "phnom-penh", "kampot", "sihanoukville", "mondulkiri"];

/** Place types plotted on the map: places to visit, not hotels or restaurants. */
const MAP_TYPES = "ATTRACTION,TEMPLE,WATERFALL,BEACH,NATIONAL_PARK,LAKE,MUSEUM,MARKET,ACTIVITY,HIDDEN_GEM";

/** Every place of the given types. The API caps a page at 100 rows, so this walks the pages. */
async function getAllPlaces(type: string) {
  const first = await getPlaces({ type, limit: 100, offset: 0 });
  const items = [...first.items];
  for (let offset = 100; offset < Math.min(first.total, 1000); offset += 100) {
    const page = await getPlaces({ type, limit: 100, offset });
    if (page.items.length === 0) break;
    items.push(...page.items);
  }
  return { items, total: first.total };
}

/**
 * The travel section front page — a journey through the country, sunrise to dusk.
 *
 *   A. Angkor at sunrise (illustrated, scroll-driven camera) with a featured-province switcher
 *   I. The discovery route across the provinces' recorded coordinates (stylised, labelled so)
 *  II. Five worlds — temples, islands, highlands, the capital, the countryside
 *      Explore Cambodia — all provincial hubs, searchable, filterable
 * III. Landmarks — searchable, paged attraction directory
 *  IV. Cambodia on a real map (Leaflet + OpenStreetMap)
 *   V. The living soul of Cambodia — culture and the rites of a Khmer wedding
 *      Practical — transport, field guides, the cultural calendar
 *  VI. Itineraries as a route timeline, ending on the dusk silhouette
 *
 * The honesty rules from the magazine version still hold: photographs come only from the
 * directory (or the project files the directory already uses), a missing one is shown as
 * missing, and every count is the real number of rows the API returned.
 */
export default async function TravelHubPage() {
  const [destinations, touristPlacesData, mapPlacesData, trips, guides, events, transportData, widths] =
    await Promise.all([
      getDestinations(),
      getPlaces({
        type: "ATTRACTION,TEMPLE,WATERFALL,BEACH,NATIONAL_PARK,LAKE",
        limit: 16,
        offset: 0,
      }),
      getAllPlaces(MAP_TYPES),
      getTrips({ featured: true }),
      getTravelGuides(),
      getTravelEvents(),
      searchTransportRoutes("phnom-penh", "siem-reap"),
      publicImageWidths(),
    ]);

  const touristPlaces = touristPlacesData.items;
  const routes = transportData.routes;
  const featured = HERO_FEATURED.flatMap((slug) => destinations.filter((d) => d.slug === slug));
  const destinationSlugById = Object.fromEntries(destinations.map((d) => [d.id, d.slug]));
  // Only what the map draws and previews crosses to the client.
  const mapPlaces: MapPlace[] = mapPlacesData.items.map((p) => ({
    slug: p.slug,
    name: p.name,
    local_name: p.local_name ?? null,
    place_type: p.place_type,
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    description: p.description ? p.description.slice(0, 320) : null,
    description_km: p.description_km ? p.description_km.slice(0, 320) : null,
    hero_image_url: p.hero_image_url ?? null,
    destination_id: p.destination_id ?? null,
  }));

  return (
    <JourneyShell>
      {/* ── A. Sunrise ──────────────────────────────────────────────────────── */}
      <JourneyHero featured={featured} />

      {/* ── I. Discovery route ──────────────────────────────────────────────── */}
      {destinations.length > 1 && <DiscoveryScene destinations={destinations} />}

      {/* ── II. Five worlds ─────────────────────────────────────────────────── */}
      <WorldsScene destinations={destinations} />

      {/* ── Explore Cambodia: every provincial hub ──────────────────────────── */}
      {destinations.length > 0 && (
        <div id="tv-explore" className="tv-daylight scroll-mt-20">
          <Section className="py-16 sm:py-24">
            <Container>
              <JourneyHeader chapter="provinces" count={destinations.length} />
              <ProvinceHubGrid destinations={destinations} imageWidths={widths} />
            </Container>
          </Section>
        </div>
      )}

      {/* ── III. Landmarks ──────────────────────────────────────────────────── */}
      {touristPlaces.length > 0 && (
        <div className="tv-sandstone border-y border-border">
          <Section className="py-16 sm:py-24">
            <Container>
              <JourneyHeader chapter="attractions" />
              <TouristAttractionsGrid
                places={touristPlaces}
                total={touristPlacesData.total}
                imageWidths={widths}
                destinationSlugById={destinationSlugById}
              />
            </Container>
          </Section>
        </div>
      )}

      {/* ── IV. The real map ────────────────────────────────────────────────── */}
      {destinations.length > 0 && <CambodiaMap destinations={destinations} places={mapPlaces} />}

      {/* ── V. Culture ──────────────────────────────────────────────────────── */}
      <CultureSection />

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
        <Section id="tv-events" className="scroll-mt-20 pt-0">
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

      {/* ── VI. Itinerary route and the closing line ────────────────────────── */}
      <FinaleScene trips={trips} />

      <TripBasketLink />
    </JourneyShell>
  );
}
