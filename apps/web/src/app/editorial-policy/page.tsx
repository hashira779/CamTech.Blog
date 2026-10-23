import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";

/**
 * Editorial & AI policy.
 *
 * Three sections, unchanged in substance. Two wording fixes: the review
 * checklist used to be counted out loud as a "13-point Quality Gate" — the
 * pipeline records a pass/fail checklist, not thirteen items — and the coloured
 * call-out box is now the same hairline section as everything else.
 */
export default function EditorialPolicyPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        width="reading"
        breadcrumbs={[{ label: "Editorial & AI policy" }]}
        eyebrow={<>Standards &amp; ethics</>}
        title={<>Editorial &amp; AI policy</>}
        description={<>How CamTech.Blog verifies information, attributes sources, uses artificial intelligence under human control, and keeps political reporting neutral.</>}
      />

      <Container width="reading" as="article" className="pb-16 pt-10 sm:pb-20">
        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            1. News gathering &amp; source attribution
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            CamTech.Blog does not copy or republish complete articles from other publishers. We
            respect copyright and terms of service. External news items are referenced through
            official RSS feeds, press releases, and wire services for discovery and verification.
          </p>
          <p className="text-base leading-relaxed text-foreground">
            Our journalists add genuine original value by producing concise summaries
            (&ldquo;What happened?&rdquo;), key bullet points, why-it-matters context, comparisons,
            timelines, and direct hyperlinks to original publishers. Source attribution is always
            prominent. The publishers we draw on are listed in the{" "}
            <Link href="/sources" className="text-accent hover:text-foreground">
              source registry
            </Link>
            .
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            2. Artificial intelligence policy
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            <strong className="font-semibold">AI must not automatically publish news.</strong> AI
            models may only assist human editors with draft summaries, entity extraction, category
            classification, and draft question generation.
          </p>
          <ul className="space-y-3 pl-5 text-base leading-relaxed text-foreground marker:text-muted-foreground">
            <li>
              We never invent quotes, statistics, casualties, official statements, names, or
              scientific claims.
            </li>
            <li>
              All AI-assisted drafts enter an internal review queue (labelled{" "}
              <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
                AI_DRAFT
              </code>
              ) and require manual human verification against primary sources.
            </li>
            <li>
              Every article passes a mandatory quality checklist before it is published.
            </li>
          </ul>
          <p className="text-base leading-relaxed text-foreground">
            The prohibitions that back this up are listed in the{" "}
            <Link href="/content-standards" className="text-accent hover:text-foreground">
              content standards
            </Link>
            .
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            3. Neutral political &amp; electoral coverage
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            The platform reports documented facts, attributes claims clearly (&ldquo;According to
            the ministry&hellip;&rdquo;, &ldquo;Reuters reported&hellip;&rdquo;), distinguishes
            reporting from analysis, and avoids political endorsements or fabricated polling.
          </p>
          <p className="text-base leading-relaxed text-foreground">
            For political stories, we separate &ldquo;What happened?&rdquo;, &ldquo;Who said
            what?&rdquo;, &ldquo;What is documented?&rdquo;, and &ldquo;What remains
            disputed?&rdquo;. CamTech.Blog is an information product, not a political persuasion
            mechanism.
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            When we get it wrong
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            Errors are handled through the{" "}
            <Link href="/corrections-policy" className="text-accent hover:text-foreground">
              corrections &amp; retraction policy
            </Link>
            . To raise one, use the{" "}
            <Link href="/contact" className="text-accent hover:text-foreground">
              contact desk
            </Link>
            .
          </p>
        </section>
      </Container>
    </div>
  );
}
