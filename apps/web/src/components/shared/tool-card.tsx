"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calculator,
  Code2,
  FileText,
  Image as ImageIcon,
  QrCode,
  Video,
  Wrench,
  Zap,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ALL_TOOLS } from "@/lib/tools-data";

export interface ToolCardProps {
  slug: string;
  name: string;
  category: string;
  description: string;
  iconName?: string;
  usageCount?: number;
  popular?: boolean;
}

export function ToolCard({
  slug,
  name,
  category,
  description,
  popular,
}: ToolCardProps) {
  const { lang } = useI18n();
  const isKm = lang === "km";

  const toolDef = useMemo(() => ALL_TOOLS.find((t) => t.slug === slug), [slug]);
  const displayName = isKm && toolDef?.name_km ? toolDef.name_km : name;
  const displayDesc = isKm && toolDef?.description_km ? toolDef.description_km : description;

  const isVideo = slug.includes("video") || slug.includes("downloader");
  const isQr = slug.includes("qr") || slug.includes("khqr");
  const isCalc = category.toLowerCase().includes("calculat") || slug.includes("tax") || slug.includes("salary");
  const isDev = category.toLowerCase().includes("develop") || slug.includes("isp");
  const isText = category.toLowerCase().includes("text");

  const Icon = isQr
    ? QrCode
    : isVideo
    ? Video
    : isCalc
    ? Calculator
    : isDev
    ? Code2
    : isText
    ? FileText
    : category.toLowerCase().includes("image")
    ? ImageIcon
    : Wrench;

  const label = isVideo
    ? (isKm ? "មេឌៀ" : "Media")
    : isQr
    ? (isKm ? "QR & ឧបករណ៍" : "QR & Utility")
    : category.toLowerCase() === "image"
    ? (isKm ? "រូបភាព" : "Image")
    : category.toLowerCase();

  return (
    <Link
      href={`/tools/${slug}`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-elevated hover:shadow-xs"
    >
      <div>
        {/* Top Header: Clean Standard Monochrome Icon Pod + Neutral Badge */}
        <div className="flex items-center justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-surface-muted/80 text-foreground transition-colors group-hover:border-accent/40 group-hover:text-accent">
            <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
          </span>

          <div className="flex items-center gap-1.5">
            {popular && (
              <span className="rounded-full border border-border/70 bg-surface-muted px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                {isKm ? "ពេញនិយម" : "Popular"}
              </span>
            )}
            <span className="rounded-full border border-border/60 bg-surface-muted px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3.5 text-sm font-bold leading-snug tracking-tight text-foreground transition-colors duration-150 group-hover:text-accent sm:text-base">
          {displayName}
        </h3>

        {/* Description */}
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {displayDesc}
        </p>
      </div>

      {/* Card Footer: Standard Restrained Action Link */}
      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-accent">
        <span className="inline-flex items-center gap-1 text-[11px]">
          <Zap size={12} className="opacity-60 group-hover:opacity-100" />
          <span>{isKm ? "បើកឧបករណ៍" : "Open utility"}</span>
        </span>
        <ArrowUpRight
          size={15}
          aria-hidden="true"
          className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}
