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
  const [articles, discoveries] = await Promise.all([
    getArticles({ limit: 30 }),
    getDiscoveries(),
  ]);

  const journal = articles.items.filter(isArticleEligible).slice(0, 5);
  const explainers = discoveries.items.slice(0, 3);

  return <HomeClient journal={journal} explainers={explainers} />;
}
