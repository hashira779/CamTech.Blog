import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TravelLoading() {
  return (
    <div className="animate-fade-in">
      <Skeleton className="h-[360px] w-full rounded-none sm:h-[440px]" />

      <Container className="space-y-14 py-12">
        {[1, 2].map((section) => (
          <section key={section} className="space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div className="space-y-3">
                <Skeleton className="h-3.5 w-24 rounded" />
                <Skeleton className="h-9 w-72 rounded-lg" />
                <Skeleton className="h-4 w-96 max-w-full rounded" />
              </div>
              <Skeleton className="h-5 w-28 rounded" />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: section === 1 ? 8 : 4 }).map((_, n) => (
                <div
                  key={n}
                  className="space-y-3 rounded-2xl border border-border bg-surface p-3 shadow-xs"
                >
                  <Skeleton className="h-44 w-full rounded-xl" />
                  <div className="space-y-2 p-1">
                    <Skeleton className="h-5 w-3/4 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </Container>
    </div>
  );
}
