import * as React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { SearchBar } from "@/components/shared/search-bar";
import { EmptyState } from "@/components/shared/empty-state";

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
    <div className="min-h-screen py-6 sm:py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {/* Page Header */}
        <div className="mb-6 sm:mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {badge && <div className="mb-2">{badge}</div>}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h1>
              {description && (
                <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        {(searchPlaceholder || filterComponent) && (
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            {searchPlaceholder && (
              <div className="flex-1 max-w-md">
                <SearchBar placeholder={searchPlaceholder} />
              </div>
            )}
            {filterComponent && (
              <div className="flex items-center gap-2 flex-wrap">{filterComponent}</div>
            )}
          </div>
        )}

        {/* Result Count Bar */}
        {totalCount !== undefined && (
          <div className="mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{totalCount}</span> verified results
            </span>
          </div>
        )}

        {/* Content or Empty State */}
        {isEmpty ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div>{children}</div>
        )}

        {/* Pagination */}
        {pagination && <div className="mt-8 pt-4 flex justify-center">{pagination}</div>}
      </div>
    </div>
  );
}
