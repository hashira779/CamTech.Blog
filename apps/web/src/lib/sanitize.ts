/**
 * Rendering text the site did not write.
 *
 * Three sources hand this site markup or URLs it never authored: syndicated RSS (`entry.link`,
 * `source.href`, and `<a>`/`<img>` inside the summary), the AI generators that return HTML for
 * article and discovery bodies, and whatever an editor pastes into the CMS. All three land in the
 * database and are later printed by a Server Component.
 *
 * Two rules follow from that.
 *
 * 1. **HTML is allowed, but by allowlist.** `ArticleReader` used to blacklist `script`, `style`,
 *    `iframe`, `object`, `embed` and `on*=` with a handful of regexes, so anything outside that
 *    list passed: `<img src=x onerror=...>` (an `img` was never in the list), `<svg onload=...>`,
 *    `<form action>`, `<meta http-equiv>`, `<base href>`. An allowlist cannot be surprised that
 *    way — tags and attributes outside the set are simply not emitted.
 * 2. **URLs are validated by scheme, not by string pattern.** A `javascript:` link was rewritten
 *    to `about:blank` only when it appeared as `href="javascript:` with nothing in between;
 *    `href=" javascript:..."`, `&#106;avascript:alert(1)` and `<a href=javascript:alert(1)>`
 *    (unquoted) all escaped it. `safeHref` decodes entities and strips control characters first,
 *    then requires http/https (plus `mailto:` for bylines and `/...` for site-local links).
 *
 * `escapeJsonForScript` is the third piece: JSON-LD is written into a `<script>` element, so a
 * title containing `</script>` closes it and the remainder becomes live markup.
 *
 * Ordinary `{children}` is not a concern here — React escapes it. These helpers exist only for
 * the places that deliberately inject markup or accept a URL from the wire.
 */

/** Tag -> the attributes it may keep. An empty list means "keep the tag, drop every attribute". */
const ALLOWED_TAGS: Record<string, readonly string[]> = {
  p: [],
  br: [],
  hr: [],
  span: [],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  mark: [],
  small: [],
  sub: [],
  sup: [],
  time: ["datetime"],
  code: [],
  kbd: [],
  pre: [],
  abbr: ["title"],
  blockquote: [],
  ul: [],
  ol: ["start"],
  li: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  figure: [],
  figcaption: [],
  table: [],
  thead: [],
  tbody: [],
  tfoot: [],
  tr: [],
  th: ["colspan", "rowspan"],
  td: ["colspan", "rowspan"],
  dl: [],
  dt: [],
  dd: [],
  a: ["href", "title"],
  img: ["src", "alt", "title"],
};

/** Deliberately absent: script, style, iframe, object, embed, form, input, button, textarea,
 *  select, meta, link, base, svg, math, template, slot, font, marquee. */

const VOID_TAGS = new Set(["br", "hr", "img"]);

/** href accepts site-local paths; img src does not, because "/..." would point at this origin. */
const HREF_PROTOCOLS = new Set(["http", "https", "mailto"]);
const SRC_PROTOCOLS = new Set(["http", "https"]);

const ENTITY_NAMES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  copy: "©",
  reg: "®",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  middot: "·",
  laquo: "«",
  raquo: "»",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
};

/**
 * Decodes numeric entities and the handful of named ones a URL could hide a scheme behind.
 * Browsers decode entities inside attribute values before using them, so validation has to look at
 * the decoded form: `href="&#106;avascript:alert(1)"` is a `javascript:` link as far as the
 * renderer is concerned.
 */
function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]{1,10});?/gi, (match, body: string) => {
    if (body.startsWith("#")) {
      const hex = /^#x/i.test(body);
      const code = Number.parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const name = body.toLowerCase();
    return name in ENTITY_NAMES ? ENTITY_NAMES[name] : match;
  });
}

/** Whitespace and control characters inside a scheme are a bypass, not a disqualifier. */
function collapseForSchemeCheck(value: string): string {
  return value.replace(/[\u0000-\u0020\u007f-\u009f\s]+/g, "");
}

export type UrlKind = "href" | "src";

/**
 * The URL, if it is safe to put in a link or image; otherwise "".
 *
 * Returns "" rather than `about:blank` so callers can hide the element instead of rendering a
 * dead one — every call site here has something honest to show in its place.
 */
