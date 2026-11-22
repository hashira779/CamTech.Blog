import React from "react";
import Link from "next/link";
import { ArrowRight, Bus, Car, Clock, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import type { TransportRoute } from "@/types";
import { formatDate } from "@/lib/format";

interface TransportRouteCardProps {
  route: TransportRoute;
}

/** Format duration into "6h" or "5h 30m" */
function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export function TransportRouteCard({ route }: TransportRouteCardProps) {
  const operator = route.operator;
  const schedules = route.schedules || [];
  const travelDuration = formatDuration(route.duration_minutes);
  const fare = route.base_price_usd > 0 ? route.base_price_usd : null;
  const bookingUrl = schedules[0]?.booking_url || operator?.website;
  const checked = formatDate(route.last_verified_at, "medium");
  const typeStr = (route.transport_type || "").toLowerCase();
  const isMinivan = typeStr.includes("minivan") || typeStr.includes("van");
  const typeLabel = isMinivan ? "VIP Minivan" : "Highway Coach";

  return (
    <article className="group flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-xs sm:p-6">
      {/* ── Top Header: Type & Fare ── */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {isMinivan ? <Car size={12} className="text-foreground" /> : <Bus size={12} className="text-foreground" />}
            <span>{typeLabel}</span>
          </span>

          {fare ? (
            <div className="text-right">
              <span className="font-mono text-xs font-medium text-muted-foreground">Fare from </span>
              <span className="font-mono text-lg font-bold text-foreground tabular-nums">
                ${fare.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Contact operator</span>
          )}
        </div>

        {/* ── Operator & Route Headline ── */}
        <div>
          {operator?.slug ? (
            <h3 className="font-serif text-lg font-bold tracking-tight text-foreground sm:text-xl">
              <Link
                href={`/travel/operator/${operator.slug}`}
                className="transition-colors hover:text-accent"
              >
                {operator.name}
              </Link>
            </h3>
          ) : (
            <h3 className="font-serif text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {route.name}
            </h3>
          )}

          {operator?.name && route.name && route.name !== operator.name && (
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">{route.name}</p>
          )}

          {route.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {route.description}
            </p>
          )}
        </div>

        {/* ── Route Journey Bar (Duration & Distance) ── */}
        <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-surface-muted/40 px-3.5 py-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Clock size={13} className="text-muted-foreground" />
            <span className="tabular-nums">{travelDuration || "Direct"}</span>
          </div>
          {route.distance_km > 0 && (
            <>
              <span className="text-border">•</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {route.distance_km} km
              </span>
            </>
          )}
          {checked && (
            <>
              <span className="text-border">•</span>
              <span className="truncate text-[11px] text-muted-foreground">
                Verified {checked}
              </span>
            </>
          )}
        </div>

        {/* ── Departure & Arrival Timeline ── */}
        {(route.origin_hub || route.destination_hub) && (
          <div className="space-y-2.5 rounded-xl border border-border/80 bg-background/50 p-3.5 text-xs">
            {route.origin_hub && (
              <div className="flex items-start gap-2.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-foreground" />
                <div className="min-w-0">
                  <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Boarding Point
                  </span>
                  <span className="font-medium text-foreground leading-snug">
                    {route.origin_hub.name}
                  </span>
                </div>
              </div>
            )}

            {route.destination_hub && (
              <div className="flex items-start gap-2.5 border-t border-border/60 pt-2">
                <MapPin size={12} className="mt-1 shrink-0 text-accent" />
                <div className="min-w-0">
                  <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Arrival Terminal
                  </span>
                  <span className="font-medium text-foreground leading-snug">
                    {route.destination_hub.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Departure Times Chips ── */}
        {schedules.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Daily Departures ({schedules.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {schedules.slice(0, 4).map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground"
                >
                  <span className="font-bold">{s.departure_time}</span>
                  {s.vehicle_class && (
                    <span className="text-[10px] text-muted-foreground">{s.vehicle_class}</span>
                  )}
                  {s.price_usd > 0 && (
                    <span className="font-semibold text-muted-foreground">${s.price_usd}</span>
                  )}
                </span>
              ))}
              {schedules.length > 4 && (
                <span className="inline-flex items-center rounded-md border border-dashed border-border px-1.5 py-1 text-[10px] text-muted-foreground">
                  +{schedules.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Actions ── */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/80 pt-4 text-xs">
        {operator?.slug ? (
          <Link
            href={`/travel/operator/${operator.slug}`}
            className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>All operator schedules</span>
            <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <span />
        )}

        {bookingUrl ? (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-foreground px-3 py-1.5 font-semibold text-background transition-opacity hover:opacity-90"
          >
            <span>Book with operator</span>
            <ExternalLink size={12} />
          </a>
        ) : operator?.phone ? (
          <span className="font-mono text-muted-foreground">
            Call: <span className="font-bold text-foreground">{operator.phone}</span>
          </span>
        ) : null}
      </div>
    </article>
  );
}
