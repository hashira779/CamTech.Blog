import * as React from "react";
import { Search } from "lucide-react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { Container } from "@/components/ui/container";

export interface ListingShellProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description?: string;
  badge?: React.ReactNode;
  searchPlaceholder?: string;
  filterComponent?: React.ReactNode;
  actions?: React.ReactNode;
  totalCount?: number;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
  pagination?: React.ReactNode;
}

/**
 * Listing shell: breadcrumb, page header, search/filter rail, result count,
 * body, pagination — the same rhythm every index page uses.
 *
 * Two things beyond colour. The search box used to mount `SearchBar`, whose input
 * is hardcoded teal-on-slate and which is off-limits to this pass, so the shell
 * now renders an equivalent plain GET form to `/search` (`?q=`), which is exactly
 * the URL that component pushed. And the loading state is real: the previous
 * version accepted `isLoading` and ignored it, so a skeleton never appeared.
 */
export function ListingShell({
  breadcrumbs,
  title,
  description,
  badge,
  searchPlaceholder,
  filterComponent,
  actions,
  totalCount,
  isLoading = false,
  isEmpty = false,
  emptyTitle = "No records found",
  emptyDescription = "Try broadening your search or resetting your filters.",
  children,
  pagination,
}: ListingShellProps) {
  return (
    <div className="flex w-full flex-1 flex-col py-8 sm:py-12">
      <Container>
        <div className="mb-5">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        <header className="mb-8 border-b border-border pb-6">
          {(badge || actions) && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              {badge}
              {actions && <div className="flex items-center gap-2">{actions}</div>}
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

        {(searchPlaceholder || filterComponent) && (
          <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
            {searchPlaceholder && (
              <form action="/search" method="GET" className="relative w-full lg:max-w-md">
                <Search
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <label className="sr-only" htmlFor="listing-search">
                  Search
                </label>
                <input
                  id="listing-search"
                  type="text"
                  name="q"
                  placeholder={searchPlaceholder}
                  className="h-11 w-full rounded-md border border-input bg-surface pl-10 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring"
                />
              </form>
            )}

            {filterComponent && (
              <div className="flex flex-wrap items-center gap-2">{filterComponent}</div>
            )}
          </div>
        )}

        {typeof totalCount === "number" && !isLoading && (
          <p className="mb-5 text-xs text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">{totalCount}</span>{" "}
            {totalCount === 1 ? "entry" : "entries"}
          </p>
        )}

        {isLoading ? (
          <div className="space-y-4" role="status" aria-live="polite">
            <span className="section-label">Loading</span>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 border-b border-border pb-4">
                <div className="h-16 w-20 shrink-0 animate-pulse-soft rounded-md bg-surface-muted" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-24 animate-pulse-soft rounded-xs bg-surface-muted" />
                  <div className="h-4 w-3/4 animate-pulse-soft rounded-xs bg-surface-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div>{children}</div>
        )}

        {pagination && <div className="mt-10 border-t border-border pt-6">{pagination}</div>}
      </Container>
    </div>
  );
}
