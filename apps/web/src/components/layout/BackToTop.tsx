"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Back to top.
 *
 * A briefing page is long, and every other news site learned this years ago: once the reader is
 * past the fold, the way back to the sections should be one tap, not a scroll. It appears after
 * ~700px, sits clear of the consent banner, and is a real button so it is reachable by keyboard
 * and announced like one.
 *
 * The scroll honours `prefers-reduced-motion`: instant jump for readers who asked for no smooth
 * scrolling, gliding for everyone else.
 */
export function BackToTop({ className }: { className?: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      setVisible((window.scrollY || document.documentElement.scrollTop || 0) > 700);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  // Hide on public wedding invitation cards
  if (pathname && pathname.startsWith("/wedding/") && pathname !== "/wedding") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toTop}
      tabIndex={visible ? 0 : -1}
      aria-label="Back to top"
      aria-hidden={!visible || undefined}
      className={cn(
        "pressable fixed bottom-24 right-4 z-40 grid h-10 w-10 place-items-center rounded-full border border-border bg-surface-elevated text-muted-foreground shadow-md transition-all duration-300 hover:border-border-strong hover:text-accent sm:bottom-8",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
        className
      )}
    >
      <ArrowUp size={17} aria-hidden="true" />
    </button>
  );
}
