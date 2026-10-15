"use client";

import { useEffect, useRef, useState } from "react";
import {
  getAdChannel,
  getAdsenseClient,
  getAdSlotId,
  getReservedHeight,
  isAdsEnabled,
  type AdPlacement,
} from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  slot: AdPlacement;
  className?: string;
}

/**
 * One AdSense unit.
 *
 * Three things separate this from a copy-pasted snippet, and all three are why ad slots usually
 * lose money instead of making it:
 *
 * 1. It only mounts when the placement has a real numeric ad unit ID (`getAdSlotId`). An invalid
 *    ID is not a smaller ad, it is no ad plus an empty frame where an article used to be.
 * 2. It asks for the ad when the slot is about to scroll into view, not when the page loads. A
 *    request fired during first paint competes with the hero image for bandwidth and hurts the
 *    Largest Contentful Paint score that Google says feeds into earnings.
 * 3. It collapses itself when Google reports the unit `unfilled` — the documented `data-ad-status`
 *    attribute — so a visitor with an ad blocker, or a request with no buyer, gets continuous text
 *    instead of a bordered hole in the page.
 */
export function AdSlot({ slot, className = "" }: AdSlotProps) {
  const enabled = isAdsEnabled();
  const client = getAdsenseClient();
  const adUnitId = getAdSlotId(slot);
  const channel = getAdChannel();
  const reservedHeight = getReservedHeight(slot);

  const insRef = useRef<HTMLModElement | null>(null);
  const hasRequested = useRef(false);
  const [status, setStatus] = useState<"pending" | "filled" | "unfilled">("pending");

  const isActive = enabled && Boolean(client) && Boolean(adUnitId);

  useEffect(() => {
    const element = insRef.current;
    if (!isActive || !element) return;

    // Google writes data-ad-status="filled" or "unfilled" onto the <ins> once the auction ends.
    const observer = new MutationObserver(() => {
      const adStatus = element.getAttribute("data-ad-status");
      if (adStatus === "unfilled") setStatus("unfilled");
      else if (adStatus === "filled") setStatus("filled");
    });
    observer.observe(element, {
      attributes: true,
      attributeFilter: ["data-ad-status", "data-adsbygoogle-status"],
    });

    // Request on approach, once. StrictMode re-runs effects, so the ref is what prevents a
    // duplicate push — a second push for the same node is what produces AdSense's "all ads
    // requests from this slot have been disapproved" console noise.
    const viewport = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || hasRequested.current) return;
        hasRequested.current = true;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          // A blocked or already-served unit throws here; the frame collapses on its own.
        }
        viewport.disconnect();
      },
      { rootMargin: "200px 0px" },
    );
    viewport.observe(element);

    return () => {
      observer.disconnect();
      viewport.disconnect();
    };
  }, [isActive]);

  // Nothing configured, or nothing to show: render no markup at all, so the page reflows as if
  // advertising were never part of it.
  if (!isActive || status === "unfilled") return null;

  return (
    <aside
      aria-label="Advertisement"
      className={`mx-auto flex w-full flex-col items-center ${className}`}
      style={{ minHeight: status === "pending" ? `${reservedHeight}px` : undefined }}
      data-ad-placement={slot}
    >
      <span className="mb-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
        Advertisement
      </span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", textAlign: "center" }}
        data-ad-client={client ?? undefined}
        data-ad-slot={adUnitId ?? undefined}
        data-ad-format="auto"
        data-ad-channel={channel ?? undefined}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
