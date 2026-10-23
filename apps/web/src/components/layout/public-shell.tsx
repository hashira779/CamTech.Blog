import * as React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { Container, type ContainerWidth } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";

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
 * The public listing/section shell: the shared `PageHeader`, then the body.
 *
 * It used to draw its own header with a slightly different title size and
 * spacing from every other route. It now hands the header to `PageHeader`, so
 * pages on this shell and pages that use the header directly line up exactly.
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
  const width = WIDTH_BY_MAXWIDTH[maxWidth];

  return (
    <div className="flex w-full flex-1 flex-col pb-14 sm:pb-20">
      {title ? (
        <PageHeader
          width={width}
          breadcrumbs={breadcrumbs}
          badge={badge}
          title={title}
          description={description}
          aside={actions}
        />
      ) : (
        breadcrumbs &&
        breadcrumbs.length > 0 && (
          <Container width={width} className="pt-8 sm:pt-12">
            <Breadcrumbs items={breadcrumbs} />
          </Container>
        )
      )}

      {/* The root layout already opens <main id="main">; a second one here was
          invalid HTML. */}
      <Container width={width} className={`pt-8 sm:pt-10 ${className}`}>
        {children}
      </Container>
    </div>
  );
}
