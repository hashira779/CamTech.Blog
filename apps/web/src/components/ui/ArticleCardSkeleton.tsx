import * as React from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export interface ArticleCardSkeletonProps {
  compact?: boolean;
  className?: string;
  count?: number;
}

/**
 * Loading placeholder that matches the real card geometry, so the page does not
 * shift when data arrives. It mimics `standard` in shared/news-card.tsx:
 * 16/9 image, one mark, two headline lines, a summary line, a meta rule.
 */
export function SingleArticleCardSkeleton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <article
      aria-hidden="true"
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-xs",
        className
      )}
    >
      <Skeleton className="aspect-video w-full rounded-none" />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <Skeleton className="h-3 w-20" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        {!compact && (
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
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
