import React from "react";
import Link from "next/link";
import { ArrowRight, Clock, ExternalLink, MapPin } from "lucide-react";
import type { TransportRoute } from "@/types";
import { CategoryMark } from "@/components/ui/category-mark";
import { formatDate } from "@/lib/format";

interface TransportRouteCardProps {
  route: TransportRoute;
}

/** "6h 30m" / "45m" / "" when the record carries no duration. */
function duration(minutes?: number): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

/**
 * One route, one row.
 *
 * This used to be a shadowed card with an emoji tile, a star rating and a price
 * printed on every record. The rating and review columns are seeded, not reader
 * feedback, so they are gone; the fare appears only when the route actually
 * carries one.
 */
export function TransportRouteCard({ route }: TransportRouteCardProps) {
  const operator = route.operator;
  const schedules = route.schedules || [];
  const travelDuration = duration(route.duration_minutes);
  const fare = route.base_price_usd > 0 ? route.base_price_usd : null;
  const bookingUrl = schedules[0]?.booking_url || operator?.website;
  const checked = formatDate(route.last_verified_at, "medium");
  const typeLabel = route.transport_type?.toLowerCase().replace(/_/g, " ");

  return (
    <article className="border-t border-border py-6 first:border-t-0 first:pt-0">
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-5">
          {typeLabel && (
            <CategoryMark category="transport" tone="dot">
              {typeLabel}
            </CategoryMark>
          )}

          {operator?.slug ? (
            <h3 className="mt-2 font-display text-xl leading-snug tracking-tight">
              <Link href={`/travel/operator/${operator.slug}`} className="transition-colors hover:text-accent">
                {operator.name}
              </Link>
            </h3>
          ) : (
            <h3 className="mt-2 font-display text-xl leading-snug tracking-tight text-foreground">
              {route.name}
            </h3>
          )}

          {operator?.slug && route.name && route.name !== operator.name && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{route.name}</p>
          )}

          {route.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {route.description}
            </p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm lg:col-span-4">
          <div>
            <dt className="section-label">Journey</dt>
            <dd className="mt-1 tabular-nums text-foreground">
              {travelDuration || <span className="text-muted-foreground">Not published</span>}
            </dd>
          </div>
          <div>
            <dt className="section-label">Distance</dt>
            <dd className="mt-1 tabular-nums text-foreground">
              {route.distance_km > 0 ? `${route.distance_km} km` : <span className="text-muted-foreground">—</span>}
            </dd>
          </div>
          {route.origin_hub && (
            <div className="col-span-2">
              <dt className="section-label">Boarding</dt>
              <dd className="mt-1 flex items-start gap-1.5 text-foreground">
                <MapPin size={14} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0">{route.origin_hub.name}</span>
              </dd>
            </div>
          )}
          {route.destination_hub && (
            <div className="col-span-2">
              <dt className="section-label">Arrival</dt>
              <dd className="mt-1 flex items-start gap-1.5 text-foreground">
                <MapPin size={14} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0">{route.destination_hub.name}</span>
              </dd>
            </div>
          )}
        </dl>

        <div className="lg:col-span-3 lg:text-right">
          <p className="section-label">Fare</p>
          {fare ? (
            <p className="mt-1 font-display text-2xl leading-none tracking-tight text-foreground tabular-nums">
              ${fare.toFixed(2)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Ask the operator</p>
          )}
          {checked && <p className="mt-1.5 text-xs text-muted-foreground">Timetable checked {checked}</p>}
        </div>
      </div>

      {schedules.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-border pt-4">
          <span className="section-label mr-2">
            Departures
            {schedules.length > 4 ? ` (${schedules.length})` : ""}
          </span>
          {schedules.slice(0, 4).map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground"
            >
              <Clock size={12} className="text-muted-foreground" aria-hidden="true" />
              <span className="tabular-nums font-medium">{s.departure_time}</span>
              {s.vehicle_class && <span className="text-muted-foreground">{s.vehicle_class}</span>}
              {s.price_usd > 0 && <span className="text-muted-foreground tabular-nums">${s.price_usd}</span>}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {operator?.slug && (
          <Link
            href={`/travel/operator/${operator.slug}`}
            className="group inline-flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            All routes &amp; schedules
            <ArrowRight
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        )}
        {bookingUrl ? (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 font-medium text-accent transition-colors hover:text-foreground"
          >
            Book with the operator
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        ) : (
          operator?.phone && (
            <span className="text-muted-foreground">
              Book by phone · <span className="tabular-nums text-foreground">{operator.phone}</span>
            </span>
          )
        )}
      </div>
    </article>
  );
}
