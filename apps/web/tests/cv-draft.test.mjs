import test from "node:test";
import assert from "node:assert/strict";
import {
  clearCvDraftFromSession,
  CV_DRAFT_SESSION_KEY,
  readCvDraftFromSession,
  sanitizeCvDraft,
  writeCvDraftToSession,
} from "../src/lib/cv-draft.ts";

function makeStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      store.set(k, v);
    },
    removeItem(k) {
      store.delete(k);
    },
  };
}

test("sanitizeCvDraft accepts valid JSON, strips invalid photo URLs, and validates template/language", () => {
  const parsed = sanitizeCvDraft({
    version: 1,
    templateId: "nonexistent-template",
    language: "invalid-lang",
    data: {
      name: { en: "Sokha", km: "សុខា" },
      email: "sokha@example.com",
      photo: "javascript:alert(1)",
      experience: Array.from({ length: 12 }, (_, i) => ({
        id: `exp-${i}`,
        title: { en: `Role ${i}`, km: "" },
      })),
    },
  }, "foundation", new Set(["foundation", "editorial"]));

  assert.ok(parsed);
  assert.equal(parsed.data.name.en, "Sokha");
  assert.equal(parsed.data.photo, "");
  assert.equal(parsed.templateId, "foundation");
  assert.equal(parsed.language, "bilingual");
  assert.equal(parsed.data.experience.length, 8);
});

test("sessionStorage round-trip writes, restores, and clears draft without throwing on errors", () => {
  const storage = makeStorage();
  const sample = sanitizeCvDraft({
    templateId: "editorial",
    language: "km",
    data: { name: { en: "Dara", km: "ដារ៉ា" } },
  });
  assert.ok(sample);

  assert.equal(writeCvDraftToSession(sample, storage), true);
  assert.ok(storage.getItem(CV_DRAFT_SESSION_KEY));

  const restored = readCvDraftFromSession(storage);
  assert.ok(restored);
  assert.equal(restored.templateId, "editorial");
  assert.equal(restored.language, "km");
  assert.equal(restored.data.name.km, "ដារ៉ា");

  assert.equal(clearCvDraftFromSession(storage), true);
  assert.equal(readCvDraftFromSession(storage), null);
});
