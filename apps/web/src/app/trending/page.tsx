import { Metadata } from "next";
import { getTrending } from "@/lib/api";
import { TrendingClient } from "@/components/news/TrendingClient";

export const metadata: Metadata = {
  title: "Trending",
  description:
    "Authentic reader-engagement rankings for Cambodia, ASEAN, Thai media on Cambodia, and the world.",
};

export const revalidate = 60;

export default async function TrendingPage() {
  const trendingData = await getTrending();
  return <TrendingClient trendingData={trendingData} />;
}
