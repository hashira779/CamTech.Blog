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
import { ALL_TOOLS } from "./tools-data";


export const API_BASE = typeof window === "undefined"
  ? (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1")
  : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1");

function getTimeoutSignal(ms = 4000): AbortSignal {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function fetchWithFallback<T>(url: string, fallbackData: T, revalidate = 60, timeoutMs = 4000): Promise<T> {
  try {
    const res = await fetch(url, {
      next: { revalidate },
      signal: getTimeoutSignal(timeoutMs),
    });
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
    const res = await fetch(`${API_BASE}/authors/${slug}`, { next: { revalidate: 60 }, signal: getTimeoutSignal(4000) });
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
    const res = await fetch(`${API_BASE}/sources/${slug}`, { next: { revalidate: 60 }, signal: getTimeoutSignal(4000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_BASE}/articles/${slug}`, { next: { revalidate: 60 }, signal: getTimeoutSignal(4000) });
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

export async function getDiscoveries(category?: string): Promise<{ items: Discovery[]; total: number }> {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  query.set("limit", "50");
  const url = `${API_BASE}/discoveries?${query.toString()}`;
  return fetchWithFallback(url, { items: [], total: 0 });
}

export async function getDiscoveryBySlug(slug: string): Promise<Discovery | null> {
  try {
    const res = await fetch(`${API_BASE}/discoveries/${slug}`, { next: { revalidate: 60 }, signal: getTimeoutSignal(4000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getDailyQuiz(): Promise<Quiz | null> {
  try {
    const res = await fetch(`${API_BASE}/quizzes/daily`, { next: { revalidate: 300 }, signal: getTimeoutSignal(4000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getTools(): Promise<Tool[]> {
  const url = `${API_BASE}/tools`;
  const tools = await fetchWithFallback(url, ALL_TOOLS);
  return tools && tools.length > 0 ? tools : ALL_TOOLS;
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  try {
    const res = await fetch(`${API_BASE}/tools/${slug}`, { next: { revalidate: 60 }, signal: getTimeoutSignal(4000) });
    if (res.ok) return await res.json();
  } catch (err) {
    // Fallback to local catalog
  }
  return ALL_TOOLS.find((t) => t.slug === slug) || null;
}


export async function searchGlobal(q: string, type?: string): Promise<{ query: string; total: number; results: SearchResultItem[] }> {
  try {
    const params = new URLSearchParams({ q, limit: "50" });
    if (type) params.set("type", type);
    const res = await fetch(`${API_BASE}/search?${params.toString()}`, { signal: getTimeoutSignal(4000) });
    if (!res.ok) return { query: q, total: 0, results: [] };
    return await res.json();
  } catch (err) {
    return { query: q, total: 0, results: [] };
  }
}

export interface SearchAnswer {
  query: string;
  answer: string | null;
  engine: string | null;
  citations: { title: string; url: string; type: string }[];
}

export async function getSearchAnswer(q: string): Promise<SearchAnswer | null> {
  try {
    const res = await fetch(`${API_BASE}/search/answer?q=${encodeURIComponent(q)}`, { signal: getTimeoutSignal(12000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

// --- Travel API Handlers ---

export async function getDestinations(featuredOnly = false): Promise<Destination[]> {
  const url = `${API_BASE}/travel/destinations${featuredOnly ? "?featured_only=true" : ""}`;
  return fetchWithFallback(url, []);
}

export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  try {
    const res = await fetch(`${API_BASE}/travel/destinations/${slug}`, { next: { revalidate: 60 }, signal: getTimeoutSignal(4000) });
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
    const res = await fetch(`${API_BASE}/travel/places/${slug}`, { next: { revalidate: 60 }, signal: getTimeoutSignal(4000) });
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
    const res = await fetch(`${API_BASE}/travel/trips/${slug}`, { next: { revalidate: 60 }, signal: getTimeoutSignal(4000) });
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
      signal: getTimeoutSignal(8000),
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
      signal: getTimeoutSignal(6000),
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
    const res = await fetch(`${API_BASE}/transport/operators/${slug}`, { next: { revalidate: 60 }, signal: getTimeoutSignal(4000) });
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

    const res = await fetch(`${API_BASE}/nearby?${query.toString()}`, { next: { revalidate: 60 }, signal: getTimeoutSignal(4000) });
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
    const res = await fetch(`${API_BASE}/travel-guides/${slug}`, { next: { revalidate: 60 }, signal: getTimeoutSignal(4000) });
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

