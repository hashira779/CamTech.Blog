"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, FileText, Compass, HelpCircle, Wrench, ArrowRight, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchGlobal } from "@/lib/api";
import { SearchResultItem } from "@/types";

export function SuperSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        const data = await searchGlobal(query.trim());
        setResults(data.results || []);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (url: string) => {
    setIsOpen(false);
    router.push(url);
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "article":
      case "news":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "place":
      case "destination":
      case "travel":
        return <Compass className="w-4 h-4 text-amber-500" />;
      case "quiz":
        return <HelpCircle className="w-4 h-4 text-green-500" />;
      case "tool":
        return <Wrench className="w-4 h-4 text-purple-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg transition-colors w-48 lg:w-64"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left">Search everything...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium text-gray-500 bg-white border border-gray-300 rounded opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
      >
        <Search size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 pb-4">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across articles, places, quizzes, tools..."
                className="flex-1 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 text-base py-2 outline-none"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
              {loading && (
                <div className="flex items-center justify-center p-8 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Searching the entire system...</span>
                </div>
              )}

              {!loading && query.length > 0 && query.length < 2 && (
                <div className="p-8 text-center text-sm text-gray-500">
                  Type at least 2 characters to search...
                </div>
              )}

              {!loading && query.length >= 2 && results.length === 0 && (
                <div className="p-12 text-center">
                  <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-900 dark:text-white font-medium">No results found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Try searching for something else like &ldquo;Cambodia&rdquo; or &ldquo;Quiz&rdquo;
                  </p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Search Results
                  </div>
                  {results.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleResultClick(item.url)}
                      className="w-full text-left flex items-start gap-3 p-3 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-xl transition-colors group"
                    >
                      <div className="mt-0.5 p-1.5 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-100 dark:border-gray-600">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                          {item.summary}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))}
                  
                  {results.length > 0 && (
                    <div className="px-3 pt-3 pb-1 border-t border-gray-100 dark:border-gray-800 mt-2">
                      <button 
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/search?q=${encodeURIComponent(query)}`);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center py-2"
                      >
                        View all results in search page &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!query && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Quick Links
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-2">
                    {[
                      { title: "Travel & Guides", url: "/travel", icon: Compass, color: "text-amber-500" },
                      { title: "Daily Quiz", url: "/quiz", icon: HelpCircle, color: "text-green-500" },
                      { title: "Tools & Utilities", url: "/tools", icon: Wrench, color: "text-purple-500" },
                      { title: "Discoveries", url: "/discover", icon: Sparkles, color: "text-blue-500" }
                    ].map((link) => (
                      <button
                        key={link.title}
                        onClick={() => handleResultClick(link.url)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-200 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors text-left"
                      >
                        <link.icon className={`w-5 h-5 ${link.color}`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {link.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-sans">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-sans">↓</kbd>
                  <span className="ml-1">to navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-sans">Enter</kbd>
                  <span className="ml-1">to select</span>
                </span>
              </div>
              <div className="font-semibold text-blue-600 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Super Search
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
