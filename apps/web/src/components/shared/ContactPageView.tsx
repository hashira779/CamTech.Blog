"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Flag,
  Lock,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import {
  ALLOWED_FEEDBACK_TOPICS,
  FEEDBACK_MAX_MESSAGE_CHARS,
  FEEDBACK_MIN_MESSAGE_CHARS,
} from "@/lib/contact";
import { useI18n } from "@/lib/i18n";

interface ContactPageViewProps {
  challenge: string;
  hasProtectedEmail: boolean;
}

interface TopicMeta {
  value: string;
  en: string;
  km: string;
}

const TOPICS: TopicMeta[] = [
  { value: "bug", en: "Broken page / Bug", km: "ទំព័រមានបញ្ហា / កំហុស" },
  { value: "cv-builder", en: "CV Builder", km: "កម្មវិធីបង្កើត CV" },
  { value: "article", en: "Article correction", km: "កែតម្រូវអត្ថបទ" },
  { value: "travel", en: "Travel guide", km: "មគ្គុទ្ទេសក៍ទេសចរណ៍" },
  { value: "tools", en: "Tools", km: "ឧបករណ៍" },
  { value: "suggestion", en: "Idea / Request", km: "សំណូមពរ / គំនិតថ្មី" },
  { value: "other", en: "Other", km: "ផ្សេងៗ" },
];

function sanitizePagePath(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  let candidate = trimmed;
  if (/^https?:\/\//i.test(candidate)) {
    try {
      candidate = new URL(candidate).pathname;
    } catch {
      return "";
    }
  } else if (!candidate.startsWith("/") && /^[a-z0-9.-]+\.[a-z]{2,}\//i.test(candidate)) {
    const slash = candidate.indexOf("/");
    candidate = slash >= 0 ? candidate.slice(slash) : "/";
  }

  if (/^\/[a-zA-Z0-9/_-]{0,100}$/.test(candidate)) {
    return candidate;
  }
  return "";
}

