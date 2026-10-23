import { Metadata } from "next";
import { SectionFront } from "@/components/news/SectionFront";

export const metadata: Metadata = {
  title: "World News",
  description:
    "Global perspectives on geopolitics, international markets, and the major events reshaping our world.",
};

export const revalidate = 60;

/** World section front. Layout lives in `SectionFront`, shared with /cambodia. */
export default function WorldNewsPage() {
  return (
    <SectionFront
      country="WORLD"
      trendingKey="world"
      storyBase="/world/news"
      category="world"
      eyebrow="World"
      title="World"
      description="International reporting on geopolitics, markets and the events beyond Cambodia. Every story is credited to the publisher that reported it."
      secondaryTitle="More across the region and beyond"
      latestTitle="Recently filed"
      attribution="World stories are summarised from the publisher’s own feed and credit the original report. The feeds we draw on are listed in the source registry."
      emptyTitle="No world stories published yet"
      emptyDescription="International reporting appears here as soon as the first stories clear review."
      emptySearch="world"
    />
  );
}
