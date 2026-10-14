import * as React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export interface ArticleCardSkeletonProps {
  compact?: boolean;
  className?: string;
  count?: number;
}

export function SingleArticleCardSkeleton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-200/80 dark:border-slate-800",
        className
      )}
    >
      {/* Thumbnail */}
      <Skeleton className="w-full aspect-[4/3] rounded-xl" />

      {/* Content */}
      <div className="space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          {/* Category & Badge */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>

          {/* Headline */}
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-5 w-full rounded" />
            <Skeleton className="h-5 w-4/5 rounded" />
          </div>

          {/* Summary */}
          {!compact && (
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-3/4 rounded" />
            </div>
          )}
        </div>

        {/* Footer Meta Row */}
        <div className="pt-3 flex items-center gap-2 border-t border-gray-100 dark:border-slate-800/80 mt-2">
          <Skeleton variant="circle" className="w-6 h-6" />
          <Skeleton className="h-3.5 w-24 rounded" />
          <span className="text-gray-300 dark:text-slate-700">•</span>
          <Skeleton className="h-3.5 w-16 rounded" />
        </div>
      </div>
    </article>
  );
}

export function ArticleCardSkeleton({
  compact = false,
  className,
  count = 1,
}: ArticleCardSkeletonProps) {
  if (count <= 1) {
    return <SingleArticleCardSkeleton compact={compact} className={className} />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <SingleArticleCardSkeleton
          key={idx}
          compact={compact}
          className={className}
        />
      ))}
    </>
  );
}

export default ArticleCardSkeleton;
