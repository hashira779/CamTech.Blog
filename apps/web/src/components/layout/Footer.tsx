"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Rss, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { lang, t } = useI18n();

  return (
    <footer className="w-full border-t border-neutral-300 bg-[#FAF9F6] text-neutral-600 mt-20 font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        {/* Top Masthead & Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-neutral-200">
          <div>
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 uppercase">
                CamTech<span className="text-neutral-400">.</span>Blog
              </span>
            </Link>
            <p className="text-xs text-neutral-500 mt-1 max-w-lg leading-relaxed">
              Independent technology analysis, ASEAN economic developments, and curated scientific journalism. Published daily for regional and global readers.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1.5 text-neutral-800 font-semibold">
              <ShieldCheck size={14} className="text-emerald-600" /> Fact-Checked Standards
            </span>
            <span>•</span>
            <Link href="/feed.xml" className="flex items-center gap-1 hover:text-neutral-900 transition-colors">
              <Rss size={13} />
              <span>RSS Feed</span>
            </Link>
          </div>
        </div>

        {/* Navigation Grid (6 columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-xs">
          {/* Col 1: News & Analysis */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold uppercase tracking-wider text-neutral-900 text-[11px]">
              News & Coverage
            </h4>
            <ul className="space-y-2 text-neutral-600">
              <li><Link href="/cambodia" className="hover:text-neutral-950 transition-colors">Cambodia News</Link></li>
              <li><Link href="/world" className="hover:text-neutral-950 transition-colors">World Reports</Link></li>
              <li><Link href="/trending" className="hover:text-neutral-950 transition-colors">Trending Stories</Link></li>
              <li><Link href="/discover" className="hover:text-neutral-950 transition-colors">Scientific Discoveries</Link></li>
            </ul>
          </div>

          {/* Col 2: Features & Leisure */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold uppercase tracking-wider text-neutral-900 text-[11px]">
              Travel & Tools
            </h4>
            <ul className="space-y-2 text-neutral-600">
              <li><Link href="/travel" className="hover:text-neutral-950 transition-colors">Cambodia Travel Guides</Link></li>
              <li><Link href="/travel/planner" className="hover:text-neutral-950 transition-colors">Trip Itinerary Planner</Link></li>
              <li><Link href="/quiz" className="hover:text-neutral-950 transition-colors">Daily Knowledge Quiz</Link></li>
              <li><Link href="/tools" className="hover:text-neutral-950 transition-colors">Everyday Web Tools</Link></li>
            </ul>
          </div>

          {/* Col 3: Editorial Standards */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold uppercase tracking-wider text-neutral-900 text-[11px]">
              Editorial Policy
            </h4>
            <ul className="space-y-2 text-neutral-600">
              <li><Link href="/editorial-policy" className="hover:text-neutral-950 transition-colors">Editorial Guidelines</Link></li>
              <li><Link href="/content-standards" className="hover:text-neutral-950 transition-colors">Content Quality Gate</Link></li>
              <li><Link href="/corrections-policy" className="hover:text-neutral-950 transition-colors">Corrections & Errata</Link></li>
              <li><Link href="/sources" className="hover:text-neutral-950 transition-colors">Primary Sources Index</Link></li>
            </ul>
          </div>

          {/* Col 4: Corporate & Transparency */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold uppercase tracking-wider text-neutral-900 text-[11px]">
              Transparency
            </h4>
            <ul className="space-y-2 text-neutral-600">
              <li><Link href="/about" className="hover:text-neutral-950 transition-colors">About the Newsroom</Link></li>
              <li><Link href="/advertising" className="hover:text-neutral-950 transition-colors">AdSense & Advertising</Link></li>
              <li><Link href="/contact" className="hover:text-neutral-950 transition-colors">Contact Editorial Desk</Link></li>
              <li>
                <a href="https://cms.camtech.cam" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-950 transition-colors flex items-center gap-1">
                  <span>Editorial CMS</span>
                  <ExternalLink size={10} />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & Privacy */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold uppercase tracking-wider text-neutral-900 text-[11px]">
              Legal & Privacy
            </h4>
            <ul className="space-y-2 text-neutral-600">
              <li><Link href="/privacy" className="hover:text-neutral-950 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-neutral-950 transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-neutral-950 transition-colors">Cookie Disclosures</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-mono text-neutral-500">
          <p>© {new Date().getFullYear()} CamTech Blog / Daily Discovery. All rights reserved.</p>
          <p>Optimized for Google AdSense • ISO 8601 Telemetry Standards</p>
        </div>
      </div>
    </footer>
  );
}
