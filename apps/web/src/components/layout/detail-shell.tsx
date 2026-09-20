import * as React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/shared/breadcrumbs";

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
    <div className="min-h-screen py-6 sm:py-8">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {/* Hero Section if present */}
        {hero && <div className="mb-6 sm:mb-8">{hero}</div>}

        {/* Title and Action Bar */}
        <div className="mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              {badge && <div className="mb-2">{badge}</div>}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
          </div>
        </div>

        {/* Main Grid: Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <div className={`${sidebar ? "lg:col-span-8" : "lg:col-span-12"} space-y-8`}>
            {children}
          </div>

          {sidebar && (
            <aside className="lg:col-span-4 space-y-6">
              {sidebar}
            </aside>
          )}
        </div>

        {/* Related Content */}
        {relatedContent && (
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
            {relatedContent}
          </div>
        )}
      </div>
    </div>
  );
}
