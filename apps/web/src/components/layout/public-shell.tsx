import * as React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumbs";
import { DESIGN_TOKENS } from "@/lib/tokens";

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
  const maxWidthClass = DESIGN_TOKENS.container[maxWidth];

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClass} ${className}`}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}

        {/* Page Header (if title exists) */}
        {title && (
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
        )}

        {/* Main Content Area */}
        <main>{children}</main>
      </div>
    </div>
  );
}
