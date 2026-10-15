import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Section marks.
 *
 * Category colour used to be chosen per page (teal on news, rose on breaking,
 * amber on quiz, emerald on travel), so the same concept looked different on
 * every route. There is now one restrained hue per section, defined as a token,
 * and it is only ever used for small marks and chips — never as a large fill.
 */
export type CategoryKey =
  | "news"
  | "world"
  | "travel"
  | "discover"
  | "quiz"
  | "tools"
  | "transport"
  | "breaking"
  | "neutral";

const TEXT_CLASS: Record<CategoryKey, string> = {
  news: "text-category-news",
  world: "text-category-world",
  travel: "text-category-travel",
  discover: "text-category-discover",
  quiz: "text-category-quiz",
  tools: "text-category-tools",
  transport: "text-category-transport",
  breaking: "text-category-breaking",
  neutral: "text-muted-foreground",
};

const DOT_CLASS: Record<CategoryKey, string> = {
  news: "bg-category-news",
  world: "bg-category-world",
  travel: "bg-category-travel",
  discover: "bg-category-discover",
  quiz: "bg-category-quiz",
  tools: "bg-category-tools",
  transport: "bg-category-transport",
  breaking: "bg-category-breaking",
  neutral: "bg-muted-foreground",
};

const CHIP_CLASS: Record<CategoryKey, string> = {
  news: "bg-category-news/10 text-category-news",
  world: "bg-category-world/10 text-category-world",
  travel: "bg-category-travel/10 text-category-travel",
  discover: "bg-category-discover/10 text-category-discover",
  quiz: "bg-category-quiz/10 text-category-quiz",
  tools: "bg-category-tools/10 text-category-tools",
  transport: "bg-category-transport/10 text-category-transport",
  breaking: "bg-category-breaking/10 text-category-breaking",
  neutral: "bg-muted text-muted-foreground",
};

/** Normalises the many spellings the API and page props use into one key. */
export function categoryKey(value?: string | null): CategoryKey {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v) return "neutral";
  if (v.includes("break")) return "breaking";
  if (v.includes("travel") || v.includes("tourism")) return "travel";
  if (v.includes("world") || v.includes("international") || v.includes("global")) return "world";
  if (v.includes("discover") || v.includes("science") || v.includes("explainer")) return "discover";
  if (v.includes("quiz")) return "quiz";
  if (v.includes("tool") || v.includes("utility")) return "tools";
  if (v.includes("transport") || v.includes("transit")) return "transport";
  if (v.includes("cambodia") || v.includes("khmer") || v.includes("news") || v.includes("national")) return "news";
  return "neutral";
}

export interface CategoryMarkProps {
  category?: string | null;
  children?: React.ReactNode;
  tone?: "dot" | "chip" | "text";
  className?: string;
}

export function CategoryMark({ category, children, tone = "text", className }: CategoryMarkProps) {
  const key = categoryKey(category);
  const label = children ?? category;
  if (!label) return null;

  if (tone === "chip") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em]",
          CHIP_CLASS[key],
          className
        )}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em]",
        TEXT_CLASS[key],
        className
      )}
    >
      {tone === "dot" && (
        <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_CLASS[key])} />
      )}
      {label}
    </span>
  );
}
