import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <Container width="reading" className="animate-fade-in space-y-8 py-10">
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-2 rounded-lg border border-border bg-surface p-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        ))}
      </div>
    </Container>
  );
}
