"use client";

import Link from "next/link";
import { ArrowUpRight, Calculator, FileText, Mail, MessageSquare, Newspaper } from "lucide-react";
import { buildFeedbackMailto } from "@/lib/contact";
import { useI18n } from "@/lib/i18n";

/**
 * Calm editorial next-step bridges & optional direct feedback strip shown below
 * the CV Builder studio so visitors can transition to career utilities or send feedback.
 * Zero ads rendered here; styled strictly with semantic design tokens.
 */
export function CvNextSteps({ feedbackEmail = null }: { feedbackEmail?: string | null }) {
  const { lang } = useI18n();
  const isKm = lang === "km";

  const items = [
    {
      href: "/tools/cambodia-salary-tax-calculator",
      eyebrow: isKm ? "ឧបករណ៍ការងារ" : "CAREER UTILITY",
      title: isKm ? "គណនាពន្ធលើប្រាក់បៀវត្សរ៍" : "Cambodia Salary Tax Calculator",
      desc: isKm
        ? "ប៉ាន់ស្មានប្រាក់ខែសុទ្ធ និងពន្ធតាមកាំប្រាក់បៀវត្សរ៍កម្ពុជា។"
        : "Estimate net take-home pay across Cambodian GDT salary tax brackets.",
      Icon: Calculator,
    },
    {
      href: "/tools/word-counter",
      eyebrow: isKm ? "សម្រាប់ Cover Letter" : "COVER LETTER",
      title: isKm ? "កម្មវិធីរាប់ពាក្យ & អក្សរ" : "Word & Character Counter",
      desc: isKm
        ? "ពិនិត្យប្រវែង Cover Letter និងអត្ថបទខ្លីមុនដាក់ពាក្យការងារ។"
        : "Keep cover letters and LinkedIn summaries concise before sending.",
      Icon: FileText,
    },
    {
      href: "/cambodia",
      eyebrow: isKm ? "អានបន្ថែម" : "CAMBODIA JOURNAL",
      title: isKm ? "ព័ត៌មានសេដ្ឋកិច្ច និងបច្ចេកវិទ្យា" : "Cambodia News & Insights",
      desc: isKm
        ? "តាមដានព័ត៌មានអាជីព បច្ចេកវិទ្យា និងសេដ្ឋកិច្ចនៅកម្ពុជា។"
        : "Stay current on Cambodia technology, career trends, and local business.",
      Icon: Newspaper,
    },
  ];

  return (
    <section className="mt-10 border-t border-border pt-8" aria-labelledby="cv-next-steps-title">
      <div className="mb-5">
        <p className="field-eyebrow">{isKm ? "ជំហានបន្ទាប់" : "Next after your CV"}</p>
        <h2 id="cv-next-steps-title" className="mt-2 font-display text-2xl font-medium tracking-tight text-foreground">
          {isKm ? "ត្រៀមខ្លួនដាក់ពាក្យការងារកាន់តែប្រសើរ" : "Helpful tools for your next application"}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {items.map(({ href, eyebrow, title, desc, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-all hover:border-border-strong hover:bg-surface-muted/40"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                <span className="field-eyebrow">{eyebrow}</span>
                <Icon size={16} className="shrink-0 text-accent" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-base font-semibold leading-snug text-foreground group-hover:text-accent">
                {title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
              {isKm ? "បើកមើល" : "Explore"} <ArrowUpRight size={14} aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted/50 px-5 py-4">
        <div className="flex items-start gap-3">
          {feedbackEmail ? (
            <Mail size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
          ) : (
            <MessageSquare size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {isKm
                ? "មានមតិកែលម្អ ឬចង់ស្នើគំរូ CV ថ្មីមែនទេ?"
                : "Have feedback or found something to improve?"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {feedbackEmail
                ? isKm
                  ? "ផ្ញើអ៊ីមែលមកយើងដោយផ្ទាល់ មិនចាំបាច់មានគណនីឡើយ។"
                  : "Send feedback directly—no account required."
                : isKm
                  ? "ចូលទៅទំព័រទំនាក់ទំនង ដើម្បីផ្ញើមតិកែលម្អមកក្រុមការងារយើង។"
                  : "Visit the contact page to send suggestions or report an issue."}
            </p>
          </div>
        </div>

        {feedbackEmail ? (
          <a
            href={buildFeedbackMailto(feedbackEmail, "CamTech CV Builder Feedback")}
            className="field-button-secondary"
          >
            {feedbackEmail} <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        ) : (
          <Link href="/contact" className="field-button-secondary">
            {isKm ? "ផ្ញើមតិកែលម្អ" : "Send feedback"} <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
    </section>
  );
}
