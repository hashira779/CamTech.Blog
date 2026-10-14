import { Skeleton } from "@/components/ui/Skeleton";
import { ArticleCardSkeleton } from "@/components/ui/ArticleCardSkeleton";

export default function TrendingLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="space-y-2 pb-6 border-b border-gray-200 dark:border-slate-800">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded max-w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ArticleCardSkeleton count={6} />
      </div>
    </div>
  );
}
