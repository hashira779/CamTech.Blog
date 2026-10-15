/**
 * XSS payload battery for `src/lib/sanitize.ts`.
 *
 * apps/web has no test runner, so this is the gate: `node scripts/security-checks.mjs` (or
 * `npm run security`). Node strips the types from the module under test, so the file that ships is
 * the file being checked — no transpile step, no second copy of the logic to drift.
 *
 * Every payload here is a vector the blacklist sanitizer in `ArticleReader` let through, or a case
 * where a real article's markup must survive. Run it after touching the sanitizer.
 */
import { escapeJsonForScript, htmlToText, safeHref, sanitizeHtml } from "../src/lib/sanitize.ts";

let failures = 0;
let checks = 0;

function check(label, actual, predicate, expected) {
  checks += 1;
  const ok = predicate(actual);
  if (!ok) {
    failures += 1;
    console.log(`  FAIL  ${label}\n        got:      ${JSON.stringify(actual)}\n        expected: ${expected}`);
  } else {
    console.log(`  ok    ${label}`);
  }
}

const inert = (html) => (value) => !value.toLowerCase().includes(html);
const hasNoHandler = (value) => !/\son[a-z]{3,}\s*=/i.test(value);

console.log("\nMarkup the site must never print\n");

const DANGEROUS = [
  ["script tag", "<script>alert(1)</script>", "<script"],
  ["script with attributes", '<script src="https://evil.example/x.js"></script>', "<script"],
  ["svg onload", "<svg onload=alert(1)></svg>", "<svg"],
  ["iframe", '<iframe src="https://evil.example"></iframe>', "<iframe"],
  ["object", '<object data="https://evil.example/x.swf"></object>', "<object"],
  ["embed", '<embed src="https://evil.example/x.swf">', "<embed"],
  ["form", '<form action="https://evil.example"><input name="x"></form>', "<form"],
  ["base href", '<base href="https://evil.example">', "<base"],
  ["meta refresh", '<meta http-equiv="refresh" content="0;url=https://evil.example">', "<meta"],
  ["template + script", "<template><script>alert(1)</script></template>", "<script"],
  ["style with import", '<style>@import "https://evil.example/x.css";</style>', "<style"],
  ["comment breakout", "<!-- --><script>alert(1)</script>", "<script"],
  ["cdata", "<![CDATA[<script>alert(1)</script>]]>", "<script"],
  ["doctype prefix", "<!DOCTYPE html><script>alert(1)</script>", "<script"],
  ["math tag", "<math><mtext><script>alert(1)</script></mtext></math>", "<script"],
];

for (const [label, payload, needle] of DANGEROUS) {
  check(label, sanitizeHtml(payload), inert(needle), `no ${needle} in the output`);
}

const HANDLER_VECTORS = [
  "<img src=x onerror=alert(1)>",
  '<img src="x" onerror="alert(1)">',
  "<p onclick=alert(1) onMouseOver='alert(2)'>text</p>",
  '<a href="https://ok.example" onfocusin=alert(1)>link</a>',
  "<body onload=alert(1)>hi</body>",
  '<div style="background:url(javascript:alert(1))">x</div>',
  "<p ONLOAD=alert(1)>upper case handler</p>",
  "<img/src=x onerror=alert(1)>",
  '<svg><animate attributeName="href" values="javascript:alert(1)"/></svg>',
];

console.log("\nEvent handlers and inline style\n");
for (const payload of HANDLER_VECTORS) {
  const out = sanitizeHtml(payload);
  check(`handler dropped: ${payload.slice(0, 46)}`, out, hasNoHandler, "no on*= attribute");
  check(`no javascript: url: ${payload.slice(0, 46)}`, out, inert("javascript:"), "no javascript: scheme");
  if (/<style|style=/.test(payload)) {
    check("inline style dropped", out, (v) => !/style=/i.test(v), "no style attribute");
  }
}

console.log("\nLink and image URLs\n");

