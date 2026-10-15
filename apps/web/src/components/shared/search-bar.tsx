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
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground">
          <Search size={DESIGN_TOKENS.iconSize.md} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-10 rounded-lg border border-input bg-surface text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring transition-colors shadow-xs"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground"
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
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-muted text-muted-foreground hover:text-foreground"
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
