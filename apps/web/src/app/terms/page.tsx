import Link from "next/link";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";

/**
 * Terms of service.
 *
 * Both clauses are kept as written — acceptance and use for informational
 * purposes, and the split between our own material and the publishers&rsquo; —
 * restyled into the reading column and cross-linked to the policies they depend
 * on.
 */
export default function TermsPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <PageHeader
        width="reading"
        breadcrumbs={[{ label: "Terms of service" }]}
        eyebrow={<>Legal</>}
        title={<>Terms of service</>}
      />

      <Container width="reading" as="article" className="pb-16 pt-10 sm:pb-20">
        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Using the site
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            By accessing CamTech.Blog, you agree to comply with these terms. The platform
            provides news summaries, original visual discoveries, and online utility calculators for
            educational and informational purposes.
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Intellectual property &amp; fair attribution
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            All original summaries, visual infographics, and proprietary tools are the property of
            CamTech.Blog. Primary news facts and third-party quotes remain the intellectual
            property of their respective originating publishers and are referenced under fair
            citation.
          </p>
          <p className="text-base leading-relaxed text-foreground">
            The publishers we cite are listed in the{" "}
            <Link href="/sources" className="text-accent hover:text-foreground">
              source registry
            </Link>
            , and the attribution rules we work to are in the{" "}
            <Link href="/editorial-policy" className="text-accent hover:text-foreground">
              editorial &amp; AI policy
            </Link>
            .
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Related policies
          </h2>
          <ul className="space-y-3 pl-5 text-base leading-relaxed text-foreground marker:text-muted-foreground">
            <li>
              <Link href="/privacy" className="text-accent hover:text-foreground">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/cookie-policy" className="text-accent hover:text-foreground">
                Cookie &amp; consent policy
              </Link>
            </li>
            <li>
              <Link href="/advertising" className="text-accent hover:text-foreground">
                Advertising &amp; monetisation policy
              </Link>
            </li>
            <li>
              <Link href="/content-standards" className="text-accent hover:text-foreground">
                Content standards &amp; integrity
              </Link>
            </li>
          </ul>
        </section>
      </Container>
    </div>
  );
}
