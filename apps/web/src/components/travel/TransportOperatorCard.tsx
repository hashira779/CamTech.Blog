import React from "react";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import type { TransportOperator } from "@/types";
import { CategoryMark } from "@/components/ui/category-mark";
import { cleanText } from "@/lib/format";

interface TransportOperatorCardProps {
  operator: TransportOperator;
}

/**
 * One operator, one row of the directory.
 *
 * `rating` and `review_count` are seeded columns on the operator record rather
 * than reader feedback, so the star score and "N traveler reviews" line are gone.
 * The verification chip stays because `verification_status` is a real field.
 */
export function TransportOperatorCard({ operator }: TransportOperatorCardProps) {
  let amenities: string[] = [];
  try {
    amenities = JSON.parse(operator.amenities_json || "[]");
  } catch {
    amenities = [];
  }

  return (
    <article className="border-t border-border py-5 first:border-t-0">
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-4">
          <CategoryMark category="transport" tone="dot">
            {operator.operator_type?.toLowerCase().replace(/_/g, " ") || "operator"}
          </CategoryMark>
          <h3 className="mt-1.5 font-display text-lg leading-snug tracking-tight text-foreground">
            <Link href={`/travel/operator/${operator.slug}`} className="transition-colors hover:text-accent">
              {cleanText(operator.name)}
            </Link>
          </h3>
          {operator.local_name && (
            <p className="mt-0.5 text-sm text-muted-foreground">{operator.local_name}</p>
          )}
        </div>

        <div className="lg:col-span-6">
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {cleanText(operator.description)}
          </p>
          {(operator.phone || amenities.length > 0) && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {operator.phone && (
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Phone size={12} aria-hidden="true" />
                  {operator.phone}
                </span>
              )}
              {amenities.length > 0 && (
                <span className="truncate">{amenities.slice(0, 4).join(" · ")}</span>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 lg:text-right">
          <Link
            href={`/travel/operator/${operator.slug}`}
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
          >
            Routes
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          {operator.verification_status === "VERIFIED" && (
            <p className="mt-1.5 text-xs text-success">Record verified</p>
          )}
        </div>
      </div>
    </article>
  );
}
