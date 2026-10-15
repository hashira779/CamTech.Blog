import * as React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { Container } from "@/components/ui/container";

export interface DetailShellProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  hero?: React.ReactNode;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  relatedContent?: React.ReactNode;
}

/**
 * Detail/article shell: breadcrumb, hero, serif headline, then a body column and
 * an optional rail.
 *
 * The body column is capped so long-form copy keeps a reading measure even when
 * there is no sidebar — previously `lg:col-span-12` let paragraphs run the full
 * 78rem width. Headline is the display face; the subtitle is deck copy, not a
 * second heading.
 */
export function DetailShell({
  breadcrumbs,
  title,
  subtitle,
  badge,
  actions,
  hero,
  children,
  sidebar,
  relatedContent,
}: DetailShellProps) {
  return (
    <div className="flex w-full flex-1 flex-col py-8 sm:py-12">
      <Container>
        <div className="mb-5">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {hero && <div className="mb-8">{hero}</div>}

        <header className="mb-8 border-b border-border pb-6">
          {(badge || actions) && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              {badge}
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          )}

          <h1 className="max-w-3xl font-display text-3xl leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </header>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div
            className={
              sidebar
                ? "min-w-0 space-y-8 lg:col-span-8"
                : "min-w-0 space-y-8 lg:col-span-8 lg:col-start-3"
            }
          >
            {children}
          </div>

          {sidebar && (
            <aside className="lg:col-span-4 lg:col-start-9">
              <div className="space-y-8 lg:sticky lg:top-24">{sidebar}</div>
            </aside>
          )}
        </div>

        {relatedContent && (
          <div className="mt-14 border-t border-border pt-10">{relatedContent}</div>
        )}
      </Container>
    </div>
  );
}
