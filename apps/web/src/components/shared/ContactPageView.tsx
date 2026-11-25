"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, CheckCircle2, Mail, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { buildFeedbackMailto } from "@/lib/contact";
import { useI18n } from "@/lib/i18n";

/**
 * Private, anti-spam contact & feedback center in English and Khmer.
 * Never links everyday visitors to public GitHub Issues and never embeds
 * raw mailto addresses directly in initial HTML (protecting inboxes from scrapers).
 */
export function ContactPageView({
  challenge,
  inboxEnabled,
  hasProtectedEmail,
}: {
  challenge: string;
  inboxEnabled: boolean;
  hasProtectedEmail: boolean;
}) {
  const { lang } = useI18n();
  const isKm = lang === "km";
  const searchParams = useSearchParams();
  const initialTopic = searchParams?.get("topic") === "cv-builder" ? "cv-builder" : "suggestion";

  const [topic, setTopic] = useState(initialTopic);
  const [name, setName] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [message, setMessage] = useState("");
  const [companyUrl, setCompanyUrl] = useState(""); // invisible honeypot
  const [sending, setSending] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [sent, setSent] = useState(false);

  const [revealedEmail, setRevealedEmail] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setStatusError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge,
          company_url: companyUrl,
          topic,
          name,
          replyEmail,
          message,
          pagePath: topic === "cv-builder" ? "/cv-builder" : "/contact",
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !json.ok) {
        setStatusError(
          json.error ||
            (isKm
              ? "មិនអាចផ្ញើមតិកែលម្អបានទេ។ សូមពិនិត្យម្ដងទៀត។"
              : "Could not submit your feedback. Please review and try again."),
        );
        return;
      }
      setSent(true);
      setMessage("");
    } catch {
      setStatusError(
        isKm ? "បណ្ដាញមានបញ្ហា។ សូមសាកល្បងម្ដងទៀត។" : "Network error. Please try again shortly.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleRevealEmail() {
    if (revealing || revealedEmail) return;
    setRevealing(true);
    setStatusError("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reveal_contact",
          challenge,
          company_url: companyUrl,
        }),
      });
      const json = (await response.json().catch(() => ({}))) as { email?: string | null; error?: string };
      if (!response.ok) {
        setStatusError(json.error || "Please pause a moment and try again.");
        return;
      }
      if (json.email) {
        setRevealedEmail(json.email);
      }
    } catch {
      setStatusError(isKm ? "មិនអាចបង្ហាញអ៊ីមែលបានទេ។" : "Could not load email right now.");
    } finally {
      setRevealing(false);
    }
  }

  return (
    <div lang={isKm ? "km" : undefined}>
      <PageHeader
        width="reading"
        breadcrumbs={[{ label: isKm ? "ទំនាក់ទំនង" : "Contact" }]}
        eyebrow={isKm ? "មតិកែលម្អឯកជន · ការពារ Spam" : "Private feedback · Anti-spam protected"}
        title={isKm ? "ផ្ញើមតិកែលម្អមកយើង។" : "Share feedback privately."}
        description={
          isKm
            ? "រាយការណ៍បញ្ហា ស្នើគំរូ CV ថ្មី ឬផ្ញើមតិកែលម្អដោយមិនចាំបាច់មានគណនី និងមិនបង្ហាញជាសាធារណៈឡើយ។"
            : "Report an issue, suggest a CV template, or request a correction privately—no account required and never posted publicly."
        }
      />

      <Container width="reading" className="py-10 sm:py-14">
        {inboxEnabled && (
          <section className="field-contact-card" aria-labelledby="feedback-form-title">
            <MessageSquare size={24} strokeWidth={1.5} aria-hidden="true" />
            <p className="field-eyebrow">
              {isKm ? "ទម្រង់មតិកែលម្អឯកជន" : "Direct private feedback"}
            </p>
            <h2 id="feedback-form-title">
              {isKm ? "តើអ្នកចង់ប្រាប់អ្វីដល់ពួកយើង?" : "What would make CamTech better?"}
            </h2>

            {sent ? (
              <div className="mt-5 rounded-lg border border-border bg-surface-muted p-5" role="status">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 size={17} className="text-success" aria-hidden="true" />
                  {isKm ? "ទទួលបានមតិកែលម្អដោយជោគជ័យ!" : "Thank you — your feedback has been sent."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {isKm
                    ? "ក្រុមការងារយើងនឹងពិនិត្យមើលក្នុងពេលឆាប់ៗនេះ។"
                    : "Our team receives this directly and privately without exposing it publicly."}
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="field-button-secondary mt-4"
                >
                  {isKm ? "ផ្ញើមតិផ្សេងទៀត" : "Send another message"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
                {/* Hidden bot trap (honeypot) */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="fb-company-url">Leave empty</label>
                  <input
                    id="fb-company-url"
                    name="company_url"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs font-medium text-foreground">
                    <span>{isKm ? "ប្រធានបទ" : "Topic"}</span>
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="h-11 rounded-md border border-border-strong bg-background px-3 text-sm text-foreground"
                    >
                      <option value="cv-builder">
                        {isKm ? "កម្មវិធីបង្កើត CV" : "Free CV Builder"}
                      </option>
                      <option value="suggestion">
                        {isKm ? "ស្នើមុខងារថ្មី" : "Feature suggestion"}
                      </option>
                      <option value="bug">
                        {isKm ? "រាយការណ៍បញ្ហា" : "Bug report"}
                      </option>
                      <option value="article">
                        {isKm ? "កែតម្រូវអត្ថបទ" : "Article correction"}
                      </option>
                      <option value="other">{isKm ? "ផ្សេងៗ" : "Other"}</option>
                    </select>
                  </label>

                  <label className="grid gap-1.5 text-xs font-medium text-foreground">
                    <span>{isKm ? "ឈ្មោះរបស់អ្នក (ជាជម្រើស)" : "Your name (optional)"}</span>
                    <input
                      type="text"
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isKm ? "ឧ. សុខា" : "e.g. Sokha"}
                      className="h-11 rounded-md border border-border-strong bg-background px-3 text-sm text-foreground"
                    />
                  </label>
                </div>

                <label className="grid gap-1.5 text-xs font-medium text-foreground">
                  <span>
                    {isKm ? "អ៊ីមែលសម្រាប់ឆ្លើយតប (ជាជម្រើស)" : "Reply email (optional)"}
                  </span>
                  <input
                    type="email"
                    maxLength={120}
                    value={replyEmail}
                    onChange={(e) => setReplyEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="h-11 rounded-md border border-border-strong bg-background px-3 text-sm text-foreground"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-medium text-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span>{isKm ? "សារមតិកែលម្អ" : "Message"}</span>
                    <span className="text-[11px] font-normal text-muted-foreground tabular-nums">
                      {message.length}/1500
                    </span>
                  </div>
                  <textarea
                    required
                    minLength={10}
                    maxLength={1500}
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      isKm
                        ? "សូមសរសេរមតិកែលម្អ ឬបញ្ហាដែលអ្នកជួបប្រទះ..."
                        : "Share what worked well, what broke, or what you'd like added..."
                    }
                    className="rounded-md border border-border-strong bg-background p-3 text-sm text-foreground"
                  />
                </label>

                {statusError && (
                  <p className="text-xs font-medium text-destructive" role="alert">
                    {statusError}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ShieldCheck size={14} className="text-success" aria-hidden="true" />
                    {isKm
                      ? "ការពារប្រឆាំង Spam · មិនបង្ហាញជាសាធារណៈ"
                      : "Anti-spam protected · Never published publicly"}
                  </span>
                  <button type="submit" disabled={sending} className="field-button">
                    <Send size={15} aria-hidden="true" />
                    {sending
                      ? isKm
                        ? "កំពុងផ្ញើ..."
                        : "Sending..."
                      : isKm
                        ? "ផ្ញើមតិកែលម្អ"
                        : "Send feedback"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {hasProtectedEmail && (
          <section className={`field-contact-card ${inboxEnabled ? "mt-6" : ""}`}>
            <Mail size={24} strokeWidth={1.5} aria-hidden="true" />
            <p className="field-eyebrow">
              {isKm ? "អ៊ីមែលផ្ទាល់ · ការពារ Bot" : "Direct email · Scraper-protected"}
            </p>
            <h2>{isKm ? "ចង់ផ្ញើអ៊ីមែលដោយផ្ទាល់មែនទេ?" : "Prefer emailing directly?"}</h2>
            <p>
              {isKm
                ? "ដើម្បីការពារប្រឆាំង Spam យើងលាក់អាសយដ្ឋានអ៊ីមែលពី Bot រហូតដល់អ្នកចុចប៊ូតុងបង្ហាញខាងក្រោម។"
                : "To protect against automated spam scrapers, our direct contact address is revealed only after you click below."}
            </p>

            {revealedEmail ? (
              <a
                href={buildFeedbackMailto(revealedEmail, "CamTech.Blog Feedback")}
                className="field-button"
              >
                {revealedEmail} <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            ) : (
              <button
                type="button"
                onClick={handleRevealEmail}
                disabled={revealing}
                className="field-button-secondary"
              >
                <Mail size={15} aria-hidden="true" />
                {revealing
                  ? isKm
                    ? "កំពុងបើក..."
                    : "Verifying..."
                  : isKm
                    ? "បង្ហាញអ៊ីមែលទំនាក់ទំនង"
                    : "Reveal contact email"}
              </button>
            )}

            {!inboxEnabled && statusError && (
              <p className="mt-3 text-xs font-medium text-destructive" role="alert">
                {statusError}
              </p>
            )}
          </section>
        )}

        {!inboxEnabled && !hasProtectedEmail && (
          <section className="field-contact-card">
            <MessageSquare size={24} strokeWidth={1.5} aria-hidden="true" />
            <p className="field-eyebrow">{isKm ? "ទំនាក់ទំនង" : "Feedback desk"}</p>
            <h2>
              {isKm
                ? "ប្រអប់ទទួលមតិកំពុងត្រូវបានរៀបចំ។"
                : "Direct feedback inbox is currently being configured."}
            </h2>
            <p>
              {isKm
                ? "សូមអរគុណសម្រាប់ការចង់ចែករំលែកមតិកែលម្អ។ អ្នកគ្រប់គ្រងប្រព័ន្ធកំពុងតភ្ជាប់ប្រអប់ទទួលសារឯកជន។"
                : "Thank you for wanting to share feedback. Our maintainers keep feedback private instead of routing visitors to public issue trackers."}
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
