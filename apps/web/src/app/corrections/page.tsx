import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";

/**
 * Corrections log.
 *
 * This page carried two fully invented correction entries — dates, article
 * slugs and editor names that are not in any data source, on a page whose whole
 * purpose is verifiable accountability. They are removed. There is no
 * corrections endpoint in the API yet, so the log renders honest and empty
 * until entries exist, and the route stays alive because the policy page and
 * article footers point at the process, not at this URL.
 */
export default function CorrectionsPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        width="reading"
        breadcrumbs={[{ label: "Corrections & retractions log" }]}
        eyebrow={<>Accountability</>}
        title={<>Corrections &amp; retractions log</>}
        description={<>CamTech.Blog is committed to accuracy. When a factual error appears in a summary, timeline or figure, we correct it and record it.</>}
      />

      <Container width="reading" as="article" className="pb-16 pt-10 sm:pb-20">
        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Found an error or inaccuracy?
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            If you believe a published report contains factual errors or requires context
            adjustment, send a correction request to our standards desk. Please provide the article
            URL, the specific text, and the primary source documentation that supports the change.
          </p>
          <p className="text-base leading-relaxed text-foreground">
            Email{" "}
            <a
              href="mailto:corrections@dailydiscovery.com?subject=%5BCorrection%20Request%5D"
              className="text-accent hover:text-foreground"
            >
              corrections@dailydiscovery.com
            </a>{" "}
            or use the{" "}
            <Link
              href="/contact?subject=Correction+Request"
              className="text-accent hover:text-foreground"
            >
              contact desk
            </Link>
            .
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Public correction history
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            No corrections are published yet. When one is issued, the correction note is added to
            the affected story and the change is recorded in the editorial audit log; corrections
            released for the public record are listed on this page.
          </p>
          <p className="text-base leading-relaxed text-foreground">
            The full process — verification, amendment, the visible note and how the change is
            logged — is set out in the{" "}
            <Link href="/corrections-policy" className="text-accent hover:text-foreground">
              corrections &amp; retraction policy
            </Link>
            .
          </p>
        </section>
      </Container>
    </div>
  );
}
