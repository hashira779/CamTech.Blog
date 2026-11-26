import { Metadata } from "next";
import { getArticles, getTrending } from "@/lib/api";
import { NewsHubClient, type DeskKey } from "@/components/news/NewsHubClient";

export const metadata: Metadata = {
  title: "News & Regional Desks",
  description:
    "Verified reporting organized across Cambodia, Thai news about Cambodia, ASEAN regional affairs, and Global news.",
};

export const dynamic = "force-dynamic";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ desk?: string }>;
}) {
  const resolved = await searchParams;
  const rawDesk = (resolved.desk || "ALL").toUpperCase();
  const initialDesk: DeskKey =
    rawDesk === "KH" || rawDesk === "TH" || rawDesk === "ASEAN" || rawDesk === "WORLD"
      ? (rawDesk as DeskKey)
      : "ALL";

  const [allRes, khRes, thRes, aseanRes, worldRes, trending] = await Promise.all([
    getArticles({ limit: 30 }),
    getArticles({ country: "KH", limit: 20 }),
    getArticles({ country: "TH", limit: 20 }),
    getArticles({ country: "ASEAN", limit: 20 }),
    getArticles({ country: "WORLD", limit: 20 }),
    getTrending(),
  ]);

  return (
    <NewsHubClient
      key={initialDesk}
      initialDesk={initialDesk}
      allItems={allRes.items}
      khItems={khRes.items}
      thItems={thRes.items}
      aseanItems={aseanRes.items}
      worldItems={worldRes.items}
      trending={trending}
      unavailable={allRes.unavailable}
    />
  );
}
