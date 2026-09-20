"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Cookie, X } from "lucide-react";

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("daily_discovery_consent");
    if (!consent) {
      // Delay display slightly to avoid layout flicker
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (choice: "ALL" | "ESSENTIAL") => {
    localStorage.setItem("daily_discovery_consent", JSON.stringify({ choice, timestamp: new Date().toISOString() }));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-lg z-50 p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-xl text-emerald-700 dark:text-emerald-400 shrink-0">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="flex-1 text-xs text-slate-600 dark:text-slate-300">
          <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
            Privacy & Cookie Preferences
          </p>
          <p>
            We use functional and analytical cookies to ensure fast performance and evaluate editorial readership. We
            respect your privacy and comply with Google Publisher Policies.
          </p>
          <div className="mt-2 flex gap-3 text-[11px] font-semibold">
            <Link href="/cookie-policy" className="text-emerald-600 dark:text-emerald-400 hover:underline">
              Cookie Policy
            </Link>
            <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={() => handleConsent("ESSENTIAL")}
          className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Essential Only
        </button>
        <button
          onClick={() => handleConsent("ALL")}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
        >
          Accept All
        </button>
      </div>
    </aside>
  );
}
