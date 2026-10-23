import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";

/**
 * Corrections policy.
 *
 * Same four-step process and the same request address. "Tamper-evident" is
 * dropped from the audit-log line: changes are written to the admin audit log,
 * which is real, but nothing in it is tamper-evident.
 */
export default function CorrectionsPolicyPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        width="reading"
        breadcrumbs={[{ label: "Corrections & retraction policy" }]}
        eyebrow={<>Accountability</>}
        title={<>Corrections &amp; retraction policy</>}
        description={<>CamTech.Blog is committed to accuracy. When factual errors occur, we correct them transparently and promptly.</>}
      />

      <Container width="reading" as="article" className="pb-16 pt-10 sm:pb-20">
        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Reporting an error
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            If you identify a factual inaccuracy, broken attribution link, misattributed quote, or
            outdated statistic in any article, please notify our editorial desk immediately at:
          </p>
          <div className="border-l-2 border-accent bg-accent-soft/60 p-5">
            <p className="font-mono text-sm leading-relaxed text-foreground">
              Email:{" "}
              <a
                href="mailto:corrections@dailydiscovery.com?subject=%5BCorrection%20Request%5D%20Article%20URL"
                className="text-accent hover:text-foreground"
              >
                corrections@dailydiscovery.com
              </a>
              <br />
              Subject: [Correction Request] Article URL
            </p>
          </div>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Correction process
          </h2>
          <ol className="space-y-4 pl-5 text-base leading-relaxed text-foreground marker:font-display marker:text-muted-foreground">
            <li>
              <strong className="font-semibold">Verification.</strong> An editor cross-checks the
              claim against primary documentation.
            </li>
            <li>
              <strong className="font-semibold">Update.</strong> The article text is modified
              directly.
            </li>
            <li>
              <strong className="font-semibold">Transparency note.</strong> A visible
              &ldquo;Correction Note&rdquo; is appended at the top or bottom of the article stating
              what was amended and the timestamp of the change.
            </li>
            <li>
              <strong className="font-semibold">Audit logging.</strong> All changes are recorded in
              our administrative audit log.
            </li>
          </ol>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Where corrections appear
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            The note itself lives on the corrected article. The{" "}
            <Link href="/corrections" className="text-accent hover:text-foreground">
              public corrections log
            </Link>{" "}
            lists the entries we publish for the record. The standards a correction is measured
            against are in the{" "}
            <Link href="/content-standards" className="text-accent hover:text-foreground">
              content standards
            </Link>{" "}
            and the{" "}
            <Link href="/editorial-policy" className="text-accent hover:text-foreground">
              editorial &amp; AI policy
            </Link>
            .
          </p>
        </section>
      </Container>
    </div>
  );
}