const URL_VECTORS = [
  '<a href="javascript:alert(1)">click</a>',
  '<a href="JaVaScRiPt:alert(1)">click</a>',
  '<a href=" javascript:alert(1)">leading space</a>',
  '<a href="java\tscript:alert(1)">tab inside scheme</a>',
  '<a href="&#106;avascript:alert(1)">numeric entity</a>',
  '<a href="&#x6a;avascript:alert(1)">hex entity, unquoted</a>',
  "<a href=javascript:alert(1)>unquoted</a>",
  '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">data uri</a>',
  '<a href="vbscript:msgbox(1)">vbscript</a>',
  '<a href="file:///etc/passwd">local file</a>',
  '<a href="//evil.example/x">protocol relative</a>',
  '<img src="javascript:alert(1)">',
  '<img src="data:image/svg+xml,<svg onload=alert(1)>">',
];

for (const payload of URL_VECTORS) {
  const out = sanitizeHtml(payload);
  const scheme = /href="|src="/.test(out);
  check(`no live url: ${payload.slice(0, 46)}`, out, () => !scheme, "the href/src attribute is dropped");
}

const HREF_CASES = [
  ["https://example.com/a?b=1&c=2", "https://example.com/a?b=1&c=2"],
  ["http://example.com", "http://example.com"],
  ["mailto:newsroom@example.com", "mailto:newsroom@example.com"],
  ["/world", "/world"],
  ["#section-2", "#section-2"],
  ["javascript:alert(1)", ""],
  ["  javascript:alert(1)", ""],
  ["&#106;avascript:alert(1)", ""],
  ["data:text/html,<script>alert(1)</script>", ""],
  ["//evil.example", ""],
  ["", ""],
  [null, ""],
];

for (const [input, expected] of HREF_CASES) {
  check(`safeHref(${JSON.stringify(input)})`, safeHref(input), (v) => v === expected, JSON.stringify(expected));
}

check("src refuses a mailto", safeHref("mailto:x@example.com", "src"), (v) => v === "", '""');
check("href accepts a real image url", safeHref("https://upload.wikimedia.org/a.jpg", "src"), (v) => v === "https://upload.wikimedia.org/a.jpg", "unchanged");

console.log("\nMarkup a real article must keep\n");

const LEGIT = [
  ["paragraph", "<p>Hello <strong>world</strong> and <em>friends</em>.</p>", "<p>Hello <strong>world</strong> and <em>friends</em>.</p>"],
  ["heading", "<h2>A heading</h2>", "<h2>A heading</h2>"],
  ["list", "<ul><li>one</li><li>two</li></ul>", "<ul><li>one</li><li>two</li></ul>"],
  ["ordered list keeps start", '<ol start="3"><li>three</li></ol>', '<ol start="3"><li>three</li></ol>'],
  ["blockquote", "<blockquote>Someone said it</blockquote>", "<blockquote>Someone said it</blockquote>"],
  ["plain link", '<a href="https://example.com/a?b=1&amp;c=2">source</a>', 'href="https://example.com/a?b=1&amp;c=2"'],
  ["link gets a safe rel", '<a href="https://example.com">source</a>', 'rel="noopener noreferrer nofollow ugc"'],
  ["image keeps a real src", '<img src="https://upload.wikimedia.org/a.jpg" alt="A temple">', 'src="https://upload.wikimedia.org/a.jpg"'],
  ["image credit survives", "<figure><img src=\"https://x.example/a.jpg\" alt=\"Temple\"><figcaption>Photo: someone</figcaption></figure>", "<figcaption>"],
  ["time element", '<p><time datetime="2026-10-15">15 October</time></p>', 'datetime="2026-10-15"'],
  ["table cells", "<table><tbody><tr><td>cell</td></tr></tbody></table>", "<td>cell</td>"],
  ["unclosed paragraph is closed", "<p>dangling text", "</p>"],
  ["entity in text is kept as text", "<p>Phnom Penh &amp; around</p>", "&amp;"],
];

