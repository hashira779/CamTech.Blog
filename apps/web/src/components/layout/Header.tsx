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
    <header className="w-full bg-white border-b border-gray-200 select-none sticky top-0 z-50">
      {/* 1. TOP UTILITY BAR */}
      <div className="bg-gray-50 text-xs text-gray-600 font-sans border-b border-gray-200 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-800">{currentDate}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">
              {lang === "km" ? "ព័ត៌មានបច្ចេកវិទ្យាប្រចាំថ្ងៃ" : "Daily Technology & World News"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-200 rounded-md p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  lang === "en" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("km")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  lang === "km" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                ខ្មែរ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Logo & Search) */}
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

          {/* Logo */}
          <div className="flex-1 text-center lg:text-left">
            <Link href="/" className="inline-block group">
              <div className="flex flex-col">
                <span className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-700 group-hover:text-blue-800 transition-colors">
                  CamTech<span className="text-gray-900">Blog</span>
                </span>
                <span className="block text-xs text-gray-500 font-medium">
                  {lang === "km" ? "បណ្ដាញព័ត៌មានបច្ចេកវិទ្យា" : "Technology & Science News"}
                </span>
              </div>
            </Link>
          </div>

          {/* Search Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Search articles"
            >
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Expandable Search Input */}
        {searchOpen && (
          <form onSubmit={handleSearchSubmit} className="mt-4 pt-4 border-t border-gray-100 pb-2">
            <div className="relative max-w-2xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, guides, news..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white text-sm px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. PRIMARY NAVIGATION BAR */}
      <nav className="border-t border-gray-100 bg-white shadow-sm">
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
                        ? "text-blue-600"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-t-md"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Trending Tag */}
            <div className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>Trending Now</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-1 shadow-inner">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-gray-200 mt-4 flex items-center justify-between">
            <div className="flex items-center bg-white border border-gray-200 rounded-md p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => { setLang("en"); setMobileMenuOpen(false); }}
                className={`px-3 py-1.5 rounded-sm transition-colors ${
                  lang === "en" ? "bg-gray-100 text-blue-600" : "text-gray-600"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => { setLang("km"); setMobileMenuOpen(false); }}
                className={`px-3 py-1.5 rounded-sm transition-colors ${
                  lang === "km" ? "bg-gray-100 text-blue-600" : "text-gray-600"
                }`}
              >
                ខ្មែរ
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
