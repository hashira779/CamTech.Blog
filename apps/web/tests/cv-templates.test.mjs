import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CV_TEMPLATES,
  cvTextLines,
  cvListItems,
  cvParseLanguageItem,
  cvParseSkillItem,
  cvLanguageScore,
  cvSplitDisplayName,
  cvInitials,
  cvDate,
  cvFileName,
} from "../src/lib/cv-templates.ts";

test("30 unique free templates cover all six structural layouts", () => {
  assert.equal(CV_TEMPLATES.length, 30);
  assert.equal(new Set(CV_TEMPLATES.map((template) => template.id)).size, 30);
  assert.deepEqual(
    [...new Set(CV_TEMPLATES.map((template) => template.layout))].sort(),
    ["banner", "classic", "minimal", "sidebar", "split", "timeline"],
  );
  for (const layout of ["banner", "classic", "minimal", "sidebar", "split", "timeline"]) {
    assert.equal(CV_TEMPLATES.filter((template) => template.layout === layout).length, 5);
  }
  assert.ok(CV_TEMPLATES.every((template) => template.subtitle.en && template.subtitle.km));
});

test("bilingual output keeps both user-authored versions without inventing a translation", () => {
  assert.deepEqual(cvTextLines({ en: " Developer ", km: " អ្នកអភិវឌ្ឍន៍ " }, "bilingual"), [
    { language: "en", text: "Developer" },
    { language: "km", text: "អ្នកអភិវឌ្ឍន៍" },
  ]);
  assert.deepEqual(cvTextLines({ en: "Developer", km: "" }, "km"), []);
  assert.deepEqual(cvTextLines({ en: "", km: "ខ្មែរ" }, "bilingual"), [{ language: "km", text: "ខ្មែរ" }]);
});

test("list, skill, language, and name parsers handle optional scores honestly", () => {
  assert.deepEqual(cvListItems("• Interface design\n- Design systems\n\n  Prototyping "), [
    "Interface design",
    "Design systems",
    "Prototyping",
  ]);
  assert.deepEqual(cvParseLanguageItem("Khmer · Native"), { label: "Khmer", level: "Native" });
  assert.deepEqual(cvParseLanguageItem("English - Professional"), { label: "English", level: "Professional" });
  assert.deepEqual(cvParseLanguageItem("Pre-intermediate French"), { label: "Pre-intermediate French", level: "" });

  assert.deepEqual(cvParseSkillItem("Product Design · 90%"), { label: "Product Design", score: 90 });
  assert.deepEqual(cvParseSkillItem("Figma · 4/5"), { label: "Figma", score: 80 });
  assert.deepEqual(cvParseSkillItem("User Research"), { label: "User Research", score: null });

  assert.equal(cvLanguageScore("Native"), 95);
  assert.equal(cvLanguageScore("មូលដ្ឋាន"), 35);
  assert.equal(cvLanguageScore("Unknown"), null);

  assert.deepEqual(cvSplitDisplayName("Dara Sok"), { head: "Dara", tail: "Sok" });
  assert.deepEqual(cvSplitDisplayName("សុខ ដារ៉ា"), { head: "សុខ", tail: "ដារ៉ា" });
  assert.equal(cvInitials({ en: "Dara Sok", km: "សុខ ដារ៉ា" }), "DS");
  assert.equal(cvInitials({ en: "", km: "សុខ ដារ៉ា" }), "");
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
