import test from "node:test";
import assert from "node:assert/strict";
import { resolveToolGuide } from "../src/lib/tool-guides.ts";

test("resolveToolGuide returns localized EN and KM copy for cv-builder", () => {
  const en = resolveToolGuide("cv-builder", "en");
  const km = resolveToolGuide("cv-builder", "km");

  assert.ok(en && km);
  assert.equal(en.steps.length, 3);
  assert.equal(km.steps.length, 3);
  assert.notEqual(en.title, km.title);
  assert.notEqual(en.note, km.note);
});

test("resolveToolGuide falls back to English cleanly for tools without KM guide overrides", () => {
  const km = resolveToolGuide("word-counter", "km");
  assert.ok(km);
  assert.ok(km.steps.length > 0);
  assert.equal(resolveToolGuide("nonexistent-slug", "en"), null);
});
