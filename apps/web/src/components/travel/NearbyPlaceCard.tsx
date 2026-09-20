import React from "react";
import Link from "next/link";
import { NearbyPlace } from "@/types";
import { MapPin, Navigation, Car, Footprints } from "lucide-react";

interface NearbyPlaceCardProps {
  item: NearbyPlace;
}

export function NearbyPlaceCard({ item }: NearbyPlaceCardProps) {
  const { place, distance_km, estimated_walk_minutes, estimated_drive_minutes } = item;

  return (
    <div className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
              {place.place_type}
            </span>
            <h4 className="font-bold text-base mt-1.5 hover:text-primary transition-colors">
              <Link href={`/travel/place/${place.slug}`}>{place.name}</Link>
            </h4>
            {place.local_name && (
              <p className="text-xs text-muted-foreground font-khmer">{place.local_name}</p>
            )}
          </div>

          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1 font-mono font-bold text-sm text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/20">
              <Navigation className="w-3 h-3 rotate-45 text-primary" /> {distance_km} km
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
          {place.description}
        </p>

        {/* ETA Badges */}
        <div className="flex items-center gap-3 text-xs bg-muted/50 px-3 py-2 rounded-lg mb-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Car className="w-3.5 h-3.5 text-primary" />
            <span>
              Drive/Tuk-Tuk: <strong className="text-foreground">{estimated_drive_minutes} min</strong>
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Footprints className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              Walk: <strong className="text-foreground">{estimated_walk_minutes} min</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1 truncate max-w-[180px]">
          <MapPin className="w-3 h-3 text-primary shrink-0" />
          <span className="truncate">{place.address || "Siem Reap"}</span>
        </span>
        <Link
          href={`/travel/place/${place.slug}`}
          className="font-semibold text-primary hover:underline"
        >
          Explore Details →
        </Link>
      </div>
    </div>
  );
}
