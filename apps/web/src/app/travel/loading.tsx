import { Skeleton } from "@/components/ui/Skeleton";

export default function TravelLoading() {
  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. HERO DESTINATION BANNER SKELETON */}
      <div className="relative w-full h-[360px] sm:h-[460px] bg-slate-200 dark:bg-slate-900 overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-20">
        {/* 2. ATTRACTIONS SECTION SKELETON */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-8 w-72 rounded-lg" />
              <Skeleton className="h-4 w-96 rounded max-w-full" />
            </div>
            <Skeleton className="h-5 w-28 rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 space-y-3 p-3 shadow-xs"
              >
                <Skeleton className="w-full h-44 rounded-xl" />
                <div className="space-y-2 p-1">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. PROVINCE HUBS SKELETON */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-8 w-64 rounded-lg" />
              <Skeleton className="h-4 w-80 rounded max-w-full" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
              <div
                key={n}
                className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/70 dark:border-slate-800 space-y-2.5 flex flex-col items-center text-center"
              >
                <Skeleton className="w-14 h-14 rounded-full" />
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
