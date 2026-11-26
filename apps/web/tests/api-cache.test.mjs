import test from "node:test";
import assert from "node:assert/strict";
import { clearApiCacheForTests, fetchWithSWR } from "../src/lib/api-cache.ts";

test("fetchWithSWR reuses fresh cached data within revalidate window without refetching", async () => {
  clearApiCacheForTests();
  let calls = 0;
  const mockFetch = async () => {
    calls += 1;
    return new Response(JSON.stringify([{ id: "1", name: "Siem Reap" }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const first = await fetchWithSWR("https://cms.camtech.cam/api/v1/travel/destinations", [], {
    revalidate: 60,
    nowMs: 1_000_000,
    fetchImpl: mockFetch,
  });
  const second = await fetchWithSWR("https://cms.camtech.cam/api/v1/travel/destinations", [], {
    revalidate: 60,
    nowMs: 1_020_000,
    fetchImpl: mockFetch,
  });

  assert.equal(calls, 1);
  assert.equal(first.fromCache, false);
  assert.equal(second.fromCache, true);
  assert.equal(second.stale, false);
  assert.equal(second.data.length, 1);
});

test("fetchWithSWR coalesces concurrent requests and serves stale cache on backend errors", async () => {
  clearApiCacheForTests();
  let calls = 0;
  let shouldFail = false;

  const mockFetch = async () => {
    calls += 1;
    await new Promise((r) => setTimeout(r, 10));
    if (shouldFail) {
      return new Response("Service unavailable", { status: 503 });
    }
    return new Response(JSON.stringify({ items: [{ slug: "news-1" }], total: 1 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const url = "https://cms.camtech.cam/api/v1/articles?limit=20";
  const [a, b] = await Promise.all([
    fetchWithSWR(url, { items: [], total: 0 }, { revalidate: 60, nowMs: 1_000_000, fetchImpl: mockFetch }),
    fetchWithSWR(url, { items: [], total: 0 }, { revalidate: 60, nowMs: 1_000_005, fetchImpl: mockFetch }),
  ]);

  assert.equal(calls, 1);
  assert.equal(a.data.items.length, 1);
  assert.equal(b.data.items.length, 1);

  shouldFail = true;
  const staleFallback = await fetchWithSWR(
    url,
    { items: [], total: 0 },
    { revalidate: 60, nowMs: 1_120_000, fetchImpl: mockFetch },
  );

  assert.equal(staleFallback.fromCache, true);
  assert.equal(staleFallback.stale, true);
  assert.equal(staleFallback.data.items.length, 1);
});

test("fetchWithSWR treats HTTP 404 as legitimate null when allowNotFound is set", async () => {
  clearApiCacheForTests();
  const mockFetch = async () => new Response("Not found", { status: 404 });

  const res = await fetchWithSWR("https://cms.camtech.cam/api/v1/articles/missing", null, {
    revalidate: 60,
    allowNotFound: true,
    fetchImpl: mockFetch,
  });

  assert.equal(res.data, null);
  assert.equal(res.fromCache, false);
});
