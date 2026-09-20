import React from "react";
import Link from "next/link";
import { TransportRoute } from "@/types";
import { Bus, Clock, MapPin, ShieldCheck, Star, ExternalLink, ArrowRight } from "lucide-react";

interface TransportRouteCardProps {
  route: TransportRoute;
}

export function TransportRouteCard({ route }: TransportRouteCardProps) {
  const operator = route.operator;
  const schedules = route.schedules || [];

  return (
    <div className="bg-card text-card-foreground rounded-xl border p-5 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
      <div>
        {/* Header with Operator & Badges */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
              {route.transport_type === "MINIVAN" ? "🚐" : route.transport_type === "TRAIN" ? "🚆" : route.transport_type === "FERRY" ? "⛴️" : "🚌"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/travel/operator/${operator?.slug || "#"}`}
                  className="font-bold text-base hover:text-primary transition-colors"
                >
                  {operator?.name || "Verified Operator"}
                </Link>
                {route.verification_status === "VERIFIED" && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                  <Star className="w-3 h-3 fill-amber-500" /> {operator?.rating?.toFixed(1) || "4.8"}
                </span>
                <span>•</span>
                <span>{operator?.review_count || 0} reviews</span>
                <span>•</span>
                <span className="uppercase font-semibold tracking-wider text-[10px] bg-muted px-1.5 py-0.5 rounded">
                  {route.transport_type}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-muted-foreground block">From</span>
            <span className="text-xl font-extrabold text-primary">${route.base_price_usd.toFixed(2)}</span>
          </div>
        </div>

        {/* Route Details */}
        <p className="text-sm font-semibold mb-2">{route.name}</p>
        {route.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {route.description}
          </p>
        )}

        {/* Route Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-lg mb-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>
              Duration: <strong className="text-foreground">{Math.floor(route.duration_minutes / 60)}h {route.duration_minutes % 60 ? `${route.duration_minutes % 60}m` : ""}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>
              Distance: <strong className="text-foreground">{route.distance_km} km</strong>
            </span>
          </div>
        </div>

        {/* Hub / Station info */}
        {(route.origin_hub || route.destination_hub) && (
          <div className="text-xs text-muted-foreground space-y-1 mb-3">
            {route.origin_hub && (
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Boarding: <strong>{route.origin_hub.name}</strong></span>
              </div>
            )}
            {route.destination_hub && (
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">Arrival: <strong>{route.destination_hub.name}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Departure Timetable Preview */}
        {schedules.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
              Daily Departures & Classes
            </div>
            <div className="flex flex-wrap gap-1.5">
              {schedules.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="inline-flex items-center gap-1 bg-muted/70 px-2 py-1 rounded text-xs border"
                  title={`${s.vehicle_class} - $${s.price_usd}`}
                >
                  <span className="font-semibold text-foreground">{s.departure_time}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">(${s.price_usd})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t flex items-center justify-between gap-3 mt-auto">
        <Link
          href={`/travel/operator/${operator?.slug || "#"}`}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          View Fleet & Schedules <ArrowRight className="w-3 h-3" />
        </Link>
        {schedules[0]?.booking_url || operator?.website ? (
          <a
            href={schedules[0]?.booking_url || operator?.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            Book via Official <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">Contact Operator</span>
        )}
      </div>
    </div>
  );
}
