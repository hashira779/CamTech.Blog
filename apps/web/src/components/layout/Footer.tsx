"use client";

import React from "react";
import Link from "next/link";
import { Compass, ShieldCheck, Rss, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="w-full border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/80 text-neutral-600 dark:text-neutral-400 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white shadow">
                <Compass className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-lg text-neutral-900 dark:text-white tracking-tight">
                DAILY<span className="text-rose-600">.</span>DISCOVERY
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              {t("footer.tagline")}
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified attribution & editorial standards</span>
            </div>
          </div>

          {/* Navigation & Coverage */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3">
              Editorial Coverage
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/cambodia" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Cambodia & Regional News
                </Link>
              </li>
              <li>
                <Link href="/world" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  World & International Affairs
                </Link>
              </li>
              <li>
                <Link href="/discover" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Visual Discoveries & Science
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Daily Quiz & Knowledge Challenge
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Functional Everyday Tools
                </Link>
              </li>
              <li>
                <Link href="/trending" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Trending Metrics Engine
                </Link>
              </li>
            </ul>
          </div>

          {/* Editorial Transparency (Sections 60 & 62) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3">
              Transparency & Ethics
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/about" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  About the Platform
                </Link>
              </li>
              <li>
                <Link href="/editorial-policy" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Editorial Policy & AI Rules
                </Link>
              </li>
              <li>
                <Link href="/corrections-policy" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Corrections & Retractions
                </Link>
              </li>
              <li>
                <Link href="/content-standards" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Content Quality Standards
                </Link>
              </li>
              <li>
                <Link href="/advertising" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Advertising & Monetization Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Contact Newsroom & Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Feeds */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3">
              Legal & Syndication
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Privacy Policy & Data Rights
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Cookie & Consent Policy
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="inline-flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  Sitemap XML <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link href="/feed.xml" className="inline-flex items-center gap-1 hover:text-rose-600 dark:hover:text-rose-400 transition-colors">
                  <Rss className="h-3 w-3 text-amber-500" /> RSS 2.0 Feeds
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} {t("footer.copyright")}</p>
          <p className="text-[11px] text-neutral-400">
            Engineered for long-term daily curiosity (2026–2029).
          </p>
        </div>
      </div>
    </footer>
  );
}
