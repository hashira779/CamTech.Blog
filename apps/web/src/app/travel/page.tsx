import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Compass, MapPin, Route } from "lucide-react";
import { getDestinations, getPlaces, getTrips, getTravelGuides, getTravelEvents, searchTransportRoutes } from "@/lib/api";
import { publicImageWidths } from "@/lib/travel/image-meta";
import { cleanText } from "@/lib/format";
import { TravelGuideCard } from "@/components/travel/TravelGuideCard";
import { TravelEventCard } from "@/components/travel/TravelEventCard";
import { TransportRouteCard } from "@/components/travel/TransportRouteCard";
import { ProvinceHubGrid } from "@/components/travel/ProvinceHubGrid";
import { TouristAttractionsGrid } from "@/components/travel/TouristAttractionsGrid";
import { CambodiaMap, type MapPlace } from "@/components/travel/map/CambodiaMap";
import { TripBasketLink } from "@/components/travel/trip/AddToTripButton";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Cambodia, at your own pace — destinations, maps & trip planning",
  description: "Find a Cambodian destination, explore places on the map, compare published transport routes, and build your own day-by-day itinerary.",
  alternates: { canonical: "/travel" },
};
export const dynamic = "force-dynamic";

const MAP_TYPES = "ATTRACTION,TEMPLE,WATERFALL,BEACH,NATIONAL_PARK,LAKE,MUSEUM,MARKET,ACTIVITY,HIDDEN_GEM";
async function getAllPlaces() {
  const first = await getPlaces({ type: MAP_TYPES, limit: 100, offset: 0 });
  const items = [...first.items];
  for (let offset = 100; offset < Math.min(first.total, 1000); offset += 100) {
    const page = await getPlaces({ type: MAP_TYPES, limit: 100, offset });
    if (!page.items.length) break;
    items.push(...page.items);
  }
  return items;
}