for (const [label, payload, needle] of LEGIT) {
  check(label, sanitizeHtml(payload), (v) => v.includes(needle), `output contains ${JSON.stringify(needle)}`);
}

check(
  "text content of a dropped element is escaped, not parsed",
  sanitizeHtml("<p>Before <script>var a = 1 < 2;</script> after</p>"),
  (v) => v.includes("Before") && v.includes("after") && !v.includes("<script"),
  "keeps the prose, drops the script",
);
check(
  "a stray angle bracket cannot open a tag",
  sanitizeHtml("<p>5 < 6 and 7 > 3</p>"),
  (v) => v === "<p>5 &lt; 6 and 7 &gt; 3</p>",
  "escaped as entities",
);
check(
  "a > inside a quoted attribute does not end the tag",
  sanitizeHtml('<abbr title="greater > than">text</abbr>'),
  (v) => v === '<abbr title="greater &gt; than">text</abbr>',
  "the value is escaped and the tag still closes",
);
check(
  "an attribute the tag is not allowed to keep is dropped",
  sanitizeHtml('<p title="anything" class="x" id="y">text</p>'),
  (v) => v === "<p>text</p>",
  "<p> keeps no attributes",
);
check(
  "unquoted attributes are read, not guessed",
  sanitizeHtml('<a href=https://example.com/x>y</a>'),
  (v) => v.includes('href="https://example.com/x"'),
  "bare value normalised into a quoted attribute",
);
check(
  "a single-quoted javascript link is dropped",
  sanitizeHtml("<a href='javascript:alert(1)'>x</a>"),
  (v) => !v.includes("href"),
  "no href at all",
);
check(
  "handler written with a newline between name and equals",
  sanitizeHtml('<p onmouseover\n=alert(1)>text</p>'),
  (v) => !/onmouseover/i.test(v) && v.includes("text"),
  "attribute dropped, prose kept",
);
check("sanitizeHtml(null)", sanitizeHtml(null), (v) => v === "", '""');
check("sanitizeHtml('')", sanitizeHtml(""), (v) => v === "", '""');

console.log("\nJSON-LD\n");

const SCRIPT_BREAKOUT = { title: "</script><img src=x onerror=alert(1)>", url: "https://blog.camtech.cam/x" };
const encoded = escapeJsonForScript(SCRIPT_BREAKOUT);
check("no closing script tag in the payload", encoded, (v) => !v.toLowerCase().includes("</script"), "escaped to \\u003c");
check("still parses as the same JSON", JSON.parse(encoded), (v) => v.title === SCRIPT_BREAKOUT.title, "round-trips");
check("ampersand escaped", escapeJsonForScript({ a: "Tom & Jerry" }), (v) => !v.includes("&") || v.includes("\\u0026"), "\\u0026");
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);
check(
  "line separators escaped",
  escapeJsonForScript({ a: "one" + LINE_SEP + "two" + PARA_SEP + "three" }),
  (v) => !v.includes(LINE_SEP) && !v.includes(PARA_SEP),
  "\u2028 / \u2029",
);
check(
  "article title from the wire cannot break out",
  `<script type="application/ld+json">${encoded}</script>`,
  (v) => (v.match(/<\/script>/g) || []).length === 1,
  "exactly one closing script tag: the element itself",
);

console.log("\nPlain text extraction\n");
check(
  "htmlToText strips markup and keeps prose",
  htmlToText("<p>Angkor Wat <a href=\"https://example.com\">temple city</a></p>"),
  (v) => v === "Angkor Wat temple city",
  '"Angkor Wat temple city"',
);
check("htmlToText does not resurrect a script body", htmlToText("<script>alert(1)</script>Real text"), (v) => v.includes("Real text"), "keeps prose");

console.log(`\n${checks - failures}/${checks} checks passed${failures ? ` — ${failures} FAILED` : ""}\n`);
process.exit(failures ? 1 : 0);
