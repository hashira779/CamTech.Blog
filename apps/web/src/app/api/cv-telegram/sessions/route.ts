import { NextResponse } from "next/server";
import {
  buildTelegramDeepLink,
  checkCvTelegramRateLimit,
  CV_MAX_PDF_BYTES,
  CV_SESSION_TTL_MS,
  ensureTelegramPoller,
  isPdfMagicHeader,
  isValidSessionId,
  resolveBotUsername,
  upsertCvSession,
} from "@/lib/cv-telegram-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "local";
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!checkCvTelegramRateLimit(`upload:${ip}`, 25, 60_000)) {
    return NextResponse.json(
      { error: "Too many export attempts. Please wait a minute and try again." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const botUsername = await resolveBotUsername();
  if (!botUsername) {
    return NextResponse.json(
      { error: "Telegram bot delivery is not configured on this server." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form request." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const sessionId = String(formData.get("session_id") || "").trim();
  const fileName = String(formData.get("file_name") || "CV_CamTech.pdf").trim();
  const templateName = String(formData.get("template_name") || "CV").trim();
  const languageLabel = String(formData.get("language") || "EN").trim();
  const pdfEntry = formData.get("pdf");

  if (!isValidSessionId(sessionId)) {
    return NextResponse.json(
      { error: "Invalid browser session identifier." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!(pdfEntry instanceof File) || pdfEntry.size <= 0 || pdfEntry.size > CV_MAX_PDF_BYTES) {
    return NextResponse.json(
      { error: "PDF file must be non-empty and under 5 MB." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const pdfBytes = new Uint8Array(await pdfEntry.arrayBuffer());
  if (!isPdfMagicHeader(pdfBytes)) {
    return NextResponse.json(
      { error: "Uploaded file must be a valid PDF document." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const stored = upsertCvSession({
    sessionId,
    pdfBytes,
    fileName,
    templateName,
    languageLabel,
  });

  ensureTelegramPoller();

  return NextResponse.json(
    {
      token: stored.token,
      botUsername,
      telegramUrl: buildTelegramDeepLink(botUsername, stored.token),
      expiresInSeconds: Math.ceil(CV_SESSION_TTL_MS / 1000),
      status: stored.status,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