export default async function TravelHubPage() {
  const [destinations, touristPlacesData, allPlaces, trips, guides, events, transportData, widths] = await Promise.all([
    getDestinations(), getPlaces({ type: "ATTRACTION,TEMPLE,WATERFALL,BEACH,NATIONAL_PARK,LAKE", limit: 16, offset: 0 }),
    getAllPlaces(), getTrips({ featured: true }), getTravelGuides(), getTravelEvents(),
    searchTransportRoutes("phnom-penh", "siem-reap"), publicImageWidths(),
  ]);
  const destinationSlugById = Object.fromEntries(destinations.map((d) => [d.id, d.slug]));
  const mapPlaces: MapPlace[] = allPlaces.map((p) => ({
    slug: p.slug, name: p.name, local_name: p.local_name ?? null, place_type: p.place_type,
    latitude: p.latitude ?? null, longitude: p.longitude ?? null,
    description: p.description?.slice(0, 320) ?? null, description_km: p.description_km?.slice(0, 320) ?? null,
    hero_image_url: p.hero_image_url ?? null, destination_id: p.destination_id ?? null,
  }));
  return (
    <div className="field-travel-page tv-journey">
      <Container>
        <section className="field-travel-hero" aria-labelledby="travel-title"><div><p className="field-eyebrow"><Compass size={14} aria-hidden="true" /> Take the scenic route</p><h1 id="travel-title">Cambodia,<br /><em>at your own pace.</em></h1><p>Find somewhere that feels like you. Bring together the places, experiences, and little detours that make a trip your own.</p><div className="field-actions"><Link href="/travel/planner" className="field-button">Build your itinerary <Route size={17} aria-hidden="true" /></Link><a href="#destinations" className="field-text-link">Find your destination <ArrowUpRight size={16} aria-hidden="true" /></a></div></div><Link href="/travel/ratanakiri" className="field-travel-photo"><Image src="/images/destinations/ratanakiri.jpg" alt="The green landscape and crater lake of Ratanakiri" fill priority sizes="(max-width: 767px) 94vw, 45vw" className="object-cover" /><span><MapPin size={13} aria-hidden="true" /> Ratanakiri, Cambodia</span></Link></section>
        <nav className="field-travel-nav" aria-label="Explore the travel directory"><a href="#destinations">Destinations</a><a href="#places">Places to explore</a><a href="#travel-map">On the map</a>{guides.length > 0 && <a href="#field-guides">Field guides</a>}<Link href="/travel/transport">Getting around <ArrowUpRight size={13} aria-hidden="true" /></Link></nav>
        <section id="destinations" className="field-section field-anchor" aria-labelledby="destinations-title"><div className="field-section-heading"><div><p className="field-eyebrow">Choose your starting point</p><h2 id="destinations-title">A whole country of possibilities.</h2><p>Search the provincial directory, or follow a landscape that catches your eye.</p></div>{destinations.length > 0 && <span className="field-eyebrow">{destinations.length} destinations to explore</span>}</div>{destinations.length > 0 ? <ProvinceHubGrid destinations={destinations} imageWidths={widths} /> : <p className="text-muted-foreground">The destination directory is temporarily unavailable. You can still open the trip planner and return to the directory later.</p>}</section>
      </Container>
      {touristPlacesData.items.length > 0 && <section id="places" className="field-tools-section field-anchor"><Container><div className="field-section-heading"><div><p className="field-eyebrow">Make room for a detour</p><h2>Places worth stopping for.</h2><p>Find a place to visit and save it to your trip.</p></div><Link href="/travel/nearby" className="field-text-link">Explore nearby <ArrowUpRight size={16} aria-hidden="true" /></Link></div><TouristAttractionsGrid places={touristPlacesData.items} total={touristPlacesData.total} imageWidths={widths} destinationSlugById={destinationSlugById} /></Container></section>}
      {destinations.length > 0 && <div id="travel-map" className="field-anchor"><CambodiaMap destinations={destinations} places={mapPlaces} /></div>}
      <Container>
        {guides.length > 0 && <section id="field-guides" className="field-section field-anchor"><div className="field-section-heading"><div><p className="field-eyebrow">A little preparation goes a long way</p><h2>Notes for the journey.</h2><p>Practical guides to help you get started. Check dates and local details before you travel.</p></div></div><div className="grid gap-6 md:grid-cols-2">{guides.slice(0, 4).map((guide) => <TravelGuideCard key={guide.id} guide={guide} />)}</div></section>}
        {transportData.routes.length > 0 && <section className="field-section"><div className="field-section-heading"><div><p className="field-eyebrow">Getting from here to there</p><h2>Find your way.</h2><p>Published Phnom Penh–Siem Reap routes. Confirm current prices and departure times with the operator.</p></div><Link href="/travel/transport" className="field-text-link">More routes <ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="grid gap-5 md:grid-cols-2">{transportData.routes.slice(0, 4).map((route) => <TransportRouteCard key={route.id} route={route} />)}</div></section>}
        {events.length > 0 && <section className="field-section"><div className="field-section-heading"><div><p className="field-eyebrow">Put something on the calendar</p><h2>Something to look forward to.</h2></div></div><div className="grid gap-5 md:grid-cols-2">{events.slice(0, 4).map((event) => <TravelEventCard key={event.id} event={event} />)}</div></section>}
        {trips.length > 0 && <section className="field-section"><div className="field-section-heading"><div><p className="field-eyebrow">A little inspiration</p><h2>Start with an itinerary.</h2></div></div><div className="grid gap-5 md:grid-cols-3">{trips.slice(0, 3).map((trip) => <Link key={trip.id} href={`/travel/trips/${trip.slug}`} className="field-tool-card"><p className="field-eyebrow">{trip.duration_days} days / {trip.destination?.name || "Cambodia"}</p><h3>{trip.title}</h3><p>{cleanText(trip.description)}</p><span className="field-tool-card-bottom">See the itinerary <ArrowUpRight size={16} aria-hidden="true" /></span></Link>)}</div></section>}
        <section className="field-planner-banner mb-10"><div className="field-banner-icon"><Route size={42} aria-hidden="true" /></div><div><p className="field-eyebrow">Go your own way</p><h2>Your places. Your pace. Your plan.</h2><p>Choose a province, add your stops, and make a day-by-day itinerary that fits you.</p></div><Link href="/travel/planner" className="field-button">Start planning <ArrowUpRight size={17} aria-hidden="true" /></Link></section>
      </Container>
      <TripBasketLink />
    </div>
  );
}
