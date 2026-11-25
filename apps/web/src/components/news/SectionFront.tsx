import { SectionFrontClient } from "./SectionFrontClient";
import { getArticles, getTrending } from "@/lib/api";
import type { CategoryKey } from "@/components/ui/category-mark";

export interface SectionFrontProps {
  /** API country filter: "KH" or "WORLD". */
  country: "KH" | "WORLD";
  /** Which trending list feeds the "Most read" rail. */
  trendingKey: "cambodia" | "world";
  /** Base path for story links when a trending row has no URL. */
  storyBase: "/cambodia/news" | "/world/news";
  category: CategoryKey;
  eyebrow: string;
  title: string;
  description: string;
  secondaryTitle: string;
  latestTitle: string;
  attribution: string;
  emptyTitle: string;
  emptyDescription: string;
  emptySearch: string;
}

/**
 * A news section front (/cambodia, /world).
 *
 * Server component that fetches initial data and delegates to `SectionFrontClient`
 * for reactive bilingual i18n switching between English and Khmer.
 */
export async function SectionFront({
  country,
  trendingKey,
  storyBase,
  category,
  eyebrow,
  title,
  description,
  secondaryTitle,
  latestTitle,
  attribution,
  emptyTitle,
  emptyDescription,
  emptySearch,
}: SectionFrontProps) {
  const [{ items, total, unavailable }, trending] = await Promise.all([
    getArticles({ country, limit: 20 }),
    getTrending(),
  ]);

  const mostRead = (trending[trendingKey] || []).slice(0, 6);

  return (
    <SectionFrontClient
      items={items}
      total={total}
      unavailable={unavailable}
      mostRead={mostRead}
      country={country}
      trendingKey={trendingKey}
      storyBase={storyBase}
      category={category}
      defaultEyebrow={eyebrow}
      defaultTitle={title}
      defaultDescription={description}
      defaultSecondaryTitle={secondaryTitle}
      defaultLatestTitle={latestTitle}
      defaultAttribution={attribution}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptySearch={emptySearch}
    />
  );
}
