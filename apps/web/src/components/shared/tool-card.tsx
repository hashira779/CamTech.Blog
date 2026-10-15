import * as React from "react";
import Link from "next/link";
import { ArrowRight, Wrench, Calculator, Code2, Image as ImageIcon, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CategoryMark, categoryKey } from "@/components/ui/category-mark";
import { DESIGN_TOKENS } from "@/lib/tokens";
import { formatCount } from "@/lib/format";

export interface ToolCardProps {
  slug: string;
  name: string;
  category: string;
  description: string;
  iconName?: string;
  /** Real `usage_count` from the API. Rendered only when greater than zero. */
  usageCount?: number;
  /** Real `is_popular` flag. The label is never applied by default. */
  popular?: boolean;
}

function iconForCategory(category: string) {
  switch (category.toLowerCase()) {
    case "calculator":
    case "calculators":
      return <Calculator size={DESIGN_TOKENS.iconSize.md} aria-hidden="true" />;
    case "developer":
      return <Code2 size={DESIGN_TOKENS.iconSize.md} aria-hidden="true" />;
    case "image":
      return <ImageIcon size={DESIGN_TOKENS.iconSize.md} aria-hidden="true" />;
    case "text":
    case "file":
    case "media":
      return <FileText size={DESIGN_TOKENS.iconSize.md} aria-hidden="true" />;
    default:
      return <Wrench size={DESIGN_TOKENS.iconSize.md} aria-hidden="true" />;
  }
}

/**
 * One tool in the tools index.
 *
 * The old version painted a teal tile, a slate headline and a "Free Client
 * Utility" promise the API never confirmed. It is now a hairline card on paper:
 * the category mark carries the colour, the headline is the serif, and the only
 * figures shown are the ones the API actually returns.
 */
export function ToolCard({ slug, name, category, description, usageCount, popular }: ToolCardProps) {
  const uses = usageCount && usageCount > 0 ? formatCount(usageCount) : null;

  return (
    <Card
      hoverEffect
      className="group flex h-full flex-col overflow-hidden rounded-lg p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted border border-border text-category-tools">
          {iconForCategory(category)}
        </span>
        <CategoryMark category={categoryKey("tools")} tone="chip">
          {category}
        </CategoryMark>
      </div>

      <h3 className="mb-1.5 font-display text-lg leading-snug tracking-tight text-foreground">
        <Link href={`/tools/${slug}`} className="transition-colors hover:text-accent">
          {name}
          <span className="sr-only"> — open tool</span>
        </Link>
      </h3>

      {description && (
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3.5">
        <span className="text-xs text-muted-foreground tabular-nums">
          {popular ? "Frequently used" : uses ? `${uses} uses` : "Runs in your browser"}
        </span>
        <Link
          href={`/tools/${slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-colors hover:text-foreground"
        >
          Open
          <ArrowRight
            size={DESIGN_TOKENS.iconSize.xs}
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </Card>
  );
}
