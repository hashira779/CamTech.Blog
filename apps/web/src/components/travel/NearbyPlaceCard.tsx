import React from "react";
import Link from "next/link";
import { Car, Footprints, MapPin } from "lucide-react";
import type { NearbyPlace } from "@/types";
import { CategoryMark } from "@/components/ui/category-mark";
import { cleanText } from "@/lib/format";

interface NearbyPlaceCardProps {
  item: NearbyPlace;
}

/**
 * One result, one row.
 *
 * Distances here are straight-line figures the API computes from coordinates, so
 * they are labelled as such, and an estimate is only printed when the record
 * carries it. The old row also invented an address — it fell back to the literal
 * string "Siem Reap" whenever `place.address` was empty.
 */
export function NearbyPlaceCard({ item }: NearbyPlaceCardProps) {
  const { place, distance_km, estimated_walk_minutes, estimated_drive_minutes } = item;
  const typeLabel = place.place_type?.toLowerCase().replace(/_/g, " ");
  const hasEstimate = estimated_walk_minutes > 0 || estimated_drive_minutes > 0;

  return (
    <article className="border-t border-border py-5 first:border-t-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {typeLabel && (
            <CategoryMark category="travel" tone="dot">
              {typeLabel}
            </CategoryMark>
          )}
          <h3 className="mt-1.5 font-display text-lg leading-snug tracking-tight text-foreground">
            <Link href={`/travel/place/${place.slug}`} className="transition-colors hover:text-accent">
              {cleanText(place.name)}
            </Link>
          </h3>
          {place.local_name && <p className="mt-0.5 text-sm text-muted-foreground">{place.local_name}</p>}
          {place.description && (
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {cleanText(place.description)}
            </p>
          )}
          {place.address && (
            <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{place.address}</span>
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-display text-xl leading-none tracking-tight text-foreground tabular-nums">
            {distance_km}
            <span className="ml-1 text-sm font-sans text-muted-foreground">km</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">straight line</p>
        </div>
      </div>

      {hasEstimate && (
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
          {estimated_drive_minutes > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Car size={13} aria-hidden="true" />
              about <span className="tabular-nums text-foreground">{estimated_drive_minutes} min</span> by road
            </span>
          )}
          {estimated_walk_minutes > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Footprints size={13} aria-hidden="true" />
              about <span className="tabular-nums text-foreground">{estimated_walk_minutes} min</span> on foot
            </span>
          )}
        </div>
      )}
    </article>
  );
}
