import { Skeleton } from "@/components/ui/skeleton";

export default function TrendingLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="space-y-2 pb-6 border-b border-gray-200 dark:border-slate-800">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded max-w-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 space-y-4"
          >
            <Skeleton className="w-full h-44 rounded-xl" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <Skeleton className="h-6 w-11/12 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
