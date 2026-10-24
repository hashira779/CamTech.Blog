import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { readImageSize, isLargeImage } from "../src/lib/travel/image-size.ts";

const pub = (p) => fileURLToPath(new URL(`../public/${p}`, import.meta.url));

test("reads JPEG dimensions from project photographs", async () => {
  const small = readImageSize(new Uint8Array(await readFile(pub("images/places/angkor-wat.jpg"))));
  assert.deepEqual(small, { width: 330, height: 224 });
  const large = readImageSize(new Uint8Array(await readFile(pub("images/places/saracen-bay-koh-rong-sanloem.jpg"))));
  assert.deepEqual(large, { width: 4608, height: 3456 });
});

test("reads PNG dimensions", async () => {
  const size = readImageSize(new Uint8Array(await readFile(pub("logo.png"))));
  assert.ok(size && size.width > 0 && size.height > 0);
});

test("rejects bytes that are not an image", () => {
  assert.equal(readImageSize(new TextEncoder().encode("not an image at all, just text")), null);
  assert.equal(readImageSize(new Uint8Array(4)), null);
});

test("large-slot gate needs a known width of at least 900px", () => {
  const widths = { "/a.jpg": 330, "/b.jpg": 4608 };
  assert.equal(isLargeImage(widths, "/a.jpg"), false);
  assert.equal(isLargeImage(widths, "/b.jpg"), true);
  assert.equal(isLargeImage(widths, "https://remote/x.jpg"), false);
  assert.equal(isLargeImage(widths, null), false);
});
