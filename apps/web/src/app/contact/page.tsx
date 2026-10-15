import Link from "next/link";
import { Container } from "@/components/ui/container";

/**
 * Contact.
 *
 * Same two desk addresses as before, now as real mail routes. Removed:
 * "Reach our dedicated teams", which implied a staff directory the site does
 * not publish — there are two routes, and they are shown as two routes.
 */
const desks = [
  {
    label: "General editorial desk",
    email: "editor@dailydiscovery.com",
    note: "For news coverage, story inquiries, and press releases.",
  },
  {
    label: "Corrections & fact checking",
    email: "corrections@dailydiscovery.com",
    note: "For reporting potential factual errors or broken attribution links.",
  },
];

export default function ContactPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <Container width="reading" className="pt-12 sm:pt-16">
        <p className="section-label text-accent">Contact</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Contact the newsroom
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Questions, press releases, factual tips and partnership enquiries all reach the newsroom
          through one of the two addresses below.
        </p>
        <div aria-hidden="true" className="mt-8 h-px bg-border" />
      </Container>

      <Container width="reading" as="article" className="pb-16 pt-6 sm:pb-20">
        <ul className="divide-y divide-border">
          {desks.map((desk) => (
            <li key={desk.email} className="py-8 first:pt-2 last:pb-2">
              <p className="section-label text-muted-foreground">{desk.label}</p>
              <a
                href={`mailto:${desk.email}`}
                className="mt-2 block font-display text-xl leading-snug tracking-tight text-foreground transition-colors hover:text-accent sm:text-2xl"
              >
                {desk.email}
              </a>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{desk.note}</p>
            </li>
          ))}
        </ul>

        <hr className="my-8 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-xl leading-snug tracking-tight text-foreground">
            Reporting an error in a story
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            Send the article URL, the specific wording, and the primary source that supports your
            correction to{" "}
            <a
              href="mailto:corrections@dailydiscovery.com?subject=%5BCorrection%20Request%5D"
              className="text-accent hover:text-foreground"
            >
              corrections@dailydiscovery.com
            </a>
            . The full process — verification, the correction note on the story, and how the
            change is recorded — is in the{" "}
            <Link href="/corrections-policy" className="text-accent hover:text-foreground">
              corrections policy
            </Link>
            .
          </p>

          <h2 className="pt-6 font-display text-xl leading-snug tracking-tight text-foreground">
            Working with us
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            Placement and partnership enquiries use the editorial address above. How advertising is
            kept away from coverage is described in the{" "}
            <Link href="/advertising" className="text-accent hover:text-foreground">
              advertising policy
            </Link>
            , and the publishers we draw stories from are listed in the{" "}
            <Link href="/sources" className="text-accent hover:text-foreground">
              source registry
            </Link>
            .
          </p>
        </section>
      </Container>
    </div>
  );
}
