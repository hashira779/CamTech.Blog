import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function NewsLoading() {
  return (
    <Container className="py-12 space-y-8">
      <div className="space-y-3 border-b border-border pb-8">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <Skeleton className="h-80 w-full rounded-lg" />
          <div className="grid gap-6 sm:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    </Container>
  );
}
