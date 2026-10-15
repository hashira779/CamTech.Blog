import React from "react";
import Link from "next/link";
import type { TravelGuide } from "@/types";
import { Photo } from "@/components/ui/photo";
import { CategoryMark } from "@/components/ui/category-mark";
import { cleanText, estimateReadingMinutes, formatDate } from "@/lib/format";

interface TravelGuideCardProps {
  guide: TravelGuide;
}

/**
 * Guide card for the travel rails.
 *
 * The photograph now always renders: when the guide has no verified image the
 * tile says so instead of the card quietly dropping to a stock picture. The read
 * time is measured from the guide body rather than the `read_time_minutes`
 * column, which the API seeds with a default of "6 min".
 */
export function TravelGuideCard({ guide }: TravelGuideCardProps) {
  const minutes = estimateReadingMinutes(guide.content);
  const published = formatDate(guide.published_at, "medium");

  return (
    <Link
      href={`/travel/guides/${guide.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs transition-colors hover-lift hover:border-border-strong"
    >
      <Photo
        src={guide.hero_image_url}
        alt={cleanText(guide.title)}
        ratio="16/9"
        radius="none"
        showCredit={false}
        placeholderLabel="No verified photograph yet"
      />

      <div className="flex flex-1 flex-col gap-2 p-5">
        <CategoryMark category="travel" tone="dot">
          Field guide
        </CategoryMark>

        <h3 className="font-display text-xl leading-snug tracking-tight text-foreground transition-colors group-hover:text-accent">
          {cleanText(guide.title)}
        </h3>

        {guide.title_km && <p className="text-sm text-muted-foreground">{guide.title_km}</p>}

        {guide.summary && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {cleanText(guide.summary)}
          </p>
        )}

        {(minutes !== null || published) && (
          <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
            {minutes !== null && <span>{minutes} min read</span>}
            {minutes !== null && published && <span aria-hidden="true">·</span>}
            {published && <span>{published}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}