export function safeHref(value?: string | null, kind: UrlKind = "href"): string {
  if (!value) return "";
  const protocols = kind === "src" ? SRC_PROTOCOLS : HREF_PROTOCOLS;

  // Decode, then strip the control characters that let `java&#9;script:` and `java script:` pass
  // a naive prefix test. Capped so a 1 MB blob cannot make this pathological.
  const raw = String(value).trim().slice(0, 4096);
  const candidate = collapseForSchemeCheck(decodeEntities(raw));
  if (!candidate) return "";

  if (candidate.startsWith("//")) return ""; // protocol-relative: an unvalidated external origin
  if (candidate.startsWith("#")) return candidate;
  if (kind === "href" && candidate.startsWith("/") && !candidate.startsWith("/\\")) return candidate;

  const colon = candidate.indexOf(":");
  const firstSlash = candidate.indexOf("/");
  if (colon === -1) {
    // No scheme at all. "example.com/story" would resolve against this origin, so only an
    // explicitly relative path is allowed through; anything else is dropped.
    return "";
  }

  if (firstSlash !== -1 && firstSlash < colon) return ""; // "path/with:colon" is not a scheme
  const scheme = candidate.slice(0, colon).toLowerCase();
  if (!/^[a-z][a-z0-9+.-]*$/.test(scheme)) return "";
  if (!protocols.has(scheme)) return "";

  // The value returned is a raw URL: validated on its decoded form, control characters removed,
  // and deliberately **not** HTML-escaped. JSX call sites pass it straight to `href`, where React
  // does its own escaping, and a pre-escaped `&amp;` would end up in the address bar. Attribute
  // output is escaped by `renderOpenTag`, which is the only place that needs it.
  return candidate;
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface ParsedTag {
  closing: boolean;
  name: string;
  selfClosing: boolean;
  attributes: Record<string, string>;
  /** Index just past the tag's own `>`, so a `>` inside a quoted attribute value cannot end it early. */
  end: number;
}

/**
 * Reads one `<...>` without a DOM. Attribute values may be quoted, single-quoted or bare, which is
 * exactly the range a blacklist sanitizer gets wrong and an allowlist tokenizer handles by simply
 * not copying anything it does not expect.
 */
function parseTag(source: string): ParsedTag | null {
  const match = /^<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)/.exec(source);
  if (!match) return null;
  const tag: ParsedTag = {
    closing: match[1] === "/",
    name: match[2].toLowerCase(),
    selfClosing: false,
    attributes: {},
    end: source.length,
  };

  let cursor = match[0].length;
  while (cursor < source.length) {
    const char = source[cursor];
    if (/\s|\//.test(char)) {
      cursor += 1;
      continue;
    }
    if (char === ">") {
      tag.selfClosing = source[cursor - 1] === "/";
      tag.end = cursor + 1; // the whole tag, so the caller never re-reads an attribute value
      cursor += 1;
      break;
    }

    const nameMatch = /^[a-zA-Z0-9_:.-]+/.exec(source.slice(cursor));
    if (!nameMatch) {
      cursor += 1;
      continue;
    }
    const attrName = nameMatch[0].toLowerCase();
    cursor += nameMatch[0].length;

    const eqMatch = /^\s*=/.exec(source.slice(cursor));
    if (!eqMatch) {
      tag.attributes[attrName] = ""; // a bare attribute (`checked`) still consumes its name
      continue;
    }
    cursor += eqMatch[0].length; // eqMatch already includes the "=", so do not step past it

    const quote = source[cursor];
    if (quote === '"' || quote === "'") {
      cursor += 1;
      const end = source.indexOf(quote, cursor);
      const stop = end === -1 ? source.length : end;
      tag.attributes[attrName] = source.slice(cursor, stop);
      cursor = stop + 1;
    } else {
      const bareMatch = /^[^\s>]*/.exec(source.slice(cursor));
      tag.attributes[attrName] = bareMatch ? bareMatch[0] : "";
      cursor += bareMatch ? bareMatch[0].length : 0;
    }
  }
  return tag;
}

/**
 * Markup the site is willing to print, from markup it did not write.
 *
 * Runs on the server (these pages are React Server Components, so there is no DOMParser and no
 * client-only sanitizer such as DOMPurify), which is why this is a tokenizer over a small tag set
 * rather than a browser API. Unrecognised tags vanish and their text is escaped, so an injected
 * `<script>` becomes inert prose; every attribute is rebuilt from the allowlist, so `on*`, `style`,
 * `srcdoc`, `formaction`, `xlink:href` and `data-*` never reach the document.
 */
