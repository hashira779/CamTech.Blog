import crypto from "node:crypto";

const EMAIL_RE = /^[^\s@<>"'`\\?&]+@[^\s@<>"'`\\?&]+\.[a-zA-Z0-9-]{2,63}$/;

export const FEEDBACK_MIN_ELAPSED_MS = 2500;
export const FEEDBACK_MAX_AGE_MS = 4 * 60 * 60 * 1000;
export const FEEDBACK_MAX_MESSAGE_CHARS = 1500;
export const FEEDBACK_MIN_MESSAGE_CHARS = 10;

export const ALLOWED_FEEDBACK_TOPICS = new Set([
  "cv-builder",
  "bug",
  "suggestion",
  "article",
  "other",
]);

const GLOBAL_FEEDBACK_KEY = "__camtech_feedback_runtime__";

type FeedbackRuntimeState = {
  fallbackSecret: string;
  recentHashes: Map<string, number>;
};

function getRuntimeState(): FeedbackRuntimeState {
  const host = globalThis as typeof globalThis & {
    [GLOBAL_FEEDBACK_KEY]?: FeedbackRuntimeState;
  };
  if (!host[GLOBAL_FEEDBACK_KEY]) {
    host[GLOBAL_FEEDBACK_KEY] = {
      fallbackSecret: crypto.randomBytes(32).toString("hex"),
      recentHashes: new Map(),
    };
  }
  return host[GLOBAL_FEEDBACK_KEY];
}

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

function getSigningSecret(overrideSecret?: string): string {
  if (overrideSecret) return overrideSecret;
  const envSecret = (
    process.env.TELEGRAM_CV_WEBHOOK_SECRET ||
    process.env.FEEDBACK_SIGNING_SECRET ||
    ""
  ).trim();
  if (envSecret) return envSecret;
  return getRuntimeState().fallbackSecret;
}

export function createFeedbackChallenge(
  nowMs: number = Date.now(),
  secret?: string,
): string {
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `${nowMs}.${nonce}`;
  const sig = crypto
    .createHmac("sha256", getSigningSecret(secret))
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyFeedbackChallenge(
  token: string,
  nowMs: number = Date.now(),
  secret?: string,
): { ok: boolean; reason?: string } {
  if (typeof token !== "string" || token.length < 20 || token.length > 200) {
    return { ok: false, reason: "invalid_challenge" };
  }
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "invalid_challenge" };

  const [issuedRaw, nonce, providedSig] = parts;
  const issuedAtMs = Number(issuedRaw);
  if (!Number.isSafeInteger(issuedAtMs) || !/^[a-f0-9]{16}$/.test(nonce)) {
    return { ok: false, reason: "invalid_challenge" };
  }

  const expectedSig = crypto
    .createHmac("sha256", getSigningSecret(secret))
    .update(`${issuedRaw}.${nonce}`)
    .digest("base64url");

  const a = Buffer.from(providedSig, "utf8");
  const b = Buffer.from(expectedSig, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: "invalid_challenge" };
  }

  const elapsed = nowMs - issuedAtMs;
  if (elapsed < FEEDBACK_MIN_ELAPSED_MS) {
    return { ok: false, reason: "too_fast" };
  }
  if (elapsed > FEEDBACK_MAX_AGE_MS) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true };
}

export function countUrlsInText(text: string): number {
  const matches = text.match(/\b(?:https?:\/\/|www\.)\S+/gi);
  return matches ? matches.length : 0;
}

export function validateFeedbackPayload(raw: unknown):
  | {
      ok: true;
      topic: string;
      name: string;
      replyEmail: string | null;
      message: string;
      pagePath: string;
    }
  | { ok: false; reason: string; honeypot?: boolean } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, reason: "invalid_body" };
  }
  const body = raw as Record<string, unknown>;

  // Silent bot trap: real users leave hidden honeypot field untouched.
  const honeypot = typeof body.company_url === "string" ? body.company_url.trim() : "";
  if (honeypot.length > 0) {
    return { ok: false, reason: "bot_detected", honeypot: true };
  }

  const rawMessage = typeof body.message === "string" ? body.message : "";
  const message = rawMessage.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (message.length < FEEDBACK_MIN_MESSAGE_CHARS) {
    return { ok: false, reason: "message_too_short" };
  }
  if (message.length > FEEDBACK_MAX_MESSAGE_CHARS) {
    return { ok: false, reason: "message_too_long" };
  }
  if (countUrlsInText(message) > 1) {
    return { ok: false, reason: "too_many_links" };
  }

  const rawTopic = typeof body.topic === "string" ? body.topic.trim().toLowerCase() : "other";
  const topic = ALLOWED_FEEDBACK_TOPICS.has(rawTopic) ? rawTopic : "other";

  const rawName = typeof body.name === "string" ? body.name : "";
  const name = rawName.replace(/[\r\n\t\x00-\x1F]+/g, " ").trim().slice(0, 80);

  const rawReply = typeof body.replyEmail === "string" ? body.replyEmail.trim() : "";
  let replyEmail: string | null = null;
  if (rawReply) {
    replyEmail = parsePublicContactEmail(rawReply);
    if (!replyEmail) {
      return { ok: false, reason: "invalid_reply_email" };
    }
  }

  const rawPage = typeof body.pagePath === "string" ? body.pagePath.trim() : "";
  const pagePath = /^\/[a-zA-Z0-9/_-]{0,100}$/.test(rawPage) ? rawPage : "/";

  return { ok: true, topic, name, replyEmail, message, pagePath };
}

export function isDuplicateFeedbackRecent(message: string, nowMs: number = Date.now()): boolean {
  const state = getRuntimeState();
  for (const [hash, ts] of state.recentHashes.entries()) {
    if (nowMs - ts > 10 * 60 * 1000) state.recentHashes.delete(hash);
  }
  const digest = crypto.createHash("sha256").update(message.toLowerCase()).digest("hex");
  if (state.recentHashes.has(digest)) return true;
  if (state.recentHashes.size >= 500) {
    const oldest = state.recentHashes.keys().next().value;
    if (oldest) state.recentHashes.delete(oldest);
  }
  state.recentHashes.set(digest, nowMs);
  return false;
}

export function isFeedbackInboxConfigured(): boolean {
  const botToken = (process.env.TELEGRAM_CV_BOT_TOKEN || "").trim();
  const chatId = (process.env.TELEGRAM_FEEDBACK_CHAT_ID || "").trim();
  const webhook = (process.env.FEEDBACK_WEBHOOK_URL || "").trim();
  return Boolean((botToken && /^-?\d{5,20}$/.test(chatId)) || /^https:\/\//i.test(webhook));
}
