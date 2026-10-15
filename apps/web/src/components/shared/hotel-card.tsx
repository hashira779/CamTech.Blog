import * as React from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Photo } from "@/components/ui/photo";
import { StatusBadge } from "@/components/shared/status-badge";
import { cleanText } from "@/lib/format";

export interface HotelCardProps {
  id: string;
  slug: string;
  name: string;
  destinationName: string;
  accommodationType?: string;
  starRating?: number;
  priceRange?: string;
  priceMin?: number;
  currency?: string;
  amenities?: string[];
  heroImage?: string;
  verificationStatus?: string;
}

/**
 * Accommodation card.
 *
 * Three honesty problems fixed here: the image slot used to read "Hotel Visual"
 * over a cool gray box, the price row fell back to the label "Verified Pricing"
 * when no price existed, and `verificationStatus` defaulted to "verified" so a
 * caller that passed nothing still got a green Verified badge. All three now
 * render nothing instead of asserting something the record does not carry.
 */
export function HotelCard({
  slug,
  name,
  destinationName,
  accommodationType,
  starRating,
  priceRange,
  priceMin,
  currency = "$",
  amenities = [],
  heroImage,
  verificationStatus,
}: HotelCardProps) {
  return (
    <Card hoverEffect className="group h-full overflow-hidden">
      <Link href={`/travel/place/${slug}`} className="block">
        <Photo
          src={heroImage}
          alt={cleanText(name)}
          ratio="4/3"
          radius="none"
          showCredit={false}
          placeholderLabel="No verified photograph yet"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {accommodationType && (
            <Badge variant="outline" size="sm">
              {cleanText(accommodationType)}
            </Badge>
          )}
          {verificationStatus && <StatusBadge status={verificationStatus} size="sm" />}
        </div>

        {destinationName && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={12} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{cleanText(destinationName)}</span>
          </p>
        )}

        <h3 className="font-display text-lg leading-snug tracking-tight text-foreground transition-colors group-hover:text-accent">
          <Link href={`/travel/place/${slug}`}>
            {cleanText(name)}
            {typeof starRating === "number" && starRating > 0 && (
              <span className="ml-1.5 text-sm font-sans text-muted-foreground">{starRating}-star</span>
            )}
          </Link>
        </h3>

        {amenities.length > 0 && (
          <p className="text-sm leading-relaxed text-muted-foreground">{amenities.slice(0, 4).join(" · ")}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
          {priceMin && priceMin > 0 ? (
            <p className="text-muted-foreground">
              From{" "}
              <span className="font-medium tabular-nums text-foreground">
                {currency}
                {priceMin}
              </span>{" "}
              / night
            </p>
          ) : priceRange ? (
            <p className="text-muted-foreground">{priceRange}</p>
          ) : (
            <p className="text-xs text-muted-foreground">No published rate on record</p>
          )}

          <Link
            href={`/travel/place/${slug}`}
            className="shrink-0 font-medium text-accent transition-colors hover:text-foreground"
          >
            View
          </Link>
        </div>
      </div>
    </Card>
  );
}
