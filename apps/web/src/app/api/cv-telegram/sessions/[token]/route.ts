import { NextResponse } from "next/server";
import {
  checkCvTelegramRateLimit,
  deleteCvSession,
  ensureTelegramPoller,
  getCvSessionStatus,
  isValidToken,
  resolveClientIp,
} from "@/lib/cv-telegram-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const ip = resolveClientIp(request);
  if (!checkCvTelegramRateLimit(`status:${ip}`, 120, 60_000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  ensureTelegramPoller();
  const { token } = await context.params;
  if (!isValidToken(token)) {
    return NextResponse.json(
      { status: "expired", expiresInSeconds: 0 },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  }
  const info = getCvSessionStatus(token);
  return NextResponse.json(info, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request, context: { params: Promise<{ token: string }> }) {
  const ip = resolveClientIp(request);
  if (!checkCvTelegramRateLimit(`delete:${ip}`, 60, 60_000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { token } = await context.params;
  if (!isValidToken(token)) {
    return NextResponse.json({ removed: false }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const removed = deleteCvSession(token);
  return NextResponse.json({ removed }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
