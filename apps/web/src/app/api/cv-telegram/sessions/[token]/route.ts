import { NextResponse } from "next/server";
import {
  checkCvTelegramRateLimit,
  deleteCvSession,
  ensureTelegramPoller,
  getCvSessionStatus,
} from "@/lib/cv-telegram-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "local";
}

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const ip = clientIp(request);
  if (!checkCvTelegramRateLimit(`status:${ip}`, 120, 60_000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  ensureTelegramPoller();
  const { token } = await context.params;
  const info = getCvSessionStatus(token);
  return NextResponse.json(info, { status: 200, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const removed = deleteCvSession(token);
  return NextResponse.json({ removed }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
