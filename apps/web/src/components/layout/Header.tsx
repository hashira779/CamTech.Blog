"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, ExternalLink, Sun, Moon, Laptop } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { SuperSearch } from "@/components/shared/SuperSearch";

export function Header() {
  const pathname = usePathname();
  const { lang, setLang } = useI18n();
  const { theme, setTheme, isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200/80 dark:border-slate-800/80 select-none sticky top-0 z-50 transition-all duration-200 shadow-xs">
      {/* 1. TOP UTILITY BAR */}
      <div className="bg-gray-50/90 dark:bg-slate-950/80 text-xs text-gray-600 dark:text-slate-400 font-sans border-b border-gray-200/60 dark:border-slate-800/60 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-800 dark:text-slate-200">{currentDate}</span>
            <span className="text-gray-300 dark:text-slate-700">|</span>
            <span className="text-gray-500 dark:text-slate-400">
              {lang === "km" ? "ព័ត៌មានបច្ចេកវិទ្យាប្រចាំថ្ងៃ" : "Daily Technology & World News"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Switcher */}
            <div className="flex items-center bg-gray-200/80 dark:bg-slate-800 rounded-md p-0.5 text-xs font-medium border border-gray-300/50 dark:border-slate-700/60 shadow-xs">
              <button
                type="button"
                onClick={() => setTheme("light")}
                title="Light mode"
                className={`px-2 py-0.5 rounded-sm transition-all flex items-center gap-1 ${
                  mounted && theme === "light" 
                    ? "bg-white text-amber-600 shadow-xs font-semibold" 
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Sun size={12} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                title="Dark mode"
                className={`px-2 py-0.5 rounded-sm transition-all flex items-center gap-1 ${
                  mounted && theme === "dark" 
                    ? "bg-slate-700 text-teal-300 shadow-xs font-semibold" 
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Moon size={12} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                title="System mode"
                className={`px-2 py-0.5 rounded-sm transition-all flex items-center gap-1 ${
                  mounted && theme === "system" 
                    ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs font-semibold" 
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Laptop size={12} />
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-gray-200/80 dark:bg-slate-800 rounded-md p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-0.5 rounded-sm transition-all ${
                  lang === "en" ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs font-bold" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("km")}
                className={`px-2.5 py-0.5 rounded-sm transition-all ${
                  lang === "km" ? "bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-300 shadow-xs font-bold" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                ខ្មែរ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Logo & Search) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors -ml-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <div className="flex-1 text-center lg:text-left">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-2.5 justify-center lg:justify-start">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-teal-500 via-teal-600 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-105 transition-transform duration-300">
                  C
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-sans text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white transition-colors leading-none">
                    CamTech<span className="text-teal-600 dark:text-teal-400">.Blog</span>
                  </span>
                  <span className="block text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-1">
                    {lang === "km" ? "បណ្ដាញព័ត៌មានបច្ចេកវិទ្យា" : "Technology & Science News"}
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Search Trigger */}
          <div className="flex items-center gap-3">
            <SuperSearch />
          </div>
        </div>
      </div>

      {/* 3. PRIMARY NAVIGATION BAR */}
      <nav className="border-t border-gray-100 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-3 text-xs sm:text-sm font-semibold transition-all relative flex items-center ${
                      isActive
                        ? "text-teal-600 dark:text-teal-400"
                        : "text-gray-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-slate-800/50 rounded-lg"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.6)] animate-scale-in" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Trending Tag */}
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 px-3 py-1 rounded-full border border-rose-200/60 dark:border-rose-900/40 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-radar absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
              </span>
              <span>Trending Now</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-4 py-4 space-y-1 shadow-lg animate-fade-in">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-100 dark:bg-teal-950/60 text-blue-700 dark:text-teal-300 font-semibold"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-800 mt-4 flex items-center justify-between">
            {/* Language Switcher */}
            <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => { setLang("en"); setMobileMenuOpen(false); }}
                className={`px-3 py-1.5 rounded-sm transition-colors ${
                  lang === "en" ? "bg-gray-100 dark:bg-slate-700 text-blue-600 dark:text-teal-300 font-medium" : "text-gray-600 dark:text-slate-400"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => { setLang("km"); setMobileMenuOpen(false); }}
                className={`px-3 py-1.5 rounded-sm transition-colors ${
                  lang === "km" ? "bg-gray-100 dark:bg-slate-700 text-blue-600 dark:text-teal-300 font-medium" : "text-gray-600 dark:text-slate-400"
                }`}
              >
                ខ្មែរ
              </button>
            </div>

            {/* Mobile Theme Toggle */}
            <div className="flex items-center bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setTheme("light")}
                title="Light mode"
                className={`px-2.5 py-1.5 rounded-sm transition-colors ${
                  mounted && theme === "light" ? "bg-gray-100 dark:bg-slate-700 text-amber-500 font-semibold" : "text-gray-500 dark:text-slate-400"
                }`}
              >
                <Sun size={15} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                title="Dark mode"
                className={`px-2.5 py-1.5 rounded-sm transition-colors ${
                  mounted && theme === "dark" ? "bg-slate-700 text-teal-300 font-semibold" : "text-gray-500 dark:text-slate-400"
                }`}
              >
                <Moon size={15} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                title="System mode"
                className={`px-2.5 py-1.5 rounded-sm transition-colors ${
                  mounted && theme === "system" ? "bg-gray-100 dark:bg-slate-700 text-teal-600 dark:text-teal-300 font-semibold" : "text-gray-500 dark:text-slate-400"
                }`}
              >
                <Laptop size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
