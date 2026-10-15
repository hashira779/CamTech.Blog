"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { cleanText } from "@/lib/format";

export interface TimelineItem {
  time: string;
  event: string;
}

export interface TimelineViewProps {
  items?: TimelineItem[] | null;
  className?: string;
}

/**
 * Chronology of the story.
 *
 * The dot-and-rail treatment is gone. This is a newspaper "how it unfolded"
 * table instead: hairline rows, the real date or label in the left column, the
 * event in the right. Rows with no event text are dropped, and an empty or
 * unparseable `timeline` field renders nothing rather than an empty box.
 */
export function TimelineView({ items, className }: TimelineViewProps) {
  const { t } = useI18n();

  const rows = (Array.isArray(items) ? items : [])
    .map((item) => {
      if (!item) return null;
      if (typeof item === "string") {
        return { time: "", event: cleanText(item) };
      }
      return {
        time: cleanText(String(item.time ?? "")),
        event: cleanText(String(item.event ?? "")),
      };
    })
    .filter((row): row is { time: string; event: string } => Boolean(row?.event));

  if (rows.length === 0) return null;

  const label = cleanText(t("article.timeline"));

  return (
    <section
      aria-label={label}
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-xs sm:p-6",
        className
      )}
    >
      <h3 className="section-label text-accent">{label}</h3>

      <ol className="mt-2 border-t border-border">
        {rows.map((row, index) => (
          <li
            key={index}
            className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 sm:flex-row sm:gap-6 sm:py-4"
          >
            {row.time && (
              <span className="section-label w-48 shrink-0 pt-0.5">{row.time}</span>
            )}
            <p className="text-sm leading-relaxed text-card-foreground sm:leading-[1.75]">
              {row.event}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
