import crypto from "node:crypto";

export const CV_SESSION_TTL_MS = 15 * 60 * 1000;
export const CV_DELIVERED_RETENTION_MS = 2 * 60 * 1000;
export const CV_MAX_PDF_BYTES = 5 * 1024 * 1024;
export const CV_MAX_CACHED_SESSIONS = 500;
export const CV_MAX_TOTAL_CACHE_BYTES = 256 * 1024 * 1024;
export const CV_MAX_RATE_BUCKETS = 5000;
export const CV_MAX_MULTIPART_BYTES = 6 * 1024 * 1024;

export type CvTelegramDeliveryStatus = "pending" | "delivered" | "expired";

export type CvTelegramSessionEntry = {
  token: string;
  sessionId: string;
  fileName: string;
  templateName: string;
  languageLabel: string;
  pdfBytes: Uint8Array | null;
  byteLength: number;
  createdAt: number;
  expiresAt: number;
  deliveredAt: number | null;
  status: "pending" | "delivered";
  delivering: boolean;
};

type RateBucket = Map<string, number[]>;

type CvTelegramGlobalStore = {
  sessionsByToken: Map<string, CvTelegramSessionEntry>;
  tokenBySessionId: Map<string, string>;
  rateBuckets: RateBucket;
  cachedBotUsername: string | null;
  pollerStarted: boolean;
  pollerRunning: boolean;
  updateOffset: number;
  lastCleanupAt: number;
};

const GLOBAL_STORE_KEY = "__camtech_cv_telegram_store__";

export function getCvTelegramStore(): CvTelegramGlobalStore {
  const host = globalThis as typeof globalThis & {
    [GLOBAL_STORE_KEY]?: CvTelegramGlobalStore;
  };
  if (!host[GLOBAL_STORE_KEY]) {
    host[GLOBAL_STORE_KEY] = {
      sessionsByToken: new Map(),
      tokenBySessionId: new Map(),
      rateBuckets: new Map(),
      cachedBotUsername: null,
      pollerStarted: false,
      pollerRunning: false,
      updateOffset: 0,
      lastCleanupAt: 0,
    };
  }
  return host[GLOBAL_STORE_KEY];
}

export function isValidSessionId(value: string): boolean {
  return /^[a-zA-Z0-9_-]{12,80}$/.test(value);
}

export function isValidToken(value: string): boolean {
  return /^[a-zA-Z0-9_-]{16,44}$/.test(value);
}

export function parseStartToken(text?: string | null): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  const match = trimmed.match(/^\/start(?:@[A-Za-z0-9_]+)?\s+cv_([a-zA-Z0-9_-]{16,44})(?:\s|$)/i);
  if (!match) return null;
  return match[1];
}

export function buildTelegramDeepLink(botUsername: string, token: string): string {
  const cleanUser = botUsername.trim().replace(/^@+/, "");
  return `https://t.me/${cleanUser}?start=cv_${token}`;
}

export function sanitizeTelegramPdfFilename(rawName?: string | null): string {
  const base = (rawName || "CV_CamTech")
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^[_.-]+|[_.-]+$/g, "")
    .slice(0, 72);
  return `${base || "CV_CamTech"}.pdf`;
}

export function isPdfMagicHeader(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 6) return false;
  return (
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 && // F
    bytes[4] === 0x2d && // -
    (bytes[5] === 0x31 || bytes[5] === 0x32) // %PDF-1.x or %PDF-2.x
  );
}

/**
 * Extracts caller IP while refusing attacker-spoofed leftmost X-Forwarded-For entries.
 * Trusts Cloudflare's edge header first, then Nginx's X-Real-IP, then rightmost proxy hop.
 */
export function resolveClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  const rightMostForwarded = forwarded
    ? forwarded
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)
        .at(-1)
    : "";

  const candidate = cfIp || realIp || rightMostForwarded || "local";
  return candidate.replace(/[^a-zA-Z0-9.:_-]/g, "").slice(0, 64) || "local";
}

function isValidTelegramChatId(chatId: unknown): chatId is number | string {
  if (typeof chatId === "number") {
    return Number.isSafeInteger(chatId) && chatId !== 0;
  }
  if (typeof chatId === "string") {
    return /^-?\d{1,20}$/.test(chatId.trim());
  }
  return false;
}

