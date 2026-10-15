import { Skeleton } from "@/components/ui/Skeleton";
import { Container } from "@/components/ui/container";

/**
 * Loading placeholder for the article page.
 *
 * It now mirrors `ArticleReader` exactly — letterhead in the reading measure, a
 * page-width hero, then body lines at the same measure — so nothing jumps when
 * the real story swaps in. The old skeleton also drew a rose pill, an avatar
 * circle and three share buttons that the finished page does not have.
 */
export function ArticleSkeleton() {
  return (
    <div aria-hidden="true" className="flex w-full flex-1 animate-fade-in flex-col">
      <Container width="reading" className="pt-6 pb-8 sm:pt-10">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-14" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-32" />
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Skeleton className="h-3.5 w-24" />
        </div>

        <div className="mt-4 space-y-3">
          <Skeleton className="h-9 w-full sm:h-11" />
          <Skeleton className="h-9 w-4/5 sm:h-11" />
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>
      </Container>

      <Container className="pb-8">
        <Skeleton className="aspect-video w-full rounded-2xl sm:rounded-3xl" />
      </Container>

      <Container width="reading" className="flex flex-col gap-5 pb-2 pt-4">
        <div className="space-y-2.5 rounded-lg border border-border bg-surface-muted p-5 sm:p-6">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
        </div>
      </Container>

      <Container width="reading" className="space-y-5 pb-16 pt-6">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-3/5" />
      </Container>
    </div>
  );
}
