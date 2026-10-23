import * as React from "react";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { Container, type ContainerWidth } from "@/components/ui/container";
import { CategoryMark, type CategoryKey } from "@/components/ui/category-mark";

export interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  /** Small label above the title. Wears a section hue when `category` is set. */
  eyebrow?: React.ReactNode;
  category?: CategoryKey;
  /** A ready-made badge shown above the title instead of the text eyebrow. */
  badge?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-hand meta on wide screens: counts, a quiet link, actions. */
  aside?: React.ReactNode;
  /** Must match the width of the body below so the left edges line up. */
  width?: ContainerWidth;
  className?: string;
}

/**
 * The one page header.
 *
 * Section fronts, listings and the policy pages each hand-built this block —
 * breadcrumb, label, display-face h1, deck, hairline — with small drifts in
 * spacing and some with no breadcrumb at all. Every route now takes the same
 * header, so moving between pages the title always lands in the same place.
 */
export function PageHeader({
  breadcrumbs,
  eyebrow,
  category,
  badge,
  title,
  description,
  aside,
  width = "page",
  className,
}: PageHeaderProps) {
  return (
    <Container width={width} className={["pt-8 sm:pt-12", className].filter(Boolean).join(" ")}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}

      <header className="mt-6 flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          {badge && <div className="mb-1">{badge}</div>}
          {!badge &&
            eyebrow &&
            (category ? (
              <CategoryMark category={category} tone="dot">
                {eyebrow}
              </CategoryMark>
            ) : (
              <p className="section-label text-accent">{eyebrow}</p>
            ))}
          <h1 className="hero-rise hero-rise-2 mt-3 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="hero-rise hero-rise-3 mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          )}
        </div>

        {aside && (
          <div className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {aside}
          </div>
        )}
      </header>
    </Container>
  );
}
