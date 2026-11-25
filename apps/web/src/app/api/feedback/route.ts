import { NextResponse } from "next/server";
import { checkCvTelegramRateLimit, resolveClientIp } from "@/lib/cv-telegram-store";
import {
  getPublicContactEmail,
  isDuplicateFeedbackRecent,
  isFeedbackInboxConfigured,
  validateFeedbackPayload,
  verifyFeedbackChallenge,
} from "@/lib/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FEEDBACK_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const ip = resolveClientIp(request);

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "Unsupported content type." },
      { status: 415, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rawLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(rawLength) && rawLength > MAX_FEEDBACK_BODY_BYTES) {
    return NextResponse.json(
      { error: "Payload too large." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: Record<string, unknown>;
  try {
    const rawText = await request.text();
    if (Buffer.byteLength(rawText, "utf8") > MAX_FEEDBACK_BODY_BYTES) {
      return NextResponse.json(
        { error: "Payload too large." },
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }
    body = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid request JSON." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const challenge = typeof body.challenge === "string" ? body.challenge : "";
  const challengeResult = verifyFeedbackChallenge(challenge);
  if (!challengeResult.ok) {
    const message =
      challengeResult.reason === "too_fast"
        ? "Please pause a moment before submitting."
        : "Form session expired. Please refresh and try again.";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Protected email reveal mode (keeps personal email out of scrapable SSR HTML).
  if (body.action === "reveal_contact") {
    if (!checkCvTelegramRateLimit(`reveal:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute." },
        { status: 429, headers: { "Cache-Control": "no-store" } },
      );
    }
    const honeypot = typeof body.company_url === "string" ? body.company_url.trim() : "";
    if (honeypot) {
      return NextResponse.json({ email: null }, { status: 200, headers: { "Cache-Control": "no-store" } });
    }
    return NextResponse.json(
      { email: getPublicContactEmail() },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }

  // Strict per-IP + global submission caps against spam floods.
  if (
    !checkCvTelegramRateLimit(`feedback:${ip}`, 3, 15 * 60_000) ||
    !checkCvTelegramRateLimit("feedback:global", 30, 60 * 60_000)
  ) {
    return NextResponse.json(
      { error: "Too many feedback messages sent recently. Please try again later." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const validated = validateFeedbackPayload(body);
  if (!validated.ok) {
    if (validated.honeypot) {
      // Silently discard automated bot trap submissions cleanly without teaching bots.
      return NextResponse.json(
        { ok: true },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    }
    const reasonMap: Record<string, string> = {
      message_too_short: "Please enter at least 10 characters of feedback.",
      message_too_long: "Message cannot exceed 1,500 characters.",
      too_many_links: "Please include at most one link in your message.",
      invalid_reply_email: "Please enter a valid reply email address.",
    };
    return NextResponse.json(
      { error: reasonMap[validated.reason] || "Invalid feedback submission." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (isDuplicateFeedbackRecent(validated.message)) {
    return NextResponse.json(
      { error: "Duplicate message detected. Please wait before sending again." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!isFeedbackInboxConfigured()) {
    return NextResponse.json(
      { error: "Direct inbox delivery is not enabled on the server yet." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const botToken = (process.env.TELEGRAM_CV_BOT_TOKEN || "").trim();
  const chatId = (process.env.TELEGRAM_FEEDBACK_CHAT_ID || "").trim();
  const webhookUrl = (process.env.FEEDBACK_WEBHOOK_URL || "").trim();

  const summaryText = [
    `[CamTech Feedback] Topic: ${validated.topic}`,
    `Page: ${validated.pagePath}`,
    validated.name ? `From: ${validated.name}` : null,
    validated.replyEmail ? `Reply-To: ${validated.replyEmail}` : null,
    "---",
    validated.message,
  ]
    .filter(Boolean)
    .join("\n");

  let delivered = false;
  if (botToken && /^-?\d{5,20}$/.test(chatId)) {
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: summaryText,
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (tgRes.ok) delivered = true;
    } catch {
      delivered = false;
    }
  }

  if (!delivered && /^https:\/\//i.test(webhookUrl)) {
    try {
      const whRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: validated.topic,
          name: validated.name,
          replyEmail: validated.replyEmail,
          pagePath: validated.pagePath,
          message: validated.message,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (whRes.ok) delivered = true;
    } catch {
      delivered = false;
    }
  }

  if (!delivered) {
    return NextResponse.json(
      { error: "Could not deliver feedback right now. Please try again shortly." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
