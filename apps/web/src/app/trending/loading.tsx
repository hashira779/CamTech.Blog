import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArticleCardSkeleton } from "@/components/ui/ArticleCardSkeleton";

export default function TrendingLoading() {
  return (
    <Container className="animate-fade-in space-y-8 py-10 sm:py-14">
      <div className="space-y-3 border-b border-border pb-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-4 w-96 max-w-full rounded" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ArticleCardSkeleton count={6} />
      </div>
    </Container>
  );
}
