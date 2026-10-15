import * as React from "react";
import { cn } from "@/lib/utils";
import { categoryKey, type CategoryKey } from "@/lib/category-key";

/**
 * Section marks.
 *
 * The name→hue lookup lives in `@/lib/category-key` so the design gate can run it
 * against the real category names without importing React. This file only owns the
 * three class tables. Re-exported because every route already imports it from here.
 */
export { categoryKey };
export type { CategoryKey };

const TEXT_CLASS: Record<CategoryKey, string> = {
  news: "text-category-news",
  world: "text-category-world",
  travel: "text-category-travel",
  discover: "text-category-discover",
  quiz: "text-category-quiz",
  tools: "text-category-tools",
  transport: "text-category-transport",
  tech: "text-category-tech",
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
  tech: "bg-category-tech",
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
  tech: "bg-category-tech/10 text-category-tech",
  breaking: "bg-category-breaking/10 text-category-breaking",
  neutral: "bg-muted text-muted-foreground",
};

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
