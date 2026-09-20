"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, Compass, Newspaper, Wrench, Bus } from "lucide-react";
import { DESIGN_TOKENS } from "@/lib/tokens";

export interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  showCategoryFilters?: boolean;
  className?: string;
}

export function SearchBar({
  initialQuery = "",
  placeholder = "Search news, places, hotels, bus routes, tools...",
  showCategoryFilters = false,
  className = "",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const catParam = selectedCategory !== "all" ? `&category=${selectedCategory}` : "";
    router.push(`/search?q=${encodeURIComponent(query.trim())}${catParam}`);
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <form onSubmit={handleSearch} className={`w-full ${className}`}>
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
          <Search size={DESIGN_TOKENS.iconSize.md} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-10 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-teal-700 transition-colors dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 shadow-xs"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Clear search query"
          >
            <X size={DESIGN_TOKENS.iconSize.sm} />
          </button>
        )}
      </div>

      {showCategoryFilters && (
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "All Content" },
            { id: "news", label: "News", icon: Newspaper },
            { id: "travel", label: "Travel & Places", icon: Compass },
            { id: "transport", label: "Transit Routes", icon: Bus },
            { id: "tools", label: "Utilities", icon: Wrench },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-teal-700 text-white dark:bg-teal-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {Icon && <Icon size={12} />}
                {cat.label}
              </button>
            );
          })}
        </div>
      )}
    </form>
  );
}
