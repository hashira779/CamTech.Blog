import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans antialiased min-h-screen">
      {/* 1. BREAKING NEWS TICKER SKELETON */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-4 w-96 rounded max-w-full" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 2. LEAD HERO EDITORIAL SKELETON */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-6 sm:p-10 space-y-5 flex flex-col justify-center order-2 lg:order-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24 rounded" />
                <span className="text-gray-300 dark:text-slate-700">•</span>
                <Skeleton className="h-4 w-32 rounded" />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-9 w-4/5 rounded-lg" />
              </div>

              <div className="space-y-2 pt-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-5/6 rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
              </div>

              <div className="pt-4 flex items-center gap-3 mt-auto">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 w-36 rounded" />
                <span className="text-gray-300 dark:text-slate-700">•</span>
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>

            <div className="order-1 lg:order-2 min-h-[320px] lg:min-h-[420px]">
              <Skeleton className="h-full w-full rounded-none min-h-[320px]" />
            </div>
          </div>
        </section>

        {/* 3. MAIN 70/30 GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: Main Stream (70%) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-gray-100 dark:border-slate-800">
              <Skeleton className="h-7 w-40 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>

            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-5"
                >
                  <Skeleton className="w-full sm:w-48 h-36 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-3 py-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Skeleton className="h-4 w-20 rounded" />
                        <Skeleton className="h-4 w-16 rounded" />
                      </div>
                      <Skeleton className="h-6 w-11/12 rounded mb-2" />
                      <Skeleton className="h-4 w-full rounded mb-1" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <Skeleton className="h-3 w-28 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (30%) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Trending Skeleton */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100 dark:border-slate-800">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-36 rounded" />
              </div>

              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <Skeleton className="h-7 w-6 rounded shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-24 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter Skeleton */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 space-y-3">
              <Skeleton className="h-6 w-32 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
