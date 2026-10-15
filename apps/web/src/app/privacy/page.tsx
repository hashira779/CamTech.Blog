import Link from "next/link";
import { Container } from "@/components/ui/container";

/**
 * Privacy policy.
 *
 * Two collection claims were not true of the product and are removed: "reading
 * depth" (nothing measures scroll or completion) and "locally saved bookmarks"
 * (there is no bookmark feature). What is listed now maps to real behaviour:
 * article view counts, quiz attempts stored without an account, and the theme /
 * language / consent values kept in local storage.
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="flex w-full flex-1 flex-col">
      <Container width="reading" className="pt-12 sm:pt-16">
        <p className="section-label text-accent">Legal</p>
        <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          Privacy policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">Effective date: 1 January 2026</p>
        <div aria-hidden="true" className="mt-8 h-px bg-border" />
      </Container>

      <Container width="reading" as="article" className="pb-16 pt-10 sm:pb-20">
        <section className="space-y-4">
          <p className="text-base leading-relaxed text-foreground">
            CamTech.Blog (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;platform&rdquo;)
            respects user privacy. Our platform does not require registration merely to read news,
            take quizzes, or use online tools.
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Information we collect
          </h2>
          <ul className="space-y-4 pl-5 text-base leading-relaxed text-foreground marker:text-muted-foreground">
            <li>
              <strong className="font-semibold">Anonymous telemetry.</strong> Aggregated page views
              and anonymous quiz scores, used to improve editorial relevance.
            </li>
            <li>
              <strong className="font-semibold">Local browser storage.</strong> Theme preferences
              (dark/light), language preference (English/Khmer), and your cookie consent choice.
            </li>
            <li>
              <strong className="font-semibold">Online tools processing.</strong> File compression,
              QR code generation, and calculator inputs execute strictly client-side on your device
              without uploading files to our servers.
            </li>
          </ul>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Third-party analytics &amp; monetisation
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            We may partner with privacy-conscious analytics services and standard ad networks such
            as Google AdSense. Third-party vendors use cookies to serve ads based on prior visits.
            You may opt out of personalised advertising by visiting{" "}
            <a
              href="https://www.google.com/ads/settings"
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-accent underline-offset-4 hover:underline"
            >
              Google Ads Settings
            </a>
            .
          </p>
          <p className="text-base leading-relaxed text-foreground">
            The cookies and local values behind this are itemised in the{" "}
            <Link href="/cookie-policy" className="text-accent hover:text-foreground">
              cookie &amp; consent policy
            </Link>
            .
          </p>
        </section>

        <hr className="my-10 border-t border-border" />

        <section className="space-y-4">
          <h2 className="font-display text-2xl leading-snug tracking-tight text-foreground">
            Your choices
          </h2>
          <p className="text-base leading-relaxed text-foreground">
            Reading, quizzing and tool use need no account, so there is no profile to hand out.
            Theme, language and consent live only on your device and are removed when you clear the
            site&rsquo;s stored data. Questions about this policy go to the{" "}
            <Link href="/contact" className="text-accent hover:text-foreground">
              newsroom contact desk
            </Link>
            .
          </p>
        </section>
      </Container>
    </div>
  );
}
