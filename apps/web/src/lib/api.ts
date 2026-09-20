import {
  Article,
  Discovery,
  Quiz,
  Tool,
  TrendingResponse,
  SearchResultItem,
  Author,
  Source,
  Destination,
  Place,
  Trip,
  TripPlanResponse,
  PlaceSuggestionCreate,
  NavigationItem,
  HomepageSection,
  TransportOperator,
  TransportHub,
  TransportRoute,
  RouteSearchResponse,
  NearbySearchResponse,
  TravelGuide,
  TravelEvent
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchWithFallback<T>(url: string, fallbackData: T): Promise<T> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.warn(`API request to ${url} returned status ${res.status}, using fallback.`);
      return fallbackData;
    }
    return await res.json();
  } catch (err) {
    console.warn(`API request to ${url} failed, using local fallback data:`, err);
    return fallbackData;
  }
}

export async function getArticles(params: {
  country?: string;
  category?: string;
  author?: string;
  source?: string;
  limit?: number;
  page?: number;
} = {}): Promise<{ items: Article[]; total: number }> {
  const query = new URLSearchParams();
  if (params.country) query.set("country", params.country);
  if (params.category) query.set("category", params.category);
  if (params.author) query.set("author", params.author);
  if (params.source) query.set("source", params.source);
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.page) query.set("page", params.page.toString());

  const url = `${API_BASE}/articles?${query.toString()}`;
  return fetchWithFallback(url, { items: [], total: 0 });
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  try {
    const res = await fetch(`${API_BASE}/authors/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getSources(): Promise<Source[]> {
  const url = `${API_BASE}/sources`;
  return fetchWithFallback(url, []);
}

export async function getSourceBySlug(slug: string): Promise<Source | null> {
  try {
    const res = await fetch(`${API_BASE}/sources/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_BASE}/articles/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch article:", err);
    return null;
  }
}

export async function getTrending(): Promise<TrendingResponse> {
  const url = `${API_BASE}/trending`;
  return fetchWithFallback(url, {
    cambodia: [],
    world: [],
    editor_picks: []
  });
}

export async function getDiscoveries(): Promise<{ items: Discovery[]; total: number }> {
  const url = `${API_BASE}/discoveries`;
  return fetchWithFallback(url, { items: [], total: 0 });
}

