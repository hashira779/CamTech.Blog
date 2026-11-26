import type { Metadata } from "next";
import { getArticles, getDiscoveries, getTools } from "@/lib/api";
import { isArticleEligible } from "@/lib/content-quality";
import { HomeClient } from "@/components/home/HomeClient";

export const revalidate = 60;
export const metadata: Metadata = {
  title: { absolute: "CamTech.Blog — Good places, useful things, fresh perspectives" },
  description:
    "Find your next Cambodian escape, a useful everyday tool, or an idea worth understanding. Travel, technology and practical discovery in one place.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [articles, discoveries, tools] = await Promise.all([
    getArticles({ limit: 30 }),
    getDiscoveries(),
    getTools(),
  ]);

  const journal = articles.items.filter(isArticleEligible).slice(0, 3);
  const explainers = discoveries.items.slice(0, 3);
  const selectedTools = [
    "cv-builder",
    "cambodia-change-calculator",
    "qr-code-generator",
    "image-compressor",
  ]
    .map((slug) => tools.find((tool) => tool.slug === slug))
    .filter((tool) => tool !== undefined);

  return (
    <HomeClient
      journal={journal}
      explainers={explainers}
      selectedTools={selectedTools}
    />
  );
}
