import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTelegramDeepLink,
  checkCvTelegramRateLimit,
  cleanupExpiredCvSessions,
  CV_DELIVERED_RETENTION_MS,
  CV_SESSION_TTL_MS,
  deleteCvSession,
  getCvSessionStatus,
  isPdfMagicHeader,
  isValidSessionId,
  parseStartToken,
  sanitizeTelegramPdfFilename,
  upsertCvSession,
} from "../src/lib/cv-telegram-store.ts";

const makeTestStore = () => ({
  sessionsByToken: new Map(),
  tokenBySessionId: new Map(),
  rateBuckets: new Map(),
  cachedBotUsername: null,
  pollerStarted: false,
  pollerRunning: false,
  updateOffset: 0,
  lastCleanupAt: 0,
});

const SAMPLE_PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

test("deep-link parser and builder handle Telegram start payloads cleanly", () => {
  assert.equal(buildTelegramDeepLink("@CamTech_Blog_bot", "AbCdEf1234567890_x"), "https://t.me/CamTech_Blog_bot?start=cv_AbCdEf1234567890_x");
  assert.equal(parseStartToken("/start cv_AbCdEf1234567890_x"), "AbCdEf1234567890_x");
  assert.equal(parseStartToken("/start@CamTech_Blog_bot cv_AbCdEf1234567890_x"), "AbCdEf1234567890_x");
  assert.equal(parseStartToken("/start"), null);
  assert.equal(parseStartToken("/start cv_tooShort"), null);
  assert.equal(parseStartToken("/start cv_../etc/passwd"), null);
});

test("PDF magic bytes and filename sanitizing block non-PDF payloads and traversal", () => {
  assert.equal(isPdfMagicHeader(SAMPLE_PDF), true);
  assert.equal(isPdfMagicHeader(new TextEncoder().encode("<html>not pdf</html>")), false);
  assert.equal(sanitizeTelegramPdfFilename("../../../CV Dara Sok"), "CV_Dara_Sok.pdf");
  assert.equal(sanitizeTelegramPdfFilename("  "), "CV_CamTech.pdf");
  assert.equal(isValidSessionId("session_1234567890ab"), true);
  assert.equal(isValidSessionId("short"), false);
});

test("single-session cache replaces prior export for the same session and expires by TTL", () => {
  const store = makeTestStore();
  const t0 = 1_000_000;

  const first = upsertCvSession({ sessionId: "tab-session-0001", pdfBytes: SAMPLE_PDF, fileName: "one.pdf" }, store, t0);
  const second = upsertCvSession({ sessionId: "tab-session-0001", pdfBytes: SAMPLE_PDF, fileName: "two.pdf" }, store, t0 + 1000);

  assert.notEqual(first.token, second.token);
  assert.equal(getCvSessionStatus(first.token, store, t0 + 1000).status, "expired");
  assert.equal(getCvSessionStatus(second.token, store, t0 + 1000).status, "pending");
  assert.equal(store.sessionsByToken.size, 1);

  assert.equal(getCvSessionStatus(second.token, store, t0 + 1000 + CV_SESSION_TTL_MS).status, "expired");
  assert.equal(store.sessionsByToken.size, 0);
});

test("delivered status expires after short retention window and manual delete clears RAM", () => {
  const store = makeTestStore();
  const t0 = 2_000_000;
  const created = upsertCvSession({ sessionId: "tab-session-0002", pdfBytes: SAMPLE_PDF }, store, t0);
  created.status = "delivered";
  created.deliveredAt = t0;
  created.pdfBytes = null;

  assert.equal(getCvSessionStatus(created.token, store, t0 + 10_000).status, "delivered");
  cleanupExpiredCvSessions(store, t0 + CV_DELIVERED_RETENTION_MS + 1);
  assert.equal(getCvSessionStatus(created.token, store, t0 + CV_DELIVERED_RETENTION_MS + 1).status, "expired");

  const next = upsertCvSession({ sessionId: "tab-session-0002", pdfBytes: SAMPLE_PDF }, store, t0 + 300_000);
  assert.equal(deleteCvSession(next.token, store), true);
  assert.equal(getCvSessionStatus(next.token, store, t0 + 300_001).status, "expired");
});

test("sliding window rate limiter enforces request caps", () => {
  const store = makeTestStore();
  const t0 = 5_000_000;
  assert.equal(checkCvTelegramRateLimit("upload:1.2.3.4", 2, 60_000, store, t0), true);
  assert.equal(checkCvTelegramRateLimit("upload:1.2.3.4", 2, 60_000, store, t0 + 100), true);
  assert.equal(checkCvTelegramRateLimit("upload:1.2.3.4", 2, 60_000, store, t0 + 200), false);
  assert.equal(checkCvTelegramRateLimit("upload:1.2.3.4", 2, 60_000, store, t0 + 61_000), true);
});