export function cleanupExpiredCvSessions(
  store: CvTelegramGlobalStore = getCvTelegramStore(),
  now: number = Date.now(),
): void {
  for (const [token, entry] of store.sessionsByToken.entries()) {
    const expiredPending = entry.status === "pending" && now >= entry.expiresAt;
    const expiredDelivered =
      entry.status === "delivered" &&
      entry.deliveredAt !== null &&
      now - entry.deliveredAt >= CV_DELIVERED_RETENTION_MS;

    if (expiredPending || expiredDelivered) {
      entry.pdfBytes = null;
      store.sessionsByToken.delete(token);
      if (store.tokenBySessionId.get(entry.sessionId) === token) {
        store.tokenBySessionId.delete(entry.sessionId);
      }
    }
  }
}

export function checkCvTelegramRateLimit(
  bucketKey: string,
  maxRequests: number,
  windowMs: number,
  store: CvTelegramGlobalStore = getCvTelegramStore(),
  now: number = Date.now(),
): boolean {
  if (now - store.lastCleanupAt > 30_000) {
    store.lastCleanupAt = now;
    for (const [key, timestamps] of store.rateBuckets.entries()) {
      const fresh = timestamps.filter((ts) => now - ts < windowMs * 2);
      if (fresh.length === 0) store.rateBuckets.delete(key);
      else store.rateBuckets.set(key, fresh);
    }
  }
  const existing = (store.rateBuckets.get(bucketKey) || []).filter((ts) => now - ts < windowMs);
  if (existing.length >= maxRequests) {
    store.rateBuckets.set(bucketKey, existing);
    return false;
  }
  if (!store.rateBuckets.has(bucketKey) && store.rateBuckets.size >= CV_MAX_RATE_BUCKETS) {
    const oldestBucket = store.rateBuckets.keys().next().value;
    if (oldestBucket) store.rateBuckets.delete(oldestBucket);
  }
  existing.push(now);
  store.rateBuckets.set(bucketKey, existing);
  return true;
}

export function upsertCvSession(
  input: {
    sessionId: string;
    pdfBytes: Uint8Array;
    fileName?: string;
    templateName?: string;
    languageLabel?: string;
  },
  store: CvTelegramGlobalStore = getCvTelegramStore(),
  now: number = Date.now(),
): CvTelegramSessionEntry {
  cleanupExpiredCvSessions(store, now);

  if (!isValidSessionId(input.sessionId)) {
    throw new Error("Invalid session identifier.");
  }
  if (input.pdfBytes.byteLength === 0 || input.pdfBytes.byteLength > CV_MAX_PDF_BYTES) {
    throw new Error("PDF exceeds allowed size.");
  }
  if (!isPdfMagicHeader(input.pdfBytes)) {
    throw new Error("Invalid PDF payload.");
  }

  // Enforce strictly ONE active cached CV export per tab session.
  const previousToken = store.tokenBySessionId.get(input.sessionId);
  if (previousToken) {
    const previousEntry = store.sessionsByToken.get(previousToken);
    if (previousEntry) previousEntry.pdfBytes = null;
    store.sessionsByToken.delete(previousToken);
    store.tokenBySessionId.delete(input.sessionId);
  }

  // Bound total memory cache count and byte footprint by evicting oldest entries first.
  let totalBytes = 0;
  for (const item of store.sessionsByToken.values()) {
    totalBytes += item.pdfBytes ? item.pdfBytes.byteLength : 0;
  }
  while (
    store.sessionsByToken.size >= CV_MAX_CACHED_SESSIONS ||
    (store.sessionsByToken.size > 0 && totalBytes + input.pdfBytes.byteLength > CV_MAX_TOTAL_CACHE_BYTES)
  ) {
    const oldestKey = store.sessionsByToken.keys().next().value;
    if (!oldestKey) break;
    const evicted = store.sessionsByToken.get(oldestKey);
    if (evicted) {
      totalBytes -= evicted.pdfBytes ? evicted.pdfBytes.byteLength : 0;
      evicted.pdfBytes = null;
      if (store.tokenBySessionId.get(evicted.sessionId) === oldestKey) {
        store.tokenBySessionId.delete(evicted.sessionId);
      }
    }
    store.sessionsByToken.delete(oldestKey);
  }

  const token = crypto.randomBytes(18).toString("base64url");
  const entry: CvTelegramSessionEntry = {
    token,
    sessionId: input.sessionId,
    fileName: sanitizeTelegramPdfFilename(input.fileName),
    templateName: (input.templateName || "CV").replace(/[\r\n\t]+/g, " ").trim().slice(0, 48),
    languageLabel: (input.languageLabel || "EN").replace(/[\r\n\t]+/g, " ").trim().slice(0, 24),
    pdfBytes: new Uint8Array(input.pdfBytes),
    byteLength: input.pdfBytes.byteLength,
    createdAt: now,
    expiresAt: now + CV_SESSION_TTL_MS,
    deliveredAt: null,
    status: "pending",
    delivering: false,
  };

  store.sessionsByToken.set(token, entry);
  store.tokenBySessionId.set(input.sessionId, token);
  return entry;
}

