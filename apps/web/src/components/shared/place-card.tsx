import * as React from "react";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DESIGN_TOKENS } from "@/lib/tokens";

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

export function PlaceCard({
  slug,
  name,
  localName,
  placeType,
  destinationName,
  shortDescription,
  heroImage,
  verificationStatus = "verified",
}: PlaceCardProps) {
  return (
    <Card hoverEffect className="overflow-hidden flex flex-col h-full group">
      {/* 4:3 Image Container */}
      <Link href={`/travel/place/${slug}`} className="block relative overflow-hidden">
        <div className={`${DESIGN_TOKENS.aspectRatio.place} bg-slate-100 dark:bg-slate-800 w-full overflow-hidden`}>
          {heroImage ? (
            <img
              src={heroImage}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800">
              <span className="text-xs uppercase font-medium">Place Visual</span>
            </div>
          )}
        </div>
        <div className="absolute top-2.5 left-2.5">
          <Badge variant="secondary" size="sm" className="bg-white/90 backdrop-blur-xs text-slate-900 border-slate-200">
            {placeType}
          </Badge>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Destination & Verification */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
          {destinationName ? (
            <div className="flex items-center gap-1 truncate">
              <MapPin size={DESIGN_TOKENS.iconSize.xs} className="text-slate-400 shrink-0" />
              <span className="truncate">{destinationName}</span>
            </div>
          ) : (
            <span />
          )}
          <StatusBadge status={verificationStatus} size="sm" />
        </div>

        {/* Title */}
        <Link href={`/travel/place/${slug}`} className="mb-1.5">
          <h3 className="text-base font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-teal-700 dark:text-slate-100 dark:group-hover:text-teal-400 transition-colors">
            {name}
          </h3>
          {localName && (
            <p className="text-xs text-slate-400 font-khmer mt-0.5">{localName}</p>
          )}
        </Link>

        {/* Short description */}
        {shortDescription && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {shortDescription}
          </p>
        )}

        {/* Action */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Field Verified
          </span>
          <Link
            href={`/travel/place/${slug}`}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            View Place
            <ArrowRight size={DESIGN_TOKENS.iconSize.xs} />
          </Link>
        </div>
      </div>
    </Card>
  );
}
