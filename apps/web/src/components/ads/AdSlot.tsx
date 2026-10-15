"use client";

import React, { useEffect } from "react";

export type AdSlotType =
  | "HOME_TOP"
  | "HOME_MID"
  | "ARTICLE_TOP"
  | "ARTICLE_MID"
  | "ARTICLE_BOTTOM"
  | "SIDEBAR"
  | "DISCOVERY_MID"
  | "TOOL_BOTTOM";

interface AdSlotProps {
  slot: AdSlotType;
  className?: string;
}

/**
 * Section 37: AdSlot abstraction layer.
 * Monetization slots for Google AdSense with zero layout shift and graceful fallbacks.
 */
export function AdSlot({ slot, className = "" }: AdSlotProps) {
  const isEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED !== "false";
  const publisherId =
    process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-1311307969887065";

  useEffect(() => {
    if (!isEnabled) return;
    try {
      if (typeof window !== "undefined") {
        ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
          (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []).push({});
      }
    } catch {
      // Ignore adsbygoogle push errors (e.g. ad blockers or duplicate requests)
    }
  }, [isEnabled]);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      className={`mx-auto my-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-surface-muted/30 p-3 text-center text-xs text-muted-foreground ${className}`}
      data-ad-slot={slot}
    >
      <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
        Advertisement
      </span>
      <div className="mt-2 min-h-[90px] w-full flex items-center justify-center overflow-hidden">
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", textAlign: "center" }}
          data-ad-client={publisherId}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
