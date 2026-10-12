"use client";

import React, { useState } from "react";
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
    <header className="w-full bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 select-none sticky top-0 z-50 transition-colors duration-200">
      {/* 1. TOP UTILITY BAR */}
      <div className="bg-gray-50 dark:bg-slate-950 text-xs text-gray-600 dark:text-slate-400 font-sans border-b border-gray-200 dark:border-slate-800 hidden sm:block">
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
            <div className="flex items-center bg-gray-200 dark:bg-slate-800 rounded-md p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setTheme("light")}
                title="Light mode"
                className={`px-2 py-0.5 rounded-sm transition-colors flex items-center gap-1 ${
                  theme === "light" 
                    ? "bg-white text-amber-600 shadow-sm" 
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Sun size={12} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                title="Dark mode"
                className={`px-2 py-0.5 rounded-sm transition-colors flex items-center gap-1 ${
                  theme === "dark" 
                    ? "bg-slate-700 text-teal-300 shadow-sm" 
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Moon size={12} />
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-gray-200 dark:bg-slate-800 rounded-md p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  lang === "en" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-teal-300 shadow-sm" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("km")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  lang === "km" ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-teal-300 shadow-sm" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                ខ្មែរ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Logo & Search) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-700 dark:text-slate-300 hover:text-neutral-900 dark:hover:text-white -ml-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <div className="flex-1 text-center lg:text-left">
            <Link href="/" className="inline-block group">
              <div className="flex flex-col">
                <span className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-700 dark:text-teal-400 group-hover:text-blue-800 dark:group-hover:text-teal-300 transition-colors">
                  CamTech<span className="text-gray-900 dark:text-slate-100">Blog</span>
                </span>
                <span className="block text-xs text-gray-500 dark:text-slate-400 font-medium">
                  {lang === "km" ? "បណ្ដាញព័ត៌មានបច្ចេកវិទ្យា" : "Technology & Science News"}
                </span>
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
      <nav className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-3.5 text-sm font-medium transition-colors relative flex items-center ${
                      isActive
                        ? "text-blue-600 dark:text-teal-400 font-semibold"
                        : "text-gray-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-teal-400 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 rounded-t-md"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-teal-400 rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Trending Tag */}
            <div className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/40">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>Trending Now</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-4 py-4 space-y-1 shadow-inner">
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
                className={`px-2.5 py-1.5 rounded-sm transition-colors ${
                  theme === "light" ? "bg-gray-100 text-amber-500" : "text-gray-500"
                }`}
              >
                <Sun size={15} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`px-2.5 py-1.5 rounded-sm transition-colors ${
                  theme === "dark" ? "bg-slate-700 text-teal-300" : "text-gray-500"
                }`}
              >
                <Moon size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
