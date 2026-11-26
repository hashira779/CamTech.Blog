import { test } from "node:test";
import assert from "node:assert/strict";
import { hasSubstantiveContent, isArticleEligible } from "../src/lib/content-quality.ts";
import { hasKhmerText, toIsoString } from "../src/lib/format.ts";

const body = "Release notes describe the network upgrade, its deployment date and the changes operators must check. ".repeat(20);
const article = { status: "PUBLISHED", quality_checklist_passed: true, content: body,
  summary: "An upgrade guide for network operators.", primary_source_url: "https://example.com/release/1" };

test("only published, checked articles with substantive copy and a specific source qualify", () => {
  assert.equal(isArticleEligible(article), true);
  for (const patch of [{ status: "AI_DRAFT" }, { quality_checklist_passed: false },
    { content: "Headline repeated." }, { primary_source_url: "https://example.com/" },
    { primary_source_url: "javascript:alert(1)" }, { summary: body }]) {
    assert.equal(isArticleEligible({ ...article, ...patch }), false);
  }
});

test("HTML padding, scripts and generic filler do not qualify", () => {
  assert.equal(hasSubstantiveContent("<p>&nbsp;</p>".repeat(2000)), false);
  assert.equal(hasSubstantiveContent(`<script>${body}</script>`), false);
  assert.equal(hasSubstantiveContent(body, "", "Further regional developments are expected to follow."), false);
});

test("hasKhmerText rejects mixed Thai or Lao glyphs leaked into Khmer fields", () => {
  assert.equal(hasKhmerText("ការអភិវឌ្ឍសេដ្ឋកិច្ចឌីជីថលនៅកម្ពុជា", 5), true);
  assert.equal(hasKhmerText("ជនខិលខូចម្នាក់ត្រូវបានឃាត់ខ្លួន ຜ່ານការរៃអង្គាសមូលនិធិปลอม (AI)", 5), false);
});

test("toIsoString treats naive backend UTC timestamps consistently across timezones", () => {
  assert.equal(toIsoString("2026-11-24T08:15:12.854116"), "2026-11-24T08:15:12.854Z");
});
