import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DestinationDetailLoading() {
  return (
    <div className="animate-fade-in">
      <Skeleton className="h-[320px] w-full rounded-none sm:h-[420px]" />

      <Container className="space-y-12 py-10 sm:py-14">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2 rounded-xl border border-border bg-surface p-4">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-7 w-28 rounded" />
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-8 w-48 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="space-y-3 rounded-2xl border border-border bg-surface p-3 shadow-xs"
              >
                <Skeleton className="h-44 w-full rounded-xl" />
                <div className="space-y-2 p-1">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
