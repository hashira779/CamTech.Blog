import test from "node:test";
import assert from "node:assert/strict";
import { buildFeedbackMailto, parsePublicContactEmail } from "../src/lib/contact.ts";

test("parsePublicContactEmail accepts valid addresses and rejects incomplete or unsafe inputs", () => {
  assert.equal(parsePublicContactEmail("  user@example.com  "), "user@example.com");
  assert.equal(parsePublicContactEmail(""), null);
  assert.equal(parsePublicContactEmail("incomplete@outlook"), null);
  assert.equal(parsePublicContactEmail("evil<script>@example.com"), null);
  assert.equal(parsePublicContactEmail("a@b.com?bcc=evil"), null);
});

test("buildFeedbackMailto safely URL-encodes the subject", () => {
  assert.equal(
    buildFeedbackMailto("team@example.com", "CV Builder Feedback"),
    "mailto:team@example.com?subject=CV%20Builder%20Feedback",
  );
});
