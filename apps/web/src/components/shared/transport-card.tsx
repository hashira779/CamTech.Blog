import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock, ShieldCheck, Bus, Train, Ship, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DESIGN_TOKENS } from "@/lib/tokens";

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

export function TransportCard({
  operatorName,
  operatorSlug,
  transportType = "BUS",
  origin,
  destination,
  departureTime,
  arrivalTime,
  durationMinutes,
  priceUsd,
  vehicleClass = "Express",
  verifiedStatus = true,
}: TransportCardProps) {
  const getIcon = () => {
    switch (transportType.toUpperCase()) {
      case "TRAIN":
        return <Train size={DESIGN_TOKENS.iconSize.sm} />;
      case "FERRY":
        return <Ship size={DESIGN_TOKENS.iconSize.sm} />;
      case "TAXI":
      case "MINIVAN":
        return <Car size={DESIGN_TOKENS.iconSize.sm} />;
      default:
        return <Bus size={DESIGN_TOKENS.iconSize.sm} />;
    }
  };

  const formatDuration = (mins?: number) => {
    if (!mins) return "";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <Card hoverEffect className="p-4 sm:p-5 flex flex-col justify-between">
      {/* Top Header: Operator & Vehicle Class */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
            {getIcon()}
          </div>
          <div>
            {operatorSlug ? (
              <Link
                href={`/travel/operator/${operatorSlug}`}
                className="text-xs font-bold text-slate-900 hover:text-teal-700 dark:text-slate-100 dark:hover:text-teal-400 transition-colors"
              >
                {operatorName}
              </Link>
            ) : (
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{operatorName}</span>
            )}
            <span className="text-[11px] text-slate-400 block">{vehicleClass}</span>
          </div>
        </div>

        {verifiedStatus && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck size={12} />
            Verified
          </span>
        )}
      </div>

      {/* Middle: Departure -> Arrival & Duration */}
      <div className="grid grid-cols-3 items-center text-center my-1">
        <div className="text-left">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
            {departureTime || "--:--"}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
            {origin}
          </span>
        </div>

        <div className="flex flex-col items-center px-2">
          {durationMinutes && (
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mb-1">
              <Clock size={10} />
              {formatDuration(durationMinutes)}
            </span>
          )}
          <div className="w-full flex items-center">
            <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
            <ArrowRight size={12} className="text-slate-400 shrink-0 mx-1" />
            <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Direct</span>
        </div>

        <div className="text-right">
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
            {arrivalTime || "--:--"}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
            {destination}
          </span>
        </div>
      </div>

      {/* Footer: Price and CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div>
          {priceUsd ? (
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                ${priceUsd}
              </span>
              <span className="text-[11px] text-slate-400">/passenger</span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Timetable</span>
          )}
        </div>

        {operatorSlug ? (
          <Link
            href={`/travel/operator/${operatorSlug}`}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
          >
            Operator Details
          </Link>
        ) : (
          <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">Verified Schedule</span>
        )}
      </div>
    </Card>
  );
}
