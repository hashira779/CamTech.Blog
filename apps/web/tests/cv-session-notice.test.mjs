import test from "node:test";
import assert from "node:assert/strict";
import {
  CV_PRIVACY_NOTICE_SESSION_KEY,
  getPrivacyNoticeServerSnapshot,
  markPrivacyNoticeSeen,
  readPrivacyNoticeSeen,
} from "../src/lib/cv-session-notice.ts";

function makeMockStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
}

test("first visit in a session has not seen the CV privacy notice", () => {
  const storage = makeMockStorage();
  assert.equal(readPrivacyNoticeSeen(storage), false);
});

test("dismissing the notice stores a session flag so it only opens once per session", () => {
  const storage = makeMockStorage();
  const persisted = markPrivacyNoticeSeen(storage);
  assert.equal(persisted, true);
  assert.equal(storage.getItem(CV_PRIVACY_NOTICE_SESSION_KEY), "1");
  assert.equal(readPrivacyNoticeSeen(storage), true);
});

test("a fresh session without the key prompts the notice again", () => {
  const secondSessionStorage = makeMockStorage();
  assert.equal(readPrivacyNoticeSeen(secondSessionStorage), false);
});

test("SSR server snapshot defaults to dismissed so HTML never flashes or mismatches", () => {
  assert.equal(getPrivacyNoticeServerSnapshot(), true);
});

test("storage exceptions (e.g. strict private browsing) degrade gracefully without throwing", () => {
  const throwingStorage = {
    getItem() {
      throw new Error("SecurityError");
    },
    setItem() {
      throw new Error("QuotaExceededError");
    },
  };

  assert.equal(readPrivacyNoticeSeen(throwingStorage), false);
  assert.equal(markPrivacyNoticeSeen(throwingStorage), false);
});
