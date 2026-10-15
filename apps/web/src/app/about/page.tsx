import Link from "next/link";
import { Container } from "@/components/ui/container";

/**
 * About.
 *
 * Cut: the three icon-card pitch blocks, "engineered to satisfy daily curiosity",
 * the founding-year and audience-reach claims, and "Tools are 100% functional" —
 * none of those are measurable from what the product does. Kept, in a reading
 * column: the attribution rule, the structured-summary format, the no-traps
 * promise and the mission question that closes the page.
 */
export default function AboutPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <Container width="reading" className="pt-12 sm:pt-16">
        <p className="section-label text-accent">Editorial transparency</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          About CamTech.Blog
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          A Cambodian news and travel publication: reporting from Phnom Penh and the provinces,
          world stories, travel guides, a daily quiz and everyday web tools — with every story
          credited to the publisher that reported it.
        </p>
        <div aria-hidden="true" className="mt-8 h-px bg-border" />
      </Container>

      <Container width="reading" as="article" className="pb-16 pt-10 sm:pb-20">
        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            What is here
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            <Link href="/cambodia" className="text-accent hover:text-foreground">
              Cambodia
            </Link>{" "}
            and{" "}
            <Link href="/world" className="text-accent hover:text-foreground">
              world
            </Link>{" "}
            reporting,{" "}
            <Link href="/travel" className="text-accent hover:text-foreground">
              travel guides
            </Link>{" "}
            for Cambodian destinations,{" "}
            <Link href="/discover" className="text-accent hover:text-foreground">
              explainers
            </Link>
            , a{" "}
            <Link href="/quiz" className="text-accent hover:text-foreground">
              daily quiz
            </Link>{" "}
            and{" "}
            <Link href="/tools" className="text-accent hover:text-foreground">
              utilities
            </Link>{" "}
            such as image compression, QR code generation and calculators.
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            How the reporting works
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            <strong className="font-semibold">Source attribution.</strong> We do not copy or
            republish complete articles from other publishers, and we do not hide where a story
            came from. Every item keeps a visible credit and a link back to the original report.
            The feeds and publishers the site draws on are listed in the{" "}
            <Link href="/sources" className="text-accent hover:text-foreground">
              source registry
            </Link>
            .
          </p>
          <p className="text-base leading-relaxed text-foreground">
            <strong className="font-semibold">Original editorial value.</strong> On top of the
            credit, each story adds our own structure: a summary of what happened, key points,
            why-it-matters context, timelines where they help, and an explicit separation of what
            is documented from what remains disputed.
          </p>
          <p className="text-base leading-relaxed text-foreground">
            <strong className="font-semibold">No traps.</strong> No fake download buttons,
            deceptive navigation or pop-ups designed to force a click. The tools run in your
            browser, so the files you drop into them never leave your device.
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Mission
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            Combining Cambodian and Southeast Asian coverage with international reporting, science
            explainers, factual quizzes and everyday utilities, the site answers one question:{" "}
            <em>why would a real person return tomorrow?</em> Clean, attributable and useful beats
            scraped and endless.
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            The rules we work to
          </h2>
          <ul className="space-y-3 pl-5 text-base leading-relaxed text-foreground marker:text-muted-foreground">
            <li>
              <Link href="/editorial-policy" className="text-accent hover:text-foreground">
                Editorial &amp; AI policy
              </Link>{" "}
              — how information is verified, attributed and reviewed.
            </li>
            <li>
              <Link href="/content-standards" className="text-accent hover:text-foreground">
                Content standards
              </Link>{" "}
              — what we will not publish.
            </li>
            <li>
              <Link href="/corrections-policy" className="text-accent hover:text-foreground">
                Corrections policy
              </Link>{" "}
              — how errors are fixed and recorded.
            </li>
            <li>
              <Link href="/contact" className="text-accent hover:text-foreground">
                Contact the newsroom
              </Link>{" "}
              — tips, press releases and partnership enquiries.
            </li>
          </ul>
        </section>
      </Container>
    </div>
  );
}
