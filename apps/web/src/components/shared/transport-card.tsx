import * as React from "react";
import Link from "next/link";
import { ArrowRight, Bus, Car, Ship, Train } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CategoryMark } from "@/components/ui/category-mark";
import { cleanText } from "@/lib/format";

export interface TransportCardProps {
  id: string;
  operatorName: string;
  operatorSlug?: string;
  transportType: string;
  origin: string;
  destination: string;
  departureTime?: string;
  arrivalTime?: string;
  durationMinutes?: number;
  priceUsd?: number;
  vehicleClass?: string;
  verifiedStatus?: boolean;
}

function formatDuration(mins?: number): string {
  if (!mins || mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Transport option row.
 *
 * `vehicleClass` used to default to "Express" and `verifiedStatus` to `true`, so
 * every card claimed an express service and a Verified badge whether or not the
 * record said so. Missing times no longer print "--:--", and the word "Direct"
 * is gone because nothing in the data confirms it.
 */
export function TransportCard({
  operatorName,
  operatorSlug,
  transportType,
  origin,
  destination,
  departureTime,
  arrivalTime,
  durationMinutes,
  priceUsd,
  vehicleClass,
  verifiedStatus,
}: TransportCardProps) {
  const Icon =
    transportType === "TRAIN" ? Train : transportType === "FERRY" ? Ship : transportType === "TAXI" || transportType === "MINIVAN" ? Car : Bus;

  const typeLabel = transportType?.toLowerCase().replace(/_/g, " ");
  const duration = formatDuration(durationMinutes);

  const operatorLink = operatorSlug ? (
    <Link
      href={`/travel/operator/${operatorSlug}`}
      className="font-medium text-foreground transition-colors hover:text-accent"
    >
      {cleanText(operatorName)}
    </Link>
  ) : (
    <span className="font-medium text-foreground">{cleanText(operatorName)}</span>
  );

  return (
    <Card className="gap-3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface-muted text-muted-foreground">
            <Icon size={16} aria-hidden="true" />
          </span>
          <div className="leading-tight">
            {operatorLink}
            {vehicleClass && <p className="text-xs text-muted-foreground">{cleanText(vehicleClass)}</p>}
          </div>
        </div>
        {typeLabel && <CategoryMark category="transport" tone="dot">{typeLabel}</CategoryMark>}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-sm">
        <span className="tabular-nums text-foreground">
          {departureTime || <span className="text-muted-foreground">Time not published</span>}
        </span>
        <span className="text-muted-foreground">{cleanText(origin)}</span>
        <ArrowRight size={14} className="text-border-strong" aria-hidden="true" />
        <span className="tabular-nums text-foreground">
          {arrivalTime || <span className="text-muted-foreground">—</span>}
        </span>
        <span className="text-muted-foreground">{cleanText(destination)}</span>
        {duration && (
          <span className="ml-auto tabular-nums text-xs text-muted-foreground">about {duration}</span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
        {priceUsd && priceUsd > 0 ? (
          <p className="text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">${priceUsd}</span> / passenger
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Fare not on record</p>
        )}
        {verifiedStatus ? (
          <p className="text-xs text-success">Record verified</p>
        ) : (
          operatorSlug && (
            <Link
              href={`/travel/operator/${operatorSlug}`}
              className="text-xs font-medium text-accent transition-colors hover:text-foreground"
            >
              Operator details
            </Link>
          )
        )}
      </div>
    </Card>
  );
}
