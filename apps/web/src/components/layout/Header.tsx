"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function Header() {
  const pathname = usePathname();
  const { lang, setLang } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { href: "/", label: lang === "km" ? "ទំព័រដើម" : "Home" },
    { href: "/cambodia", label: lang === "km" ? "កម្ពុជា" : "Cambodia" },
    { href: "/world", label: lang === "km" ? "អន្តរជាតិ" : "World" },
    { href: "/discover", label: lang === "km" ? "របកគំហើញ" : "Discover" },
    { href: "/travel", label: lang === "km" ? "ទេសចរណ៍" : "Travel & Guides" },
    { href: "/quiz", label: lang === "km" ? "សំណួរប្រចាំថ្ងៃ" : "Daily Quiz" },
    { href: "/tools", label: lang === "km" ? "ឧបករណ៍" : "Tools" },
    { href: "/trending", label: lang === "km" ? "កំពុងពេញនិយម" : "Trending" },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="w-full bg-white border-b border-neutral-200 select-none">
      {/* 1. TOP UTILITY BAR (Standard Newspaper / Editorial Style) */}
      <div className="border-b border-neutral-100 bg-[#FAF9F6] text-[11px] text-neutral-600 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-neutral-800">{currentDate}</span>
            <span className="text-neutral-300">|</span>
            <span className="hidden sm:inline text-neutral-500">
              {lang === "km" ? "បោះពុម្ពផ្សាយប្រចាំថ្ងៃ • កម្ពុជា និងសកលលោក" : "Today's Edition • Independent Technology & World Journalism"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center border border-neutral-200 rounded overflow-hidden text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 transition-colors ${
                  lang === "en" ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("km")}
                className={`px-2 py-0.5 transition-colors ${
                  lang === "km" ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                ខ្មែរ
              </button>
            </div>

            {/* CMS Portal Link */}
            <a
              href="https://cms.camtech.cam"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-neutral-700 hover:text-neutral-950 transition-colors"
            >
              <span>Editorial CMS</span>
              <ExternalLink size={10} className="text-neutral-400" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN EDITORIAL MASTHEAD */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-700 hover:text-neutral-900 -ml-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Centered Editorial Brand Logo */}
          <div className="flex-1 text-center lg:text-left">
            <Link href="/" className="inline-block group">
              <span className="font-serif text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900 group-hover:text-neutral-800 transition-colors uppercase">
                CamTech<span className="text-neutral-400 font-light">.</span>Blog
              </span>
              <span className="block text-[10px] sm:text-xs tracking-[0.25em] uppercase font-sans text-neutral-500 mt-1 font-medium">
                {lang === "km" ? "ព័ត៌មាន បច្ចេកវិទ្យា និងចំណេះដឹងទូទៅ" : "Daily Discovery • Technology, Science & ASEAN Economy"}
              </span>
            </Link>
          </div>

          {/* Search Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
              title="Search articles"
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Expandable Search Input */}
        {searchOpen && (
          <form onSubmit={handleSearchSubmit} className="mt-4 pt-3 border-t border-neutral-200">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all published journalism, guides, and archives..."
                className="w-full bg-neutral-50 border border-neutral-300 rounded-md py-2 pl-9 pr-20 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-neutral-900 text-white text-xs px-3 py-1.5 rounded font-medium hover:bg-neutral-800"
              >
                Search
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. PRIMARY CATEGORY NAVIGATION BAR (Clean, Text-Only, No Tacky Icons) */}
      <nav className="border-t border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-7">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-3 text-xs uppercase tracking-wider font-semibold transition-all relative ${
                      isActive
                        ? "text-neutral-950 font-bold"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-950" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Trending Tag */}
            <div className="flex items-center gap-2 text-xs font-serif italic text-neutral-500 py-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Updates</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-neutral-200 bg-white px-4 py-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded text-sm uppercase tracking-wider font-semibold ${
                  isActive
                    ? "bg-neutral-100 text-neutral-950 font-bold"
                    : "text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-neutral-200 mt-2">
            <a
              href="https://cms.camtech.cam"
              className="block px-3 py-2 text-sm text-neutral-600 font-medium"
            >
              Open Editorial CMS ↗
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
