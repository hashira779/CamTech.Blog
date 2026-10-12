import { Skeleton } from "@/components/ui/skeleton";

export function ArticleSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* 1. Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-12 rounded" />
        <span className="text-neutral-300 dark:text-neutral-700">/</span>
        <Skeleton className="h-3.5 w-16 rounded" />
        <span className="text-neutral-300 dark:text-neutral-700">/</span>
        <Skeleton className="h-3.5 w-24 rounded" />
      </div>

      {/* 2. Header & Headline Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-9 sm:h-11 w-full rounded-lg" />
          <Skeleton className="h-9 sm:h-11 w-4/5 rounded-lg" />
        </div>

        <Skeleton className="h-5 w-11/12 rounded pt-1" />

        {/* Metadata & Author Row Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      {/* 3. Hero Featured Image Skeleton */}
      <div className="w-full h-[280px] sm:h-[420px] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-900">
        <Skeleton className="w-full h-full rounded-2xl" />
      </div>

      {/* 4. Key Takeaways Box Skeleton */}
      <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 space-y-3">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </div>

      {/* 5. Article Paragraph Lines Skeleton */}
      <div className="space-y-4 pt-2">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-11/12 rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
        
        <div className="py-2" />

        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
      </div>
    </div>
  );
}