export function ContactPageView({
  challenge,
  hasProtectedEmail,
}: ContactPageViewProps) {
  const { lang } = useI18n();
  const isKm = lang === "km";
  const searchParams = useSearchParams();

  const initialTopic = useMemo(() => {
    const raw = (searchParams.get("topic") || "").trim().toLowerCase();
    return ALLOWED_FEEDBACK_TOPICS.has(raw) ? raw : "bug";
  }, [searchParams]);

  const initialPage = useMemo(() => {
    return sanitizePagePath(searchParams.get("page"));
  }, [searchParams]);

  const [topic, setTopic] = useState<string>(initialTopic);
  const [pagePathInput, setPagePathInput] = useState<string>(initialPage);
  const [name, setName] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [message, setMessage] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [errorCode, setErrorCode] = useState<"" | "min_chars" | "max_chars" | "network" | "submit_failed" | "reveal_failed">("");
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);
  const [submittedTopic, setSubmittedTopic] = useState<string>(initialTopic);
  const [submittedPage, setSubmittedPage] = useState<string>(initialPage);
  const [revealedEmail, setRevealedEmail] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  const selectedTopicLabel = useMemo(() => {
    const found = TOPICS.find((item) => item.value === (sent ? submittedTopic : topic));
    if (!found) return topic;
    return isKm ? found.km : found.en;
  }, [isKm, sent, submittedTopic, topic]);

  const trimmedLength = message.trim().length;
  const charCountInvalid = trimmedLength > FEEDBACK_MAX_MESSAGE_CHARS;

  const statusError = useMemo(() => {
    if (serverError) return serverError;
    if (errorCode === "min_chars") {
      return isKm
        ? `សូមសរសេរយ៉ាងតិច ${FEEDBACK_MIN_MESSAGE_CHARS} តួអក្សរ។`
        : `Please enter at least ${FEEDBACK_MIN_MESSAGE_CHARS} characters so we can act on it.`;
    }
    if (errorCode === "max_chars") {
      return isKm
        ? `សារមិនអាចលើសពី ${FEEDBACK_MAX_MESSAGE_CHARS} តួអក្សរបានទេ។`
        : `Message cannot exceed ${FEEDBACK_MAX_MESSAGE_CHARS} characters.`;
    }
    if (errorCode === "network") {
      return isKm
        ? "បណ្តាញមានបញ្ហា។ សូមព្យាយាមម្តងទៀត។"
        : "Network error while sending. Please check your connection and try again.";
    }
    if (errorCode === "submit_failed") {
      return isKm
        ? "មិនអាចផ្ញើមតិកែលម្អបានទេនៅពេលនេះ។ សូមព្យាយាមម្តងទៀត។"
        : "Could not submit feedback right now. Please try again.";
    }
    if (errorCode === "reveal_failed") {
      return isKm
        ? "មិនអាចបង្ហាញអ៊ីមែលបានទេ។"
        : "Could not load direct email right now.";
    }
    return "";
  }, [errorCode, isKm, serverError]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorCode("");
    setServerError("");

    const trimmed = message.trim();
    if (trimmed.length < FEEDBACK_MIN_MESSAGE_CHARS) {
      setErrorCode("min_chars");
      return;
    }

    if (trimmed.length > FEEDBACK_MAX_MESSAGE_CHARS) {
      setErrorCode("max_chars");
      return;
    }

    const resolvedPage =
      sanitizePagePath(pagePathInput) ||
      (topic === "cv-builder" ? "/cv-builder" : initialPage || "/");

    setSending(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge,
          topic,
          name: name.trim(),
          replyEmail: replyEmail.trim(),
          pagePath: resolvedPage,
          message: trimmed,
          company_url: companyUrl,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok) {
        if (data.error) {
          setServerError(data.error);
        } else {
          setErrorCode("submit_failed");
        }
        return;
      }

      setSubmittedTopic(topic);
      setSubmittedPage(resolvedPage);
      setSent(true);
      setMessage("");
    } catch {
      setErrorCode("network");
    } finally {
      setSending(false);
    }
  }

  async function handleRevealEmail() {
    if (revealedEmail || revealing) return;
    setRevealing(true);
    setErrorCode("");
    setServerError("");
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
      const data = (await response.json().catch(() => ({}))) as {
        email?: string | null;
        error?: string;
      };
      if (!response.ok) {
        setServerError(data.error || "Please wait a moment before revealing email.");
        return;
      }
      if (data.email) {
        setRevealedEmail(data.email);
      }
    } catch {
      setErrorCode("reveal_failed");
    } finally {
      setRevealing(false);
    }
  }

  return (
    <Container className="field-contact-page">
      <nav aria-label="Breadcrumb" className="field-contact-breadcrumb">
        <Link href="/">{isKm ? "ទំព័រដើម" : "Home"}</Link>
        <span aria-hidden="true">/</span>
        <span>{isKm ? "រាយការណ៍ និងទំនាក់ទំនង" : "Report & Contact"}</span>
      </nav>

      <header className="field-contact-hero">
        <p className="field-eyebrow">
          {isKm
            ? "រាយការណ៍ទូទាំងគេហទំព័រ · ការពារសារឥតបានការ"
            : "WHOLE-SITE FEEDBACK · ANTI-SPAM PROTECTED"}
        </p>
        <h1>
          {isKm
            ? "រាយការណ៍បញ្ហា ឬផ្ញើមតិកែលម្អដោយឯកជន។"
            : "Report an issue or share feedback privately."}
        </h1>
        <p className="field-contact-lead">
          {isKm
            ? "ជួបតំណខូច បញ្ហាលើទូរស័ព្ទ ចំណុចឆ្គងនៅលើ CV Builder ឬទិន្នន័យខុស? សូមប្រាប់ពួកយើងនៅទីនេះ — មិនបាច់បង្កើតគណនី និងមិនបង្ហាញជាសាធារណៈឡើយ។"
            : "Spot a broken button, mobile layout glitch, CV Builder issue, or article correction anywhere on CamTech? Send it straight to the editors—no account required and never posted publicly."}
        </p>
      </header>

      <div className="field-contact-layout">
        <section className="field-contact-card" aria-labelledby="feedback-form-heading">
          {sent ? (
            <div className="field-contact-success">
              <div className="field-contact-success-icon" aria-hidden="true">
                <CheckCircle2 size={24} />
              </div>
              <p className="field-eyebrow">
                {isKm ? "បានទទួលរួចរាល់" : "REPORT RECEIVED"}
              </p>
              <h2 id="feedback-form-heading">
                {isKm
                  ? "អរគុណសម្រាប់ការរាយការណ៍របស់អ្នក!"
                  : "Thank you — your report has been logged."}
              </h2>
              <p className="field-contact-copy">
                {isKm
                  ? "ក្រុមការងាររបស់យើងបានទទួលសារនេះនៅក្នុងប្រព័ន្ធឯកជនរួចហើយ។ ប្រសិនបើអ្នកបានដាក់អ៊ីមែល យើងនឹងឆ្លើយតបទៅអ្នកវិញនៅពេលកែរួច។"
                  : "Our maintainers received this privately in the review inbox. If you included a reply email, we will follow up once it is checked."}
              </p>

              <dl className="field-contact-summary">
                <div>
                  <dt>{isKm ? "ប្រភេទ" : "Category"}</dt>
                  <dd>{selectedTopicLabel}</dd>
                </div>
                <div>
                  <dt>{isKm ? "ទំព័រ" : "Page"}</dt>
                  <dd>{submittedPage || "/"}</dd>
                </div>
              </dl>

              <div className="field-contact-success-actions">
                {submittedPage && submittedPage !== "/contact" && (
                  <Link href={submittedPage} className="field-button">
                    <ArrowLeft size={14} aria-hidden="true" />
                    {isKm ? "ត្រឡប់ទៅទំព័រដើមវិញ" : "Return to previous page"}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setErrorCode("");
                    setServerError("");
                  }}
                  className={
                    submittedPage && submittedPage !== "/contact"
                      ? "field-button-secondary"
                      : "field-button"
                  }
                >
                  {isKm ? "ផ្ញើរបាយការណ៍មួយទៀត" : "Send another report"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="field-contact-form">
              <div className="field-contact-form-head">
                <div>
                  <p className="field-eyebrow">
                    {isKm ? "ទម្រង់រាយការណ៍ឯកជន" : "PRIVATE REPORT DESK"}
                  </p>
                  <h2 id="feedback-form-heading">
                    {isKm ? "ផ្ញើសារដោយផ្ទាល់" : "Send a note directly"}
                  </h2>
                </div>
                <span className="field-contact-badge">
                  <ShieldCheck size={13} aria-hidden="true" />
                  {isKm ? "ឯកជន ១០០%" : "Private inbox"}
                </span>
              </div>

              {statusError && (
                <div role="alert" className="field-contact-alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>{statusError}</span>
                </div>
              )}

              <div className="field-form-group">
                <span id="feedback-topic-label" className="field-label">
                  {isKm ? "១. តើអ្នកចង់រាយការណ៍អំពីអ្វី?" : "1. What is this about?"}
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="feedback-topic-label"
                  className="field-topic-group"
                >
                  {TOPICS.map((item) => {
                    const active = topic === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setTopic(item.value)}
                        className="field-topic-chip"
                      >
                        {isKm ? item.km : item.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="field-form-grid">
                <div className="field-form-group">
                  <label htmlFor="feedback-page-path" className="field-label">
                    {isKm ? "ទំព័រដែលមានបញ្ហា (ជម្រើស)" : "Affected page (optional)"}
                  </label>
                  <input
                    id="feedback-page-path"
                    type="text"
                    value={pagePathInput}
                    onChange={(event) => setPagePathInput(event.target.value)}
                    placeholder={isKm ? "/cv-builder ឬ /travel" : "/cv-builder or /travel"}
                    className="field-input"
                  />
                </div>

                <div className="field-form-group">
                  <label htmlFor="feedback-name" className="field-label">
                    {isKm ? "ឈ្មោះរបស់អ្នក (ជម្រើស)" : "Your name (optional)"}
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    maxLength={80}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={isKm ? "ឈ្មោះហៅក្រៅ ឬមិនបាច់ដាក់" : "Anonymous or your name"}
                    className="field-input"
                  />
                </div>
              </div>

              <div className="field-form-group">
                <label htmlFor="feedback-reply-email" className="field-label">
                  {isKm
                    ? "អ៊ីមែលសម្រាប់ទទួលការឆ្លើយតប (ជម្រើស)"
                    : "Reply email if you want an update (optional)"}
                </label>
                <input
                  id="feedback-reply-email"
                  type="email"
                  maxLength={120}
                  value={replyEmail}
                  onChange={(event) => setReplyEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="field-input"
                />
              </div>

              <div className="field-form-group">
                <div className="field-label-row">
                  <label htmlFor="feedback-message" className="field-label">
                    {isKm ? "២. សារលម្អិត *" : "2. Details *"}
                  </label>
                  <span
                    className={
                      charCountInvalid
                        ? "field-char-counter field-char-counter-over"
                        : "field-char-counter"
                    }
                  >
                    {trimmedLength} / {FEEDBACK_MAX_MESSAGE_CHARS}
                  </span>
                </div>
                <textarea
                  id="feedback-message"
                  rows={5}
                  required
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={
                    isKm
                      ? "សូមរៀបរាប់ពីបញ្ហា ឧបករណ៍ដែលអ្នកប្រើ (ទូរស័ព្ទ ឬកុំព្យូទ័រ) ឬអ្វីដែលគួរកែលម្អ..."
                      : "Describe what felt broken, hard to read, or missing—and whether you are on phone or desktop..."
                  }
                  className="field-textarea"
                />
              </div>

              {/* Hidden honeypot input silently discards automated spam submissions. */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="feedback-company-url">Company website</label>
                <input
                  id="feedback-company-url"
                  type="text"
                  name="company_url"
                  tabIndex={-1}
                  autoComplete="off"
                  value={companyUrl}
                  onChange={(event) => setCompanyUrl(event.target.value)}
                />
              </div>

              <div className="field-contact-submit-row">
                <button
                  type="submit"
                  disabled={sending}
                  className="field-button"
                >
                  <Send size={14} aria-hidden="true" />
                  {sending
                    ? isKm
                      ? "កំពុងផ្ញើ..."
                      : "Sending..."
                    : isKm
                      ? "ផ្ញើរបាយការណ៍"
                      : "Send feedback"}
                </button>
                <p className="field-contact-hint">
                  {isKm
                    ? "អនុញ្ញាតឱ្យភ្ជាប់តំណយ៉ាងច្រើន ១ ដើម្បីការពារសារឥតបានការ។"
                    : "No sign-up needed · Up to 1 link allowed to prevent spam."}
                </p>
              </div>
            </form>
          )}
        </section>

        <aside className="field-contact-sidebar" aria-label={isKm ? "ព័ត៌មានបន្ថែម" : "Helpful notes"}>
          <div className="field-contact-sidecard">
            <Flag size={18} aria-hidden="true" />
            <p className="field-eyebrow">
              {isKm ? "អ្វីដែលជួយយើងកែបានលឿន" : "WHAT HELPS MOST"}
            </p>
            <h3>
              {isKm
                ? "រាយការណ៍គ្រប់ទំព័រទាំងអស់"
                : "Covers the whole website"}
            </h3>
            <ul>
              <li>
                {isKm
                  ? "បញ្ហា UI/UX ឬអត្ថបទខុសទំហំលើទូរស័ព្ទ ឬកុំព្យូទ័រ"
                  : "UI/UX rough edges, clipped text, or mobile spacing bugs"}
              </li>
              <li>
                {isKm
                  ? "គំរូ CV ឬការនាំចេញ PDF / DOCX ក្នុងកម្មវិធី CV Builder"
                  : "CV Builder templates, Khmer font wrapping, or PDF export"}
              </li>
              <li>
                {isKm
                  ? "តម្លៃប្តូរប្រាក់ តំណខូច ឬព័ត៌មានទេសចរណ៍ហួសសម័យ"
                  : "Outdated Cambodia travel details, broken links, or tools"}
              </li>
            </ul>
          </div>

          <div className="field-contact-sidecard">
            <Lock size={18} aria-hidden="true" />
            <p className="field-eyebrow">
              {isKm ? "សុវត្ថិភាព និងអ៊ីមែល" : "PRIVACY & DIRECT EMAIL"}
            </p>
            <h3>
              {isKm
                ? "ឯកជនភាពជាអាទិភាព"
                : "Kept off public trackers"}
            </h3>
            <p>
              {isKm
                ? "របាយការណ៍ទាំងអស់ត្រូវបានផ្ទុកដោយឯកជនសម្រាប់ក្រុមការងារតែប៉ុណ្ណោះ មិនបង្ហាញលើ GitHub សាធារណៈទេ។"
                : "Messages go straight to CamTech maintainers—never posted publicly or exposed to issue-tracker scrapers."}
            </p>

            {hasProtectedEmail && (
              <div className="field-reveal-box">
                {revealedEmail ? (
                  <a
                    href={`mailto:${revealedEmail}?subject=${encodeURIComponent("CamTech.Blog Feedback")}`}
                    className="field-button-secondary"
                  >
                    <Mail size={14} aria-hidden="true" />
                    {revealedEmail}
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled={revealing}
                    onClick={handleRevealEmail}
                    className="field-button-secondary"
                  >
                    <Mail size={14} aria-hidden="true" />
                    {revealing
                      ? isKm
                        ? "កំពុងបើក..."
                        : "Loading..."
                      : isKm
                        ? "បង្ហាញអ៊ីមែលផ្ទាល់"
                        : "Reveal direct email"}
                  </button>
                )}
              </div>
            )}

            <div className="field-side-links">
              <Link href="/editorial-policy">
                {isKm ? "គោលការណ៍កែតម្រូវ" : "Corrections policy"}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
              <Link href="/privacy">
                {isKm ? "គោលការណ៍ឯកជនភាព" : "Privacy policy"}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