export async function getDiscoveryBySlug(slug: string): Promise<Discovery | null> {
  try {
    const res = await fetch(`${API_BASE}/discoveries/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getDailyQuiz(): Promise<Quiz | null> {
  try {
    const res = await fetch(`${API_BASE}/quizzes/daily`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getTools(): Promise<Tool[]> {
  const url = `${API_BASE}/tools`;
  return fetchWithFallback(url, []);
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  try {
    const res = await fetch(`${API_BASE}/tools/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function searchGlobal(q: string): Promise<{ query: string; total: number; results: SearchResultItem[] }> {
  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return { query: q, total: 0, results: [] };
    return await res.json();
  } catch (err) {
    return { query: q, total: 0, results: [] };
  }
}

// --- Travel API Handlers ---

export async function getDestinations(featuredOnly = false): Promise<Destination[]> {
  const url = `${API_BASE}/travel/destinations${featuredOnly ? "?featured_only=true" : ""}`;
  return fetchWithFallback(url, []);
}

export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  try {
    const res = await fetch(`${API_BASE}/travel/destinations/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getPlaces(params: {
  destination?: string;
  type?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<{ items: Place[]; total: number }> {
  const query = new URLSearchParams();
  if (params.destination) query.set("destination", params.destination);
  if (params.type) query.set("type", params.type);
  if (params.search) query.set("search", params.search);
  if (params.featured !== undefined) query.set("featured", params.featured.toString());
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.offset) query.set("offset", params.offset.toString());

  const url = `${API_BASE}/travel/places?${query.toString()}`;
  return fetchWithFallback(url, { items: [], total: 0 });
}

export async function getPlaceBySlug(slug: string): Promise<Place | null> {
  try {
    const res = await fetch(`${API_BASE}/travel/places/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getTrips(params: {
  destination?: string;
  featured?: boolean;
} = {}): Promise<Trip[]> {
  const query = new URLSearchParams();
  if (params.destination) query.set("destination", params.destination);
  if (params.featured !== undefined) query.set("featured", params.featured.toString());

  const url = `${API_BASE}/travel/trips?${query.toString()}`;
  return fetchWithFallback(url, []);
}

export async function getTripBySlug(slug: string): Promise<Trip | null> {
  try {
    const res = await fetch(`${API_BASE}/travel/trips/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function generateTripPlan(payload: {
  destination_slug: string;
  duration_days: number;
  travel_style: string;
  budget_level: string;
  interests?: string[];
}): Promise<TripPlanResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/travel/planner/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Trip plan generation error:", err);
    return null;
  }
}

export async function submitPlaceSuggestion(data: PlaceSuggestionCreate): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/travel/suggestions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return { success: false, message: "Submission rejected" };
    return { success: true };
  } catch (err) {
    return { success: false, message: "Network connection error" };
  }
}

export async function getNavigationItems(): Promise<NavigationItem[]> {
  const url = `${API_BASE}/config/navigation`;
  return fetchWithFallback(url, []);
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const url = `${API_BASE}/config/homepage-sections`;
  return fetchWithFallback(url, []);
}

export async function searchTransportRoutes(
  origin: string,
  destination: string,
  type?: string
): Promise<RouteSearchResponse> {
  const query = new URLSearchParams({ origin, destination });
  if (type) query.set("type", type);
  const url = `${API_BASE}/transport/search?${query.toString()}`;
  return fetchWithFallback(url, {
    origin,
    destination,
    total_options: 0,
    routes: []
  });
}

export async function getTransportOperators(type?: string): Promise<TransportOperator[]> {
  const query = new URLSearchParams();
  if (type) query.set("type", type);
  const url = `${API_BASE}/transport/operators${query.toString() ? `?${query.toString()}` : ""}`;
  return fetchWithFallback(url, []);
}

export async function getTransportOperator(slug: string): Promise<TransportOperator | null> {
  try {
    const res = await fetch(`${API_BASE}/transport/operators/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getTransportHubs(destinationId?: string, type?: string): Promise<TransportHub[]> {
  const query = new URLSearchParams();
  if (destinationId) query.set("destination_id", destinationId);
  if (type) query.set("type", type);
  const url = `${API_BASE}/transport/hubs${query.toString() ? `?${query.toString()}` : ""}`;
  return fetchWithFallback(url, []);
}

export async function searchNearby(params: {
  place?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  type?: string;
  limit?: number;
}): Promise<NearbySearchResponse | null> {
  try {
    const query = new URLSearchParams();
    if (params.place) query.set("place", params.place);
    if (params.lat !== undefined) query.set("lat", params.lat.toString());
    if (params.lng !== undefined) query.set("lng", params.lng.toString());
    if (params.radius) query.set("radius", params.radius.toString());
    if (params.type) query.set("type", params.type);
    if (params.limit) query.set("limit", params.limit.toString());

    const res = await fetch(`${API_BASE}/nearby?${query.toString()}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getTravelGuides(destination?: string): Promise<TravelGuide[]> {
  const query = new URLSearchParams();
  if (destination) query.set("destination", destination);
  const url = `${API_BASE}/travel-guides${query.toString() ? `?${query.toString()}` : ""}`;
  return fetchWithFallback(url, []);
}

export async function getTravelGuide(slug: string): Promise<TravelGuide | null> {
  try {
    const res = await fetch(`${API_BASE}/travel-guides/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getTravelEvents(destination?: string): Promise<TravelEvent[]> {
  const query = new URLSearchParams();
  if (destination) query.set("destination", destination);
  const url = `${API_BASE}/events${query.toString() ? `?${query.toString()}` : ""}`;
  return fetchWithFallback(url, []);
}

