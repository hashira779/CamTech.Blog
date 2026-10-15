import { Container, Section } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Mirrors the homepage lead + latest/most-read rhythm so the swap from skeleton to
 * real content does not jump. Skeletons carry no colour decisions of their own —
 * every surface and line comes from the same tokens the page uses.
 */
export default function HomeLoading() {
  return (
    <div className="animate-fade-in">
      <Section className="pb-0 pt-8 sm:pt-10">
        <Container>
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-8">
              <Skeleton className="min-h-[20rem] w-full rounded-2xl" />
            </div>
            <div className="flex flex-col gap-6 lg:col-span-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-20 w-28 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="h-3.5 w-20 rounded" />
                    <Skeleton className="h-5 w-full rounded" />
                    <Skeleton className="h-3.5 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-6 lg:col-span-8">
              <div className="space-y-3">
                <Skeleton className="h-3.5 w-16 rounded" />
                <Skeleton className="h-8 w-56 rounded-lg" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-[16/9] w-full rounded-xl" />
                    <Skeleton className="h-3.5 w-20 rounded" />
                    <Skeleton className="h-6 w-11/12 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </div>
                ))}
              </div>
            </div>

            <aside className="space-y-6 lg:col-span-4">
              <div className="space-y-3">
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-8 w-44 rounded-lg" />
              </div>
              <div className="divide-y divide-border">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="flex gap-4 py-4">
                    <Skeleton className="h-6 w-6 shrink-0 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-16 rounded" />
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </div>
  );
}
