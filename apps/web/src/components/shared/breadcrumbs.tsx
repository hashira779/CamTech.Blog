import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { DESIGN_TOKENS } from "@/lib/tokens";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap py-1">
        <li>
          <Link
            href="/"
            className="flex items-center hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            title="Home"
          >
            <Home size={DESIGN_TOKENS.iconSize.xs} className="mr-1" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-1.5">
              <ChevronRight size={DESIGN_TOKENS.iconSize.xs} className="text-slate-400 shrink-0" />
              {isLast || !item.href ? (
                <span
                  className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors truncate max-w-[150px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