export function getCvSessionStatus(
  token: string,
  store: CvTelegramGlobalStore = getCvTelegramStore(),
  now: number = Date.now(),
): { status: CvTelegramDeliveryStatus; expiresInSeconds: number } {
  cleanupExpiredCvSessions(store, now);
  if (!isValidToken(token)) {
    return { status: "expired", expiresInSeconds: 0 };
  }
  const entry = store.sessionsByToken.get(token);
  if (!entry) {
    return { status: "expired", expiresInSeconds: 0 };
  }
  return {
    status: entry.status,
    expiresInSeconds: Math.max(0, Math.ceil((entry.expiresAt - now) / 1000)),
  };
}

export function deleteCvSession(
  token: string,
  store: CvTelegramGlobalStore = getCvTelegramStore(),
): boolean {
  if (!isValidToken(token)) return false;
  const entry = store.sessionsByToken.get(token);
  if (!entry) return false;
  entry.pdfBytes = null;
  store.sessionsByToken.delete(token);
  if (store.tokenBySessionId.get(entry.sessionId) === token) {
    store.tokenBySessionId.delete(entry.sessionId);
  }
  return true;
}

function getBotToken(): string {
  return (process.env.TELEGRAM_CV_BOT_TOKEN || "").trim();
}

export async function resolveBotUsername(): Promise<string> {
  const configured = (process.env.TELEGRAM_CV_BOT_USERNAME || "").trim().replace(/^@+/, "");
  if (configured) return configured;

  const store = getCvTelegramStore();
  if (store.cachedBotUsername) return store.cachedBotUsername;

  const botToken = getBotToken();
  if (!botToken) return "";

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return "";
    const json = (await response.json()) as { ok?: boolean; result?: { username?: string } };
    const username = json.result?.username?.trim().replace(/^@+/, "") || "";
    if (username) store.cachedBotUsername = username;
    return username;
  } catch {
    return "";
  }
}

async function sendTelegramText(botToken: string, chatId: number | string, text: string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // Non-fatal informational reply
  }
}

