"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Rss, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { lang, t } = useI18n();

  return (
    <footer className="w-full border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 mt-20 font-sans select-none transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Top Masthead & Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-gray-100 dark:border-slate-800">
          <div>
            <Link href="/" className="inline-block">
              <span className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-teal-600 dark:text-teal-400">
                CamTech<span className="text-gray-900 dark:text-white">Blog</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 max-w-lg leading-relaxed font-medium">
              Daily technology news, scientific discoveries, and ASEAN economic developments.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300 font-semibold">
              <ShieldCheck size={16} className="text-teal-600 dark:text-teal-400" /> Trusted Source
            </span>
            <span className="text-gray-300 dark:text-slate-700">•</span>
            <Link href="/feed.xml" className="flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              <Rss size={14} />
              <span>RSS Feed</span>
            </Link>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 text-sm">
          {/* Col 1: News & Analysis */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              Categories
            </h4>
            <ul className="space-y-3 text-gray-600 dark:text-slate-400 font-medium">
              <li><Link href="/cambodia" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Cambodia</Link></li>
              <li><Link href="/world" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">World</Link></li>
              <li><Link href="/trending" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Trending</Link></li>
              <li><Link href="/discover" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Discover</Link></li>
            </ul>
          </div>

          {/* Col 2: Features & Leisure */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              Features
            </h4>
            <ul className="space-y-3 text-gray-600 dark:text-slate-400 font-medium">
              <li><Link href="/travel" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Travel Guides</Link></li>
              <li><Link href="/travel/planner" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Trip Planner</Link></li>
              <li><Link href="/quiz" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Daily Quiz</Link></li>
              <li><Link href="/tools" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Web Tools</Link></li>
            </ul>
          </div>

          {/* Col 3: Editorial Standards */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              Editorial
            </h4>
            <ul className="space-y-3 text-gray-600 dark:text-slate-400 font-medium">
              <li><Link href="/editorial-policy" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Editorial Policy</Link></li>
              <li><Link href="/content-standards" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Standards</Link></li>
              <li><Link href="/corrections-policy" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Corrections</Link></li>
            </ul>
          </div>

          {/* Col 4: Corporate & Transparency */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              Company
            </h4>
            <ul className="space-y-3 text-gray-600 dark:text-slate-400 font-medium">
              <li><Link href="/about" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">About Us</Link></li>
              <li><Link href="/advertising" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Advertising</Link></li>
              <li><Link href="/contact" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Contact</Link></li>
              <li>
                <a href="https://cms.camtech.cam" target="_blank" rel="noopener noreferrer" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  <span>CMS Portal</span>
                  <ExternalLink size={14} />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & Privacy */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              Legal
            </h4>
            <ul className="space-y-3 text-gray-600 dark:text-slate-400 font-medium">
              <li><Link href="/privacy" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-8 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-gray-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} CamTechBlog. All rights reserved.</p>
          <p>Standard AdSense Optimized UI</p>
        </div>
      </div>
    </footer>
  );
}
