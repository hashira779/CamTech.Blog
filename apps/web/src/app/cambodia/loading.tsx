import { Skeleton } from "@/components/ui/Skeleton";
import { ArticleCardSkeleton } from "@/components/ui/ArticleCardSkeleton";

export default function CategoryFeedLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Main Content (70%) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Header Banner */}
          <div className="border-b border-neutral-200 dark:border-neutral-800 pb-5 space-y-3">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-4 w-full max-w-xl rounded" />
          </div>

          {/* Featured Grid (2 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ArticleCardSkeleton count={2} />
          </div>

          {/* Latest Updates List */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8 space-y-6">
            <Skeleton className="h-6 w-36 rounded" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <Skeleton className="md:col-span-1 h-36 rounded-lg" />
                <div className="md:col-span-2 space-y-2.5">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-6 w-10/12 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-3 w-36 rounded pt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (30%) */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800 space-y-4">
            <Skeleton className="h-5 w-28 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1.5 py-1">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