export async function deliverCvToTelegramChat(
  token: string,
  chatId: number | string,
  store: CvTelegramGlobalStore = getCvTelegramStore(),
): Promise<{ delivered: boolean; reason: string }> {
  const botToken = getBotToken();
  if (!botToken) return { delivered: false, reason: "bot_unconfigured" };

  cleanupExpiredCvSessions(store);
  if (!isValidToken(token)) {
    await sendTelegramText(
      botToken,
      chatId,
      "Invalid or expired CV link. Return to CamTech.Blog CV Builder and tap Send to Telegram again.",
    );
    return { delivered: false, reason: "invalid_token" };
  }

  const entry = store.sessionsByToken.get(token);
  if (!entry || entry.status !== "pending" || !entry.pdfBytes) {
    const message =
      entry?.status === "delivered"
        ? "This CV PDF was already delivered to your chat. Return to CamTech.Blog to export a fresh copy."
        : "This CV session has expired (15-minute temporary cache). Return to CamTech.Blog and click Send to Telegram again.";
    await sendTelegramText(botToken, chatId, message);
    return { delivered: false, reason: entry?.status === "delivered" ? "already_delivered" : "expired" };
  }

  if (entry.delivering) {
    return { delivered: false, reason: "in_progress" };
  }

  entry.delivering = true;
  try {
    const form = new FormData();
    form.set("chat_id", String(chatId));
    const pdfBlob = new Blob([Uint8Array.from(entry.pdfBytes)], { type: "application/pdf" });
    form.set("document", pdfBlob, entry.fileName);
    form.set(
      "caption",
      `Your CV PDF (${entry.templateName} · ${entry.languageLabel}) from CamTech.Blog.\nឯកសារ CV PDF របស់អ្នកត្រូវបានផ្ញើដោយស្វ័យប្រវត្តិ និងលុបចេញពី cache ម៉ាស៊ីនមេរួចហើយ។`,
    );

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      entry.delivering = false;
      await sendTelegramText(
        botToken,
        chatId,
        "Telegram could not receive the PDF file right now. Please try Send to Telegram again.",
      );
      return { delivered: false, reason: "telegram_api_error" };
    }

    // Immediately wipe PDF binary from RAM after successful handoff to Telegram.
    entry.pdfBytes = null;
    entry.status = "delivered";
    entry.deliveredAt = Date.now();
    entry.delivering = false;
    if (store.tokenBySessionId.get(entry.sessionId) === entry.token) {
      store.tokenBySessionId.delete(entry.sessionId);
    }
    return { delivered: true, reason: "delivered" };
  } catch {
    entry.delivering = false;
    return { delivered: false, reason: "network_error" };
  }
}

export async function handleTelegramMessageUpdate(message: {
  text?: string;
  chat?: { id?: number | string };
}): Promise<void> {
  const chatId = message?.chat?.id;
  if (!isValidTelegramChatId(chatId)) return;
  const text = (typeof message.text === "string" ? message.text : "").trim().slice(0, 512);
  const startToken = parseStartToken(text);
  if (startToken) {
    await deliverCvToTelegramChat(startToken, chatId);
    return;
  }
  if (text.startsWith("/start")) {
    const botToken = getBotToken();
    if (botToken) {
      await sendTelegramText(
        botToken,
        chatId,
        "CamTech.Blog CV Bot ready! Open the CV Builder on camtech.cam and click “Send to Telegram” or scan the QR code to receive your PDF automatically.\nសូមបើកកម្មវិធីបង្កើត CV លើ CamTech.Blog រួចចុច Send to Telegram ឬ Scan QR ដើម្បីទទួលឯកសារ PDF ដោយស្វ័យប្រវត្តិ។",
      );
    }
  }
}

async function pollTelegramUpdatesLoop(): Promise<void> {
  const store = getCvTelegramStore();
  if (store.pollerRunning) return;
  store.pollerRunning = true;

  try {
    const botToken = getBotToken();
    if (!botToken) return;

    // Only long-poll when no webhook URL is registered on Telegram (local dev / polling deployments).
    const webhookRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`, {
      signal: AbortSignal.timeout(8000),
    });
    if (webhookRes.ok) {
      const info = (await webhookRes.json()) as { ok?: boolean; result?: { url?: string } };
      if (info.result?.url) {
        return;
      }
    }

    while (getBotToken()) {
      const activeToken = getBotToken();
      if (!activeToken) break;
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${activeToken}/getUpdates?offset=${store.updateOffset}&timeout=25&allowed_updates=${encodeURIComponent(
            JSON.stringify(["message"]),
          )}`,
          { signal: AbortSignal.timeout(32000) },
        );
        if (!res.ok) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          continue;
        }
        const payload = (await res.json()) as {
          ok?: boolean;
          result?: Array<{ update_id: number; message?: { text?: string; chat?: { id?: number | string } } }>;
        };
        const updates = payload.result || [];
        for (const item of updates) {
          store.updateOffset = Math.max(store.updateOffset, item.update_id + 1);
          if (item.message) {
            await handleTelegramMessageUpdate(item.message);
          }
        }
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    }
  } finally {
    store.pollerRunning = false;
    store.pollerStarted = false;
  }
}

export function ensureTelegramPoller(): void {
  if (!getBotToken()) return;
  const store = getCvTelegramStore();
  if (store.pollerStarted) return;
  store.pollerStarted = true;
  void pollTelegramUpdatesLoop();
}
