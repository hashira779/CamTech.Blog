"use client";

import React from "react";

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
 * Keeps real AdSense dormant initially while reserving clean, zero-layout-shift responsive slots.
 * No deceptive buttons, no forced clicks, content is prioritized.
 */
export function AdSlot({ slot, className = "" }: AdSlotProps) {
  const isEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true";
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  if (!isEnabled) {
    // Dormant placeholder mode (safe, compliant, zero visual clutter)
    return null;
  }

  return (
    <div
      className={`mx-auto my-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted/50 p-4 text-center text-xs text-muted-foreground ${className}`}
      data-ad-slot={slot}
    >
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Advertisement
      </span>
      <div className="mt-2 min-h-[90px] w-full flex items-center justify-center">
        {/* Real AdSense snippet activates here when enabled in .env */}
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={publisherId}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
