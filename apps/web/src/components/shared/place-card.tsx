import * as React from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CategoryMark } from "@/components/ui/category-mark";
import { Photo } from "@/components/ui/photo";
import { humanize } from "@/lib/format";

export interface PlaceCardProps {
  id: string;
  slug: string;
  name: string;
  localName?: string;
  placeType: string;
  destinationName?: string;
  shortDescription?: string;
  heroImage?: string;
  verificationStatus?: string;
}

/**
 * The place card, on the same paper-and-hairline register as the front page's feature card.
 *
 * Two honesty fixes: the old card printed "Field Verified" on every tile whether the record carried
 * a verification status or not, and defaulted the status to `verified` when the caller passed none.
 * The badge now only appears when a status is actually supplied. A place without a verified
 * photograph keeps the "Photo not verified yet" tile instead of a stock stand-in.
 */
export function PlaceCard({
  slug,
  name,
  localName,
  placeType,
  destinationName,
  shortDescription,
  heroImage,
  verificationStatus,
}: PlaceCardProps) {
  const href = `/travel/place/${slug}`;

  return (
    <Card hoverEffect className="group h-full overflow-hidden">
      <Link href={href} aria-label={name} className="block">
        <Photo
          src={heroImage}
          alt={name}
          ratio="4/3"
          radius="none"
          showCredit={false}
          placeholderLabel="Photo not verified yet"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <CategoryMark category="travel" tone="dot">
            {humanize(placeType)}
          </CategoryMark>
          {verificationStatus && <StatusBadge status={verificationStatus} size="sm" />}
        </div>

        <h3 className="font-display text-lg leading-snug tracking-tight text-foreground">
          <Link href={href} className="line-clamp-2 transition-colors hover:text-accent">
            {name}
          </Link>
        </h3>

        {localName && <p className="text-xs text-muted-foreground">{localName}</p>}

        {destinationName && (
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={13} aria-hidden="true" />
            <span className="truncate">{destinationName}</span>
          </p>
        )}

        {shortDescription && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {shortDescription}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <Link
            href={href}
            className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
          >
            View place
            <ArrowRight
              size={14}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover/link:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </Card>
  );
}
