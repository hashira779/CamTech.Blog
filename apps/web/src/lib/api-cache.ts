const GLOBAL_API_CACHE_KEY = "__camtech_api_swr_cache__";
const GLOBAL_API_INFLIGHT_KEY = "__camtech_api_inflight__";
const MAX_CACHE_ENTRIES = 500;
const MAX_STALE_MS = 24 * 60 * 60 * 1000;

export interface CachedEntry<T = unknown> {
  data: T;
  storedAt: number;
}

export interface FetchSWRResult<T> {
  data: T;
  fromCache: boolean;
  stale: boolean;
}

export interface FetchSWRBaseOptions {
  revalidate?: number;
  timeoutMs?: number;
  publicApiBase?: string;
  fetchImpl?: typeof fetch;
  nowMs?: number;
}

function getCacheStore(): Map<string, CachedEntry> {
  const host = globalThis as typeof globalThis & {
    [GLOBAL_API_CACHE_KEY]?: Map<string, CachedEntry>;
  };
  if (!host[GLOBAL_API_CACHE_KEY]) {
    host[GLOBAL_API_CACHE_KEY] = new Map();
  }
  return host[GLOBAL_API_CACHE_KEY];
}

function getInflightStore(): Map<string, Promise<unknown>> {
  const host = globalThis as typeof globalThis & {
    [GLOBAL_API_INFLIGHT_KEY]?: Map<string, Promise<unknown>>;
  };
  if (!host[GLOBAL_API_INFLIGHT_KEY]) {
    host[GLOBAL_API_INFLIGHT_KEY] = new Map();
  }
  return host[GLOBAL_API_INFLIGHT_KEY];
}

export function clearApiCacheForTests(): void {
  getCacheStore().clear();
  getInflightStore().clear();
}

function setCachedEntry<T>(key: string, data: T, nowMs: number): void {
  const store = getCacheStore();
  if (store.has(key)) {
    store.delete(key);
  }
  while (store.size >= MAX_CACHE_ENTRIES) {
    const oldest = store.keys().next().value;
    if (!oldest) break;
    store.delete(oldest);
  }
  store.set(key, { data, storedAt: nowMs });
}

function getUsableStaleEntry<T>(key: string, nowMs: number): CachedEntry<T> | null {
  const store = getCacheStore();
  const entry = store.get(key) as CachedEntry<T> | undefined;
  if (!entry) return null;
  if (nowMs - entry.storedAt > MAX_STALE_MS) {
    store.delete(key);
    return null;
  }
  return entry;
}

function createTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

function buildPublicFailoverUrl(url: string, publicApiBase: string): string | null {
  if (typeof window !== "undefined") return null;
  if (!url.includes("api:8000/api/v1")) return null;
  const cleanPublic = publicApiBase.replace(/\/+$/, "");
  if (!cleanPublic || url.startsWith(cleanPublic)) return null;
  return url.replace("http://api:8000/api/v1", cleanPublic);
}

async function fetchJsonWithFailover<T>(
  url: string,
  options: {
    revalidate: number;
    timeoutMs: number;
    publicApiBase: string;
    fetchImpl: typeof fetch;
    allowNotFound: boolean;
  },
): Promise<{ status: "ok"; data: T } | { status: "not_found" } | { status: "error" }> {
  const attempt = async (targetUrl: string) => {
    try {
      const res = await options.fetchImpl(targetUrl, {
        next: { revalidate: options.revalidate },
        signal: createTimeoutSignal(options.timeoutMs),
      } as RequestInit);
      if (res.ok) {
        return { status: "ok" as const, data: (await res.json()) as T };
      }
      if (options.allowNotFound && res.status === 404) {
        return { status: "not_found" as const };
      }
      console.warn(`API request to ${targetUrl} returned status ${res.status}, evaluating fallback.`);
      return { status: "error" as const };
    } catch (err) {
      console.warn(`API request to ${targetUrl} failed, evaluating fallback:`, err);
      return { status: "error" as const };
    }
  };

  const primary = await attempt(url);
  if (primary.status !== "error") {
    return primary;
  }

  const failoverUrl = buildPublicFailoverUrl(url, options.publicApiBase);
  if (failoverUrl) {
    const secondary = await attempt(failoverUrl);
    if (secondary.status !== "error") {
      return secondary;
    }
  }

  return { status: "error" };
}

/**
 * Fetches JSON with:
 * 1. Fresh in-memory cache reuse within `revalidate` seconds
 * 2. Request coalescing so concurrent navigations/sections share one upstream request
 * 3. Server-side internal -> public URL failover
 * 4. Last-known-good stale fallback so transient errors/timeouts never wipe UI data
 */
export async function fetchWithSWR<T>(
  url: string,
  fallbackData: T,
  options: FetchSWRBaseOptions & { allowNotFound?: boolean } = {},
): Promise<FetchSWRResult<T>> {
  const revalidate = options.revalidate ?? 60;
  const timeoutMs = options.timeoutMs ?? 8000;
  const publicApiBase =
    options.publicApiBase ?? (process.env.NEXT_PUBLIC_API_URL || "https://cms.camtech.cam/api/v1");
  const fetchImpl = options.fetchImpl ?? fetch;
  const nowMs = options.nowMs ?? Date.now();
  const allowNotFound = options.allowNotFound ?? false;

  const existing = getUsableStaleEntry<T>(url, nowMs);
  if (existing && revalidate > 0 && nowMs - existing.storedAt < revalidate * 1000) {
    return { data: existing.data, fromCache: true, stale: false };
  }

  const inflightStore = getInflightStore();
  const activePromise = inflightStore.get(url) as Promise<FetchSWRResult<T>> | undefined;
  if (activePromise) {
    return activePromise;
  }

  const run = (async (): Promise<FetchSWRResult<T>> => {
    const fetched = await fetchJsonWithFailover<T>(url, {
      revalidate,
      timeoutMs,
      publicApiBase,
      fetchImpl,
      allowNotFound,
    });

    const recordTime = options.nowMs ?? Date.now();
    if (fetched.status === "ok") {
      setCachedEntry(url, fetched.data, recordTime);
      return { data: fetched.data, fromCache: false, stale: false };
    }

    if (fetched.status === "not_found") {
      getCacheStore().delete(url);
      return { data: fallbackData, fromCache: false, stale: false };
    }

    const stale = getUsableStaleEntry<T>(url, recordTime);
    if (stale) {
      return { data: stale.data, fromCache: true, stale: true };
    }

    return { data: fallbackData, fromCache: false, stale: false };
  })();

  inflightStore.set(url, run);
  try {
    return await run;
  } finally {
    if (inflightStore.get(url) === run) {
      inflightStore.delete(url);
    }
  }
}
