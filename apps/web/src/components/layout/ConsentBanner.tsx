"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Cookie consent.
 *
 * Same two choices and the same stored key, restated on the token palette. The
 * copy no longer claims compliance with an ad network's policy — it says what
 * the site actually does: functional cookies plus optional analytics.
 */
export function ConsentBanner() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("daily_discovery_consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (choice: "ALL" | "ESSENTIAL") => {
    localStorage.setItem(
      "daily_discovery_consent",
      JSON.stringify({ choice, timestamp: new Date().toISOString() })
    );
    setIsVisible(false);
  };

  // Hide on public wedding invitation cards
  if (pathname && pathname.startsWith("/wedding/") && pathname !== "/wedding") {
    return null;
  }

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-50 md:inset-x-auto md:right-6 md:w-[26rem]"
    >
      <div className="rounded-lg border border-border bg-surface-elevated p-5 shadow-lg animate-fade-in">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Cookie size={16} aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-semibold text-foreground">
              Cookie preferences
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              We use essential cookies to make the site work, and optional
              analytics cookies to understand which stories readers actually
              finish.
            </p>
            <div className="mt-2.5 flex gap-4 text-sm">
              <Link
                href="/cookie-policy"
                className="text-accent underline-offset-4 hover:underline"
              >
                Cookies
              </Link>
              <Link href="/privacy" className="text-accent underline-offset-4 hover:underline">
                Privacy
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleConsent("ESSENTIAL")}
            aria-label="Dismiss and continue with essential cookies only"
            className="-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleConsent("ESSENTIAL")}>
            Essential only
          </Button>
          <Button size="sm" variant="primary" onClick={() => handleConsent("ALL")}>
            Accept all
          </Button>
        </div>
      </div>
    </aside>
  );
}
