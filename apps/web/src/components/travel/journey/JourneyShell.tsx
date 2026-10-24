"use client";

import * as React from "react";
import { MotionConfig } from "framer-motion";
import { useScrollRefresh } from "./hooks";

/**
 * Wraps the travel journey. `reducedMotion="user"` makes every framer animation on the page
 * honour `prefers-reduced-motion` (transforms are skipped, opacity still settles), and the
 * scroll refresh re-measures scroll-linked scenes once images and fonts have landed.
 */
export function JourneyShell({ children }: { children: React.ReactNode }) {
  useScrollRefresh();
  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-journey flex w-full flex-1 flex-col">{children}</div>
    </MotionConfig>
  );
}
