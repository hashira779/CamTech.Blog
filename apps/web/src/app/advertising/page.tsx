import Link from "next/link";
import { Container } from "@/components/ui/container";

/**
 * Advertising.
 *
 * "Affiliate partnerships" was removed — there is no affiliate system in the
 * product — and the vague "supported by transparent advertising" is now the
 * accurate version: placements are labelled, editorial is separate, and the ad
 * slots only render when advertising is switched on in the site configuration.
 */
export default function AdvertisingPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <Container width="reading" className="pt-12 sm:pt-16">
        <p className="section-label text-accent">Commercial</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Advertising &amp; monetisation policy
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Advertising is kept separate from editorial decisions and is always labelled as
          advertising.
        </p>
        <div aria-hidden="true" className="mt-8 h-px bg-border" />
      </Container>

      <Container width="reading" as="article" className="pb-16 pt-10 sm:pb-20">
        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            How the site is funded
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            CamTech.Blog is supported by advertising. Editorial content and the free tools are
            the product; advertising pays for them and never shapes them. Ad slots are inactive
            unless advertising is enabled in the site configuration, and they are reserved as
            fixed-height blocks so the page never jumps under your cursor.
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Our advertising commitments
          </h2>
          <ul className="space-y-4 pl-5 text-base leading-relaxed text-foreground marker:text-muted-foreground">
            <li>
              <strong className="font-semibold">No deceptive placements.</strong> We never create
              fake download buttons, deceptive navigation links, or pop-up traps designed to force
              accidental clicks.
            </li>
            <li>
              <strong className="font-semibold">Clear labelling.</strong> All promotional
              placements are clearly demarcated with &ldquo;Advertisement&rdquo; or
              &ldquo;Sponsored&rdquo; badges.
            </li>
            <li>
              <strong className="font-semibold">Editorial independence.</strong> Advertisers have
              zero influence over editorial coverage, fact checking, or science and discovery
              evaluations.
            </li>
          </ul>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Questions about a placement
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            Partnership and placement enquiries go to{" "}
            <a href="mailto:editor@dailydiscovery.com" className="text-accent hover:text-foreground">
              editor@dailydiscovery.com
            </a>
            . What we will not publish at all — sponsored or otherwise — is set out in the{" "}
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
