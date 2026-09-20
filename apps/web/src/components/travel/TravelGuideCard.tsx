import React from "react";
import Link from "next/link";
import { TravelGuide } from "@/types";
import { BookOpen, Clock, ArrowRight } from "lucide-react";

interface TravelGuideCardProps {
  guide: TravelGuide;
}

export function TravelGuideCard({ guide }: TravelGuideCardProps) {
  return (
    <div className="bg-card text-card-foreground rounded-xl border overflow-hidden shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between">
      {guide.hero_image_url && (
        <div className="h-44 w-full relative overflow-hidden bg-muted">
          <img
            src={guide.hero_image_url}
            alt={guide.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute top-3 left-3 text-[11px] font-semibold bg-background/90 backdrop-blur-md px-2.5 py-1 rounded-full border shadow-sm inline-flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-primary" /> Curated Field Guide
          </span>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> {guide.read_time_minutes} read
            </span>
            <span>•</span>
            <span>Authoritative Advice</span>
          </div>

          <h3 className="font-bold text-base leading-snug mb-2 hover:text-primary transition-colors">
            <Link href={`/travel/guides/${guide.slug}`}>{guide.title}</Link>
          </h3>

          {guide.title_km && (
            <p className="text-xs text-muted-foreground font-khmer mb-2">{guide.title_km}</p>
          )}

          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
            {guide.summary}
          </p>
        </div>

        <div className="pt-3 border-t">
          <Link
            href={`/travel/guides/${guide.slug}`}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            Read Complete Guide <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
