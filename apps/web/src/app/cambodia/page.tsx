import { Metadata } from "next";
import { SectionFront } from "@/components/news/SectionFront";

export const metadata: Metadata = {
  title: "Cambodia & Regional News",
  description:
    "In-depth reporting, verified government updates, economy, infrastructure and technology across Phnom Penh and every province.",
};

export const revalidate = 60;

/** Cambodia section front. Layout lives in `SectionFront`, shared with /world. */
export default function CambodiaNewsPage() {
  return (
    <SectionFront
      country="KH"
      trendingKey="cambodia"
      storyBase="/cambodia/news"
      category="news"
      eyebrow="Cambodia"
      title="Cambodia & regional"
      description="Reporting from Phnom Penh and the provinces. Each story is summarised here and credited to the publisher it came from, with a link back to the original."
      secondaryTitle="More from Cambodia"
      latestTitle="Lately from the provinces"
      attribution="Cambodia stories are gathered from named publishers and link out to the original report. The feeds we draw on are listed in the source registry."
      emptyTitle="No Cambodia stories published yet"
      emptyDescription="Reporting appears here as soon as the first stories clear review."
      emptySearch="Cambodia"
    />
  );
}
