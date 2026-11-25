import { test } from "node:test";
import assert from "node:assert/strict";
import { CV_TEMPLATES, cvTextLines, cvDate, cvFileName } from "../src/lib/cv-templates.ts";

test("24 unique free templates cover all six structural layouts", () => {
  assert.equal(CV_TEMPLATES.length, 24);
  assert.equal(new Set(CV_TEMPLATES.map((template) => template.id)).size, 24);
  assert.deepEqual([...new Set(CV_TEMPLATES.map((template) => template.layout))].sort(), ["banner", "classic", "minimal", "sidebar", "split", "timeline"]);
});
test("bilingual output keeps both user-authored versions without inventing a translation", () => {
  assert.deepEqual(cvTextLines({ en: " Developer ", km: " អ្នកអភិវឌ្ឍន៍ " }, "bilingual"), [
    { language: "en", text: "Developer" }, { language: "km", text: "អ្នកអភិវឌ្ឍន៍" },
  ]);
  assert.deepEqual(cvTextLines({ en: "Developer", km: "" }, "km"), []);
  assert.deepEqual(cvTextLines({ en: "", km: "ខ្មែរ" }, "bilingual"), [{ language: "km", text: "ខ្មែរ" }]);
});
test("CV dates are stable across timezones and malformed months are not silently changed", () => {
  assert.equal(cvDate("2024-01"), "Jan 2024");
  assert.equal(cvDate("2024-13"), "2024-13");
  assert.equal(cvDate(""), "");
});
test("suggested PDF filenames preserve Khmer while stripping path separators", () => {
  assert.equal(cvFileName("  បេក្ខជន គំរូ  "), "បេក្ខជន គំរូ - CV");
  assert.equal(cvFileName('Alex/Example: "CV"'), "AlexExample CV - CV");
  assert.equal(cvFileName(""), "My CV");
});
