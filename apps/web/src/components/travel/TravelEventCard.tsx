import React from "react";
import type { TravelEvent } from "@/types";
import { MapPin } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import { CategoryMark } from "@/components/ui/category-mark";
import { cleanText, formatDate } from "@/lib/format";

interface TravelEventCardProps {
  event: TravelEvent;
}

/**
 * Event card.
 *
 * Dates go through `formatDate` instead of printing the raw ISO string, and the
 * end date only appears when the record has one. There is no event detail route,
 * so the card stays unlinked rather than pointing at a page that does not exist.
 */
export function TravelEventCard({ event }: TravelEventCardProps) {
  const start = formatDate(event.start_date, "long");
  const end = formatDate(event.end_date, "long");
  const when = start && end && end !== start ? `${start} — ${end}` : start || end;
  const typeLabel = event.event_type?.toLowerCase().replace(/_/g, " ");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs transition-colors hover:border-border-strong">
      <Photo zoom
        src={event.hero_image_url}
        alt={cleanText(event.name)}
        ratio="3/2"
        radius="none"
        showCredit={false}
        placeholderLabel="No verified photograph yet"
      />

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {typeLabel && (
            <CategoryMark category={typeLabel} tone="dot">
              {typeLabel}
            </CategoryMark>
          )}
          {when && <p className="text-xs tabular-nums text-muted-foreground">{when}</p>}
        </div>

        <h3 className="font-display text-lg leading-snug tracking-tight text-foreground">{cleanText(event.name)}</h3>
        {event.name_km && <p className="text-sm text-muted-foreground">{event.name_km}</p>}

        {event.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {cleanText(event.description)}
          </p>
        )}

        {event.venue && (
          <p className="mt-auto flex items-start gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
            <MapPin size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{event.venue}</span>
          </p>
        )}
      </div>
    </article>
  );
}
