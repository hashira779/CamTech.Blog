"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Globe2,
  MapPin,
  Sparkles,
  HelpCircle,
  Wrench,
  TrendingUp,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Bookmark,
  ShieldAlert,
  Palmtree
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export function Header() {
  const pathname = usePathname();
  const { lang, setLang, t } = useI18n();
  const { isDark, setTheme, theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { href: "/", label: t("nav.home"), icon: Compass },
    { href: "/cambodia", label: t("nav.cambodia"), icon: MapPin },
    { href: "/world", label: t("nav.world"), icon: Globe2 },
    { href: "/discover", label: t("nav.discover"), icon: Sparkles },
    { href: "/travel", label: t("nav.travel"), icon: Palmtree },
    { href: "/quiz", label: t("nav.quiz"), icon: HelpCircle },
    { href: "/tools", label: t("nav.tools"), icon: Wrench },
    { href: "/trending", label: t("nav.trending"), icon: TrendingUp },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="h-9 w-9 rounded-lg bg-teal-700 dark:bg-teal-600 flex items-center justify-center text-white transition-opacity group-hover:opacity-90">
                  <Compass className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-slate-100 leading-none">
                    DAILY<span className="text-teal-700 dark:text-teal-400">.</span>DISCOVERY
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === "km" ? "ព័ត៌មាន និង ចំណេះដឹង" : "News & Curated Knowledge"}
                  </span>
                </div>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden lg:flex items-center gap-1 ml-4">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                        isActive
                          ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold"
                          : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 opacity-70" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Actions (Search, Lang, Theme, Admin) */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Language Switcher */}
              <button
                onClick={() => setLang(lang === "en" ? "km" : "en")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Switch Language"
              >
                {lang === "en" ? "🇰🇭 ខ្មែរ" : "🇬🇧 EN"}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className="p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Admin Link */}
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                CMS
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Quick Search Dropdown Bar */}
          {searchOpen && (
            <div className="py-3 border-t border-neutral-100 dark:border-neutral-900 animate-in fade-in slide-in-from-top-2 duration-200">
              <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder={t("nav.search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-20 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700/50"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-md transition-colors"
                >
                  Search
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-6 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Travel Sub-features */}
            <div className="pl-6 pt-1 pb-1 space-y-1 text-xs border-l-2 border-primary/20 ml-4 my-2">
              <Link
                href="/travel/transport"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-1.5 text-muted-foreground hover:text-foreground"
              >
                🚌 Highway Buses & Minivans
              </Link>
              <Link
                href="/travel/nearby"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-1.5 text-muted-foreground hover:text-foreground"
              >
                🧭 Nearby Landmark Search
              </Link>
              <Link
                href="/travel/planner"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-1.5 text-muted-foreground hover:text-foreground"
              >
                🗺️ Multi-Day Trip Planner
              </Link>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-900">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-600 dark:text-rose-400"
              >
                <ShieldAlert className="h-4 w-4" />
                CMS Editorial Administration
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