export function sanitizeHtml(value?: string | null): string {
  if (!value) return "";
  const source = String(value).replace(/\r/g, "");
  const out: string[] = [];
  // Tracks whether the only currently-open tag is still allowed, so a nested `<script><p>` cannot
  // re-open a paragraph inside a dropped element.
  const openStack: string[] = [];
  let skipping: string | null = null;
  let index = 0;

  while (index < source.length) {
    const next = source.indexOf("<", index);
    if (next === -1) {
      out.push(skipping ? "" : escapeText(source.slice(index)));
      break;
    }
    if (next > index && !skipping) out.push(escapeText(source.slice(index, next)));

    // Comments, CDATA and doctypes are removed whole: `<!--><script>` is a classic parser break.
    if (source.startsWith("<!--", next)) {
      const end = source.indexOf("-->", next + 4);
      index = end === -1 ? source.length : end + 3;
      continue;
    }
    if (source.startsWith("<!", next) || source.startsWith("<?", next)) {
      const end = source.indexOf(">", next);
      index = end === -1 ? source.length : end + 1;
      continue;
    }

    const tag = parseTag(source.slice(next));
    if (!tag) {
      // A stray "<" that opens nothing: escape it and keep going.
      if (!skipping) out.push("&lt;");
      index = next + 1;
      continue;
    }

    index = next + tag.end;

    if (skipping) {
      if (tag.closing && tag.name === skipping) skipping = null;
      continue;
    }

    if (tag.name === "script" || tag.name === "style" || tag.name === "iframe" || tag.name === "object" || tag.name === "embed" || tag.name === "template" || tag.name === "svg" || tag.name === "math") {
      if (!tag.closing && !tag.selfClosing) skipping = tag.name;
      continue;
    }

    const allowedAttributes = ALLOWED_TAGS[tag.name];
    if (allowedAttributes === undefined) continue; // unknown tag: drop the markup, keep its text

    if (tag.closing) {
      const position = openStack.lastIndexOf(tag.name);
      if (position === -1) continue;
      while (openStack.length > position) {
        const open = openStack.pop();
        if (open) out.push(`</${open}>`);
      }
      continue;
    }

    out.push(renderOpenTag(tag, allowedAttributes));
    if (!VOID_TAGS.has(tag.name) && !tag.selfClosing) openStack.push(tag.name);
  }

  while (openStack.length) {
    const open = openStack.pop();
    if (open) out.push(`</${open}>`);
  }

  return out.join("");
}

function renderOpenTag(tag: ParsedTag, allowedAttributes: readonly string[]): string {
  const parts: string[] = [];
  for (const name of allowedAttributes) {
    if (!(name in tag.attributes)) continue;
    const rawValue = tag.attributes[name];
    if (name === "href" || name === "src") {
      const safe = safeHref(rawValue, name === "src" ? "src" : "href");
      if (!safe) continue; // a link that is not http(s) is dropped rather than neutered
      parts.push(`${name}="${escapeAttribute(safe)}"`);
      continue;
    }
    if (name === "datetime") {
      // Only ever a date or date-time; nothing else can be interpreted as a URL or script.
      const trimmed = collapseForSchemeCheck(decodeEntities(rawValue)).slice(0, 40);
      if (!/^[0-9TZ:.+-]+$/i.test(trimmed)) continue;
      parts.push(`datetime="${escapeAttribute(trimmed)}"`);
      continue;
    }
    if (name === "start" || name === "colspan" || name === "rowspan") {
      const digits = decodeEntities(rawValue).replace(/[^\d]/g, "").slice(0, 4);
      if (!digits) continue;
      parts.push(`${name}="${digits}"`);
      continue;
    }
    const text = decodeEntities(rawValue).replace(/[\u0000-\u001f]/g, " ").slice(0, 300);
    parts.push(`${name}="${escapeAttribute(text)}"`);
  }

  // A link opening a document the site does not control must not be able to rewrite the opener.
  if (tag.name === "a") {
    parts.push('target="_blank"');
    parts.push('rel="noopener noreferrer nofollow ugc"');
  }

  const head = `<${tag.name}${parts.length ? " " + parts.join(" ") : ""}`;
  if (VOID_TAGS.has(tag.name) || tag.selfClosing) return `${head} />`;
  return `${head}>`;
}

/**
 * JSON for the inside of a `<script>` element.
 *
 * `JSON.stringify` escapes quotes but not `<`, so one article title containing `</script>` ends the
 * tag and turns the rest of the page into executable markup. U+2028/U+2029 are valid in JSON but
 * were line terminators in JavaScript parsers.
 */
export function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/** Plain text out of markup, for titles, labels and alt text. */
export function htmlToText(value?: string | null): string {
  if (!value) return "";
  return decodeEntities(String(value).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}
