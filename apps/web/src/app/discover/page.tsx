import { Metadata } from "next";
import { getDiscoveries } from "@/lib/api";
import { DiscoverHubClient } from "@/components/discover/DiscoverHubClient";

export const metadata: Metadata = {
  title: "Visual Discoveries",
  description:
    "How the world actually works: from the quantum relativity behind your smartphone GPS to the underwater fiber optics that carry the internet.",
};

export const revalidate = 60;

export default async function DiscoverHubPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const resolved = await searchParams;
  const activeCategory = resolved.category || "";
  const { items } = await getDiscoveries(activeCategory || undefined);
  const { items: allItems } = activeCategory ? await getDiscoveries() : { items };

  const categories = Array.from(
    new Set(allItems.map((d) => d.category).filter(Boolean))
  ).slice(0, 12);

  return (
    <DiscoverHubClient
      items={items}
      categories={categories}
      activeCategory={activeCategory}
    />
  );
}
