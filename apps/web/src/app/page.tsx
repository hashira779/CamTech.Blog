import type { Metadata } from "next";
import { getArticles, getDiscoveries } from "@/lib/api";
import { isArticleEligible } from "@/lib/content-quality";
import { HomeClient } from "@/components/home/HomeClient";

export const revalidate = 60;
export const metadata: Metadata = {
  title: { absolute: "CamTech.Blog — Cambodia, Life & Technology" },
  description:
    "Explore Cambodia travel guides and destinations, read verified local reporting on life in Cambodia, and discover visual technology explainers.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [articles, thArticles, aseanArticles, discoveries] = await Promise.all([
    getArticles({ limit: 30 }),
    getArticles({ country: "TH", limit: 4 }),
    getArticles({ country: "ASEAN", limit: 4 }),
    getDiscoveries(),
  ]);

  const seen = new Set<string>();
  const balanced: typeof articles.items = [];
  const pools = [
    articles.items.filter((a) => a.country === "KH" && isArticleEligible(a)),
    thArticles.items.filter(isArticleEligible),
    aseanArticles.items.filter(isArticleEligible),
    articles.items.filter((a) => a.country === "WORLD" && isArticleEligible(a)),
    articles.items.filter(isArticleEligible),
  ];
  for (const pool of pools) {
    const pick = pool.find((a) => !seen.has(a.id));
    if (pick) {
      seen.add(pick.id);
      balanced.push(pick);
    }
  }
  for (const item of articles.items.filter(isArticleEligible)) {
    if (balanced.length >= 6) break;
    if (!seen.has(item.id)) {
      seen.add(item.id);
      balanced.push(item);
    }
  }

  const journal = balanced.slice(0, 6);
  const explainers = discoveries.items.slice(0, 3);

  return <HomeClient journal={journal} explainers={explainers} />;
}
