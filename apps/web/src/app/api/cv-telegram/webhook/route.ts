import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { handleTelegramMessageUpdate } from "@/lib/cv-telegram-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const configuredSecret = (process.env.TELEGRAM_CV_WEBHOOK_SECRET || "").trim();
  if (configuredSecret) {
    const headerSecret = request.headers.get("x-telegram-bot-api-secret-token") || "";
    if (!verifySecret(headerSecret, configuredSecret)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    const body = (await request.json()) as {
      message?: { text?: string; chat?: { id?: number | string } };
    };
    if (body?.message) {
      await handleTelegramMessageUpdate(body.message);
    }
  } catch {
    // Ignore malformed updates gracefully so Telegram does not retry storm
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
