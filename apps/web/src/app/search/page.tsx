import { Metadata } from "next";
import { searchGlobal } from "@/lib/api";
import { SearchClient } from "@/components/search/SearchClient";
import type { SearchResultItem } from "@/types";

export const metadata: Metadata = {
  title: "Search",
  description:
    "One search across news, visual discoveries, travel provinces, places, guides, events, tools and authors.",
};

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const resolved = await searchParams;
  const q = (resolved.q || "").trim();
  const activeType = (resolved.type || "").toUpperCase();
  const data = q
    ? await searchGlobal(q)
    : { query: q, total: 0, results: [] as SearchResultItem[] };

  return <SearchClient q={q} activeType={activeType} results={data.results || []} />;
}
