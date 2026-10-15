import Link from "next/link";
import { Container } from "@/components/ui/container";

/**
 * Content standards.
 *
 * The internal build-plan reference ("Section 61 Guidelines") is gone — readers
 * have no document to check it against — but the prohibition list and the
 * unverified-information rule are kept word for word.
 */
export default function ContentStandardsPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <Container width="reading" className="pt-12 sm:pt-16">
        <p className="section-label text-accent">Standards</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Content standards &amp; integrity
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          What may be published on CamTech.Blog, and what never may be.
        </p>
        <div aria-hidden="true" className="mt-8 h-px bg-border" />
      </Container>

      <Container width="reading" as="article" className="pb-16 pt-10 sm:pb-20">
        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Absolute prohibitions
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            CamTech.Blog maintains an absolute prohibition against:
          </p>
          <ul className="space-y-3 pl-5 text-base leading-relaxed text-foreground marker:text-muted-foreground">
            <li>Fabricated news, quotes, sources, or statistics.</li>
            <li>Misleading, emotionally manipulative, or deceptive headlines.</li>
            <li>Copied or scraped full articles presented as original reporting.</li>
            <li>Auto-published AI-generated text without human editorial review.</li>
            <li>Unauthorized copyrighted media without appropriate rights and attribution.</li>
          </ul>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Developing and disputed stories
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            Whenever information is disputed or subject to developing breaking conditions, it is
            explicitly identified as attributed or unverified until official confirmation is
            secured.
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Related policies
          </h2>
          <ul className="space-y-3 pl-5 text-base leading-relaxed text-foreground marker:text-muted-foreground">
            <li>
              <Link href="/editorial-policy" className="text-accent hover:text-foreground">
                Editorial &amp; AI policy
              </Link>{" "}
              — verification, attribution and the review queue.
            </li>
            <li>
              <Link href="/corrections-policy" className="text-accent hover:text-foreground">
                Corrections &amp; retraction policy
              </Link>{" "}
              — what happens when a published story breaches these standards.
            </li>
            <li>
              <Link href="/sources" className="text-accent hover:text-foreground">
                Source registry
              </Link>{" "}
              — the publishers and feeds the site draws on.
            </li>
          </ul>
        </section>
      </Container>
    </div>
  );
}
