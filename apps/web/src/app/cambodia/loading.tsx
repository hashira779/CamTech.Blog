import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArticleCardSkeleton } from "@/components/ui/ArticleCardSkeleton";

export default function CategoryFeedLoading() {
  return (
    <Container className="animate-fade-in space-y-10 py-10 sm:py-14">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="space-y-10 lg:col-span-8">
          <div className="space-y-3 border-b border-border pb-5">
            <Skeleton className="h-10 w-64 rounded-lg" />
            <Skeleton className="h-4 w-full max-w-xl rounded" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ArticleCardSkeleton count={2} />
          </div>

          <div className="space-y-6 border-t border-border pt-8">
            <Skeleton className="h-6 w-36 rounded" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="grid grid-cols-1 items-center gap-5 md:grid-cols-3">
                <Skeleton className="h-36 rounded-lg md:col-span-1" />
                <div className="space-y-2.5 md:col-span-2">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-6 w-10/12 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-36 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8 lg:col-span-4">
          <div className="space-y-4 rounded-2xl border border-border bg-surface p-6">
            <Skeleton className="h-5 w-28 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2 py-1">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
