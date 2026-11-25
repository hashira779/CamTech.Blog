import test from "node:test";
import assert from "node:assert/strict";
import {
  createFeedbackChallenge,
  FEEDBACK_MAX_AGE_MS,
  FEEDBACK_MIN_ELAPSED_MS,
  validateFeedbackPayload,
  verifyFeedbackChallenge,
} from "../src/lib/contact.ts";

test("anti-spam challenge rejects instant bot requests, tampered tokens, and expired tokens", () => {
  const t0 = 10_000_000;
  const token = createFeedbackChallenge(t0, "unit-test-secret");

  // Instant submission (< 2.5s) is blocked as bot behavior
  assert.equal(verifyFeedbackChallenge(token, t0 + 500, "unit-test-secret").ok, false);

  // Tampered signature rejected
  assert.equal(verifyFeedbackChallenge(`${token}x`, t0 + 5000, "unit-test-secret").ok, false);

  // Expired challenge rejected
  assert.equal(
    verifyFeedbackChallenge(token, t0 + FEEDBACK_MAX_AGE_MS + 1000, "unit-test-secret").ok,
    false,
  );

  // Normal human elapsed time succeeds cleanly
  assert.equal(
    verifyFeedbackChallenge(token, t0 + FEEDBACK_MIN_ELAPSED_MS + 500, "unit-test-secret").ok,
    true,
  );
});

test("validateFeedbackPayload catches honeypot traps, link spam, and invalid emails", () => {
  const bot = validateFeedbackPayload({
    company_url: "http://spam.example",
    message: "Check out my spam link",
  });
  assert.equal(bot.ok, false);
  if (!bot.ok) assert.equal(bot.honeypot, true);

  const linkSpam = validateFeedbackPayload({
    message: "Buy cheap followers https://a.example https://b.example",
  });
  assert.equal(linkSpam.ok, false);

  const badEmail = validateFeedbackPayload({
    replyEmail: "bad@outlook",
    message: "Great CV templates, thank you!",
  });
  assert.equal(badEmail.ok, false);

  const clean = validateFeedbackPayload({
    topic: "cv-builder",
    name: "Sokha",
    replyEmail: "sokha@example.com",
    pagePath: "/cv-builder",
    message: "Would love a 2-column Khmer NGO template option.",
  });
  assert.equal(clean.ok, true);
});
