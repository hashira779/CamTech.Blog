import Link from "next/link";
import { Container } from "@/components/ui/container";

/**
 * Cookie & consent policy.
 *
 * The original text said preferences include "offline bookmarks". There is no
 * bookmark feature anywhere in the product, so that item is removed and the
 * list now matches what the site really keeps in your browser: theme, language
 * and the cookie consent choice.
 */
const stored = [
  {
    label: "Appearance",
    value: "Light or dark theme, chosen from the header.",
  },
  {
    label: "Language",
    value: "English or Khmer, so pages open in the language you last read.",
  },
  {
    label: "Consent choice",
    value: "Whether you accepted or declined optional cookies, recorded once per device.",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <Container width="reading" className="pt-12 sm:pt-16">
        <p className="section-label text-accent">Legal</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Cookie &amp; consent policy
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          What this site keeps in your browser, and what it does not.
        </p>
        <div aria-hidden="true" className="mt-8 h-px bg-border" />
      </Container>

      <Container width="reading" as="article" className="pb-16 pt-10 sm:pb-20">
        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            What we store
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            CamTech.Blog uses minimal cookies and local storage tokens, used to preserve your
            reading preferences. They stay on your device and are removed when you clear the
            site&rsquo;s browsing data.
          </p>

          <dl className="divide-y divide-border border-y border-border">
            {stored.map((item) => (
              <div key={item.label} className="py-4 sm:flex sm:items-baseline sm:gap-6">
                <dt className="section-label shrink-0 text-muted-foreground sm:w-40">
                  {item.label}
                </dt>
                <dd className="mt-1.5 text-base leading-relaxed text-foreground sm:mt-0">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Third parties
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            We do not deploy invasive third-party fingerprinting trackers. Standard cookies
            utilized by advertising providers (such as Google AdSense) are subject to your consent
            and browser cookie controls.
          </p>
          <p className="text-base leading-relaxed text-foreground">
            The consent banner appears the first time you open the site on a device and records
            your choice there; clearing the site&rsquo;s stored data shows it again. More detail on
            what is collected and why is in the{" "}
            <Link href="/privacy" className="text-accent hover:text-foreground">
              privacy policy
            </Link>
            ; how ad placements are labelled is in the{" "}
            <Link href="/advertising" className="text-accent hover:text-foreground">
              advertising policy
            </Link>
            .
          </p>
        </section>
      </Container>
    </div>
  );
}
