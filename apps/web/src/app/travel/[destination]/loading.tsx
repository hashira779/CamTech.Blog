import { Skeleton } from "@/components/ui/skeleton";

export default function DestinationDetailLoading() {
  return (
    <div className="min-h-screen pb-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 animate-fade-in">
      {/* 1. HERO BANNER SKELETON */}
      <div className="relative w-full h-[320px] sm:h-[420px] bg-slate-200 dark:bg-slate-900 overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-6 sm:p-12">
          <div className="space-y-3 max-w-3xl">
            <Skeleton className="h-5 w-32 rounded bg-white/20" />
            <Skeleton className="h-10 sm:h-14 w-80 rounded-lg bg-white/30" />
            <Skeleton className="h-4 w-full rounded bg-white/20" />
            <Skeleton className="h-4 w-3/4 rounded bg-white/20" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        {/* 2. STATS & QUICK INFO SKELETON */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-6 w-28 rounded" />
            </div>
          ))}
        </div>

        {/* 3. PLACES & ATTRACTIONS GRID SKELETON */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-7 w-48 rounded" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
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
        </div>
      </div>
    </div>
  );
}
