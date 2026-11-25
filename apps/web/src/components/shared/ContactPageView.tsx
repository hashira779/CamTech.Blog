"use client";

import Link from "next/link";
import { ArrowUpRight, Mail, MessageSquare } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { buildFeedbackMailto } from "@/lib/contact";
import { useI18n } from "@/lib/i18n";

export function ContactPageView({ contactEmail }: { contactEmail: string | null }) {
  const { lang } = useI18n();
  const isKm = lang === "km";

  return (
    <div lang={isKm ? "km" : undefined}>
      <PageHeader
        width="reading"
        breadcrumbs={[{ label: isKm ? "ទំនាក់ទំនង" : "Contact" }]}
        eyebrow={isKm ? "មតិកែលម្អ និងកិច្ចសហការ" : "A conversation starts somewhere"}
        title={isKm ? "ផ្ញើមតិកែលម្អ ឬទាក់ទងមកយើង។" : "Let’s make something useful."}
        description={
          isKm
            ? "រាយការណ៍បញ្ហា ស្នើមុខងារថ្មី (ដូចជាគំរូ CV) ឬចែករំលែកការកែតម្រូវអត្ថបទជាមួយក្រុមការងារ CamTech។"
            : "Share a correction, suggest a useful feature, or send feedback about the CV Builder and CamTech tools."
        }
      />
      <Container width="reading" className="py-10 sm:py-14">
        {contactEmail ? (
          <section className="field-contact-card">
            <Mail size={25} strokeWidth={1.5} aria-hidden="true" />
            <p className="field-eyebrow">
              {isKm ? "មតិកែលម្អ និងកិច្ចសហការ" : "Feedback, editorial & partnerships"}
            </p>
            <h2>{isKm ? "ផ្ញើអ៊ីមែលមកយើងដោយផ្ទាល់។" : "Get in touch directly."}</h2>
            <p>
              {isKm
                ? "សូមភ្ជាប់តំណទំព័រ (URL) ប្រសិនបើអ្នករាយការណ៍បញ្ហា ឬកែតម្រូវព័ត៌មាន។ មិនចាំបាច់មានគណនី GitHub ឡើយ។"
                : "Include a page link when sharing feedback or corrections, or a brief note on what you need."}
            </p>
            <a
              href={buildFeedbackMailto(contactEmail, "CamTech.Blog Feedback")}
              className="field-button"
            >
              {contactEmail} <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </section>
        ) : (
          <section className="field-contact-card">
            <MessageSquare size={25} strokeWidth={1.5} aria-hidden="true" />
            <p className="field-eyebrow">
              {isKm ? "មតិកែលម្អ និងការកែតម្រូវ" : "Feedback & corrections"}
            </p>
            <h2>{isKm ? "ជួយធ្វើឱ្យ CamTech កាន់តែប្រសើរ។" : "Help make CamTech better."}</h2>
            <p>
              {isKm
                ? "អ្នកអាចរាយការណ៍មុខងារខូច ស្នើគំរូថ្មី ឬផ្ញើការកែតម្រូវតាមប្រព័ន្ធ GitHub Tracker។"
                : "You can report a broken feature, suggest an improvement, or share a correction through the project’s public GitHub tracker. Include the page link and the source for a factual correction."}
            </p>
            <a
              href="https://github.com/hashira779/CamTech.Blog/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="field-button"
            >
              {isKm ? "បើកផ្ទាំងផ្ញើមតិកែលម្អ" : "Open the feedback tracker"}{" "}
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <p className="text-xs">
              {isKm
                ? "ត្រូវការគណនី GitHub។ សូមកុំដាក់ពាក្យសម្ងាត់ ឬឯកសារឯកជនឡើយ។"
                : "GitHub account required. Reports are public; leave out passwords, private documents, and personal contact details."}
            </p>
          </section>
        )}

        <div className="field-values mt-10">
          <p>
            {isKm
              ? "អានអំពីវិធីដែលយើងដោះស្រាយការកែតម្រូវ និងស្តង់ដារខ្លឹមសារ។"
              : "Read how we handle corrections and what we expect from published content."}
          </p>
          <Link href="/corrections-policy" className="field-text-link">
            {isKm ? "គោលការណ៍កែតម្រូវ" : "Corrections policy"}{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </div>
  );
}
