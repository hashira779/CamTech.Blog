import crypto from "node:crypto";
import { NextResponse } from "next/server";
import {
  checkCvTelegramRateLimit,
  handleTelegramMessageUpdate,
  resolveClientIp,
} from "@/lib/cv-telegram-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WEBHOOK_BYTES = 64 * 1024;

function verifySecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const ip = resolveClientIp(request);
  const configuredSecret = (process.env.TELEGRAM_CV_WEBHOOK_SECRET || "").trim();

  // Fail closed: never process webhook updates unless a webhook secret is configured and matches.
  if (!configuredSecret) {
    return NextResponse.json(
      { ok: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const headerSecret = request.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!verifySecret(headerSecret, configuredSecret)) {
    if (!checkCvTelegramRateLimit(`webhook-fail:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { ok: false },
        { status: 429, headers: { "Cache-Control": "no-store" } },
      );
    }
    return NextResponse.json(
      { ok: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { ok: false },
      { status: 415, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rawLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(rawLength) && rawLength > MAX_WEBHOOK_BYTES) {
    return NextResponse.json(
      { ok: false },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_WEBHOOK_BYTES) {
      return NextResponse.json(
        { ok: false },
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }
    const body = JSON.parse(text) as {
      message?: { text?: string; chat?: { id?: number | string } };
    };
    if (body?.message) {
      await handleTelegramMessageUpdate(body.message);
    }
  } catch {
    // Ignore malformed updates gracefully so Telegram does not retry storm
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
