import * as React from "react";
import Link from "next/link";
import { MapPin, Check, Wifi, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { DESIGN_TOKENS } from "@/lib/tokens";

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

export function HotelCard({
  slug,
  name,
  destinationName,
  accommodationType = "HOTEL",
  starRating,
  priceRange,
  priceMin,
  currency = "$",
  amenities = [],
  heroImage,
  verificationStatus = "verified",
}: HotelCardProps) {
  return (
    <Card hoverEffect className="overflow-hidden flex flex-col h-full group">
      {/* 4:3 Image Container */}
      <Link href={`/travel/place/${slug}`} className="block relative overflow-hidden">
        <div className={`${DESIGN_TOKENS.aspectRatio.hotel} bg-slate-100 dark:bg-slate-800 w-full overflow-hidden`}>
          {heroImage ? (
            <img
              src={heroImage}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800">
              <span className="text-xs uppercase font-medium">Hotel Visual</span>
            </div>
          )}
        </div>
        <div className="absolute top-2.5 left-2.5">
          <Badge variant="secondary" size="sm" className="bg-white/90 backdrop-blur-xs text-slate-900 border-slate-200">
            {accommodationType}
          </Badge>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Destination & Verification */}
        <div className="flex items-center justify-between gap-2 mb-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1 truncate">
            <MapPin size={DESIGN_TOKENS.iconSize.xs} className="text-slate-400 shrink-0" />
            <span className="truncate">{destinationName}</span>
          </div>
          <StatusBadge status={verificationStatus} size="sm" />
        </div>

        {/* Name */}
        <Link href={`/travel/place/${slug}`} className="mb-2">
          <h3 className="text-base font-semibold leading-snug tracking-tight text-slate-900 group-hover:text-teal-700 dark:text-slate-100 dark:group-hover:text-teal-400 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Verified Amenities Chips */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded"
              >
                <Check size={10} className="text-emerald-500" />
                {amenity}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 px-1 py-0.5 self-center">
                +{amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Pricing / Booking Footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            {priceMin ? (
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">From</span>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {currency}{priceMin}
                </span>
                <span className="text-[11px] text-slate-400">/night</span>
              </div>
            ) : priceRange ? (
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {priceRange}
              </span>
            ) : (
              <span className="text-xs text-slate-400">Verified Pricing</span>
            )}
          </div>

          <Link
            href={`/travel/place/${slug}`}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
          >
            Check Rates
          </Link>
        </div>
      </div>
    </Card>
  );
}
