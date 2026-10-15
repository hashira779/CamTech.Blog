"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { cleanText } from "@/lib/format";

export interface KeyPointsProps {
  points?: string[] | null;
  className?: string;
}

/**
 * The "Key points" brief.
 *
 * It used to sit in a rose pill box with 12px rose text. It is now the same
 * hairline card as the timeline and the attribution box, so the four article
 * modules read as one family. Entries arrive from the ingestion pipeline as a
 * JSON string; anything that cleans down to an empty line is dropped, and when
 * nothing survives the component renders no frame at all.
 */
export function KeyPoints({ points, className }: KeyPointsProps) {
  const { t } = useI18n();

  const items = (Array.isArray(points) ? points : [])
    .map((point) => cleanText(typeof point === "string" ? point : ""))
    .filter(Boolean);

  if (items.length === 0) return null;

  const label = cleanText(t("article.key_points"));

  return (
    <section
      aria-label={label}
      className={cn(
        "rounded-lg border border-border bg-card p-5 shadow-xs sm:p-6",
        className
      )}
    >
      <h3 className="section-label text-accent">{label}</h3>

      <ul className="mt-4 space-y-3">
        {items.map((point, index) => (
          <li
            key={index}
            className="flex gap-3 text-sm leading-relaxed text-card-foreground sm:text-base sm:leading-[1.75]"
          >
            <span
              aria-hidden="true"
              className="mt-3 h-px w-5 shrink-0 bg-border-strong"
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
