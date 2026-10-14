import { Skeleton } from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      <div className="space-y-4 pt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 space-y-2">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-3 w-32 rounded pt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
