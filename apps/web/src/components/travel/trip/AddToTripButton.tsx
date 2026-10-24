"use client";

import * as React from "react";
import Link from "next/link";
import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { toggleSavedPlace, useSavedPlaces, type SavedPlace } from "@/lib/travel/trip-store";
import { useJourneyCopy } from "@/components/travel/journey/copy";

/**
 * Saves a place to the traveller's trip (this browser only) or takes it out again. The planner
 * schedules saved places first. Storage failures are reported, never swallowed — the button does
 * not claim "In your trip" unless the write succeeded.
 */
export function AddToTripButton({
  place,
  variant = "chip",
  className = "",
}: {
  place: SavedPlace;
  variant?: "chip" | "solid" | "onDark";
  className?: string;
}) {
  const { copy } = useJourneyCopy();
  const saved = useSavedPlaces();
  const inTrip = saved.some((p) => p.slug === place.slug);
  const [failed, setFailed] = React.useState(false);

  const styles = {
    chip: inTrip
      ? "border-transparent bg-tv-jungle text-tv-ivory"
      : "border-border bg-card text-foreground hover:border-border-strong",
    solid: inTrip
      ? "border-transparent bg-tv-jungle text-tv-ivory"
      : "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
    onDark: inTrip
      ? "border-transparent bg-tv-gold-soft text-[#1b130a]"
      : "border-tv-ivory/40 bg-tv-night/30 text-tv-ivory hover:border-tv-ivory/80",
  }[variant];

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        aria-pressed={inTrip}
        onClick={() => setFailed(!toggleSavedPlace(place))}
        className={`pressable inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${styles}`}
      >
        {inTrip ? <BookmarkCheck size={14} aria-hidden="true" /> : <BookmarkPlus size={14} aria-hidden="true" />}
        {inTrip ? copy.inTrip : copy.addToTrip}
        <span className="sr-only">: {place.name}</span>
      </button>
      {failed && (
        <span role="alert" className="text-xs text-destructive">
          {copy.tripSaveFailed}
        </span>
      )}
    </span>
  );
}

/** A small floating link to the planner showing how many places are saved. Hidden when empty. */
export function TripBasketLink() {
  const { copy } = useJourneyCopy();
  const saved = useSavedPlaces();
  if (saved.length === 0) return null;
  return (
    <Link
      href="/travel/planner?from=saved"
      className="tv-basket pressable fixed bottom-5 left-1/2 z-40 inline-flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full px-5 text-sm font-semibold shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:left-auto sm:right-24 sm:translate-x-0"
    >
      <BookmarkCheck size={16} aria-hidden="true" />
      {copy.viewTrip(saved.length)}
    </Link>
  );
}
