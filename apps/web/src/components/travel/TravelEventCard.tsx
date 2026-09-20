import React from "react";
import { TravelEvent } from "@/types";
import { Calendar, MapPin, Sparkles } from "lucide-react";

interface TravelEventCardProps {
  event: TravelEvent;
}

export function TravelEventCard({ event }: TravelEventCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border p-5 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            <Sparkles className="w-3 h-3" /> {event.event_type}
          </span>
          <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
            <Calendar className="w-3 h-3" /> {event.start_date}
          </span>
        </div>

        <h4 className="font-bold text-base mt-1 mb-1">{event.name}</h4>
        {event.name_km && (
          <p className="text-xs text-muted-foreground font-khmer mb-2">{event.name_km}</p>
        )}

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">
          {event.description}
        </p>
      </div>

      {event.venue && (
        <div className="pt-3 border-t text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3 text-primary shrink-0" />
          <span className="truncate">{event.venue}</span>
        </div>
      )}
    </div>
  );
}
