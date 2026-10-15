import * as React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { Container, type ContainerWidth } from "@/components/ui/container";

export interface PublicPageShellProps {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "reading" | "standard" | "wide";
  className?: string;
}

/** The old shell measured widths from `max-w-page`, a utility nothing declares. */
const WIDTH_BY_MAXWIDTH: Record<
  NonNullable<PublicPageShellProps["maxWidth"]>,
  ContainerWidth
> = {
  reading: "reading",
  standard: "page",
  wide: "wide",
};

/**
 * The public listing/section shell: breadcrumb, masthead-style page header, body.
 *
 * The page header is deliberately not `SectionHeader` — that primitive sizes the
 * h2 used inside a page, and this is the one h1 a route gets, so it takes the
 * display scale. Everything measures from `<Container>`, so columns line up with
 * the homepage and the other routes that share this shell.
 */
export function PublicPageShell({
  breadcrumbs,
  title,
  description,
  badge,
  actions,
  children,
  maxWidth = "standard",
  className = "",
}: PublicPageShellProps) {
  return (
    <div className="flex w-full flex-1 flex-col py-8 sm:py-12">
      <Container width={WIDTH_BY_MAXWIDTH[maxWidth]} className={className}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-5">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}

        {title && (
          <header className="mb-8 border-b border-border pb-6 sm:mb-10">
            {(badge || actions) && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                {badge}
                {actions && (
                  <div className="flex items-center gap-2">{actions}</div>
                )}
              </div>
            )}

            <h1 className="max-w-3xl font-display text-3xl leading-[1.1] tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>

            {description && (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </header>
        )}

        {/* The root layout already opens <main id="main">; a second one here was
            invalid HTML. */}
        <div>{children}</div>
      </Container>
    </div>
  );
}
