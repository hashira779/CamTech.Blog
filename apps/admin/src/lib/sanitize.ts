/**
 * Every URL in this app that reaches an `href` or a `src` came from somewhere else: an RSS feed
 * picked up by the ingestion worker, an AI generator, a photo-search result, or a row another
 * editor saved. None of them were written here, so none of them are trusted here.
 *
 * The public site enforces the same rule in `apps/web/src/lib/sanitize.ts`. This is the newsroom
 * half of it, and it matters for a different reason: an editor clicking a link in the review
 * queue is a person with an admin session in the same browser. A `javascript:` href stored in
 * `primary_source_url` is inert in a reader's view of the site and lethal when clicked from the
 * admin page that shows the same value.
 *
 * Two rules, no dependencies: a scheme a browser may navigate to, and nothing else.
 */

const HREF_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const IMAGE_PROTOCOLS = new Set(["http:", "https:"]);

/** `&#106;avascript:` and `java\tscript:` are the same string to a browser. */
function collapseForSchemeCheck(value: string): string {
  return decodeEntities(value).replace(/[\u0000-\u0020\u007f-\u009f\s]+/g, "");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/gi, "&")
    .replace(/&(?:lt|gt|quot|#39);/gi, (m) =>
      m.toLowerCase() === "&lt;" ? "<" : m.toLowerCase() === "&gt;" ? ">" : m.toLowerCase() === "&quot;" ? '"' : "'",
    );
}

function protocolOf(value: string): string {
  const candidate = collapseForSchemeCheck(value).toLowerCase();
  const colon = candidate.indexOf(":");
  if (colon <= 0) return "";
  if (/[/?#]/.test(candidate.slice(0, colon))) return "";
  return /^[a-z][a-z0-9+.-]*:$/.test(candidate.slice(0, colon + 1)) ? candidate.slice(0, colon + 1) : "";
}

/** The value if a click may be built from it, otherwise an empty string — render the text, not the link. */
export function safeHref(value?: string | null): string {
  const raw = (value || "").trim();
  if (!raw || raw.length > 500) return "";
  const protocol = protocolOf(raw);
  if (protocol) return HREF_PROTOCOLS.has(protocol) ? raw : "";
  // Protocol-relative (`//host/x`) inherits the page's own origin, so nothing has checked the host.
  if (raw.startsWith("//")) return "";
  // A site-local path is fine; `example.com/story` without a scheme is not — the browser would
  // resolve it against this app's origin and the editor would click through to a 404.
  return /^(?:\/|#|\?)/.test(raw) ? raw : "";
}

/** Same rule for an image: remote http(s) or a path on this origin, never a scheme with side effects. */
export function safeImageSrc(value?: string | null): string {
  const raw = (value || "").trim();
  if (!raw || raw.length > 500) return "";
  const protocol = protocolOf(raw);
  if (protocol) return IMAGE_PROTOCOLS.has(protocol) ? raw : "";
  if (raw.startsWith("//")) return "";
  return /^(?:\/|\?)/.test(raw) ? raw : "";
}
