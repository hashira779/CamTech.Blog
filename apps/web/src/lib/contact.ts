const EMAIL_RE = /^[^\s@<>"'`\\?&]+@[^\s@<>"'`\\?&]+\.[a-zA-Z0-9-]{2,63}$/;

/**
 * Validates a public contact/feedback email from runtime environment configuration.
 * Blocks control characters, HTML delimiters, and malformed values.
 */
export function parsePublicContactEmail(raw?: string | null): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 120) return null;
  if (!EMAIL_RE.test(trimmed)) return null;
  return trimmed;
}

export function getPublicContactEmail(): string | null {
  return parsePublicContactEmail(process.env.PUBLIC_CONTACT_EMAIL);
}

export function buildFeedbackMailto(email: string, subject = "CamTech.Blog Feedback"): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
