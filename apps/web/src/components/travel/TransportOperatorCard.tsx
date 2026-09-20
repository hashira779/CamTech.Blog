import React from "react";
import Link from "next/link";
import { TransportOperator } from "@/types";
import { Star, ShieldCheck, Phone, Globe, ArrowRight } from "lucide-react";

interface TransportOperatorCardProps {
  operator: TransportOperator;
}

export function TransportOperatorCard({ operator }: TransportOperatorCardProps) {
  let amenities: string[] = [];
  try {
    amenities = JSON.parse(operator.amenities_json || "[]");
  } catch {
    amenities = [];
  }

  return (
    <div className="bg-card text-card-foreground rounded-xl border p-5 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/travel/operator/${operator.slug}`}
                className="font-bold text-lg hover:text-primary transition-colors"
              >
                {operator.name}
              </Link>
              {operator.local_name && (
                <span className="text-xs text-muted-foreground font-khmer">({operator.local_name})</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-500" /> {operator.rating.toFixed(1)}
              </span>
              <span>•</span>
              <span>{operator.review_count} traveler reviews</span>
              <span>•</span>
              <span className="uppercase font-semibold tracking-wider text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded">
                {operator.operator_type}
              </span>
            </div>
          </div>

          {operator.verification_status === "VERIFIED" && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
          {operator.description}
        </p>

        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {amenities.slice(0, 5).map((a, idx) => (
              <span
                key={idx}
                className="text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md border"
              >
                ✓ {a}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          {operator.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="w-3 h-3 text-primary" /> {operator.phone}
            </span>
          )}
        </div>

        <Link
          href={`/travel/operator/${operator.slug}`}
          className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          View Routes & Timetables <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
