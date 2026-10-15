"""Markup and link hygiene for text that arrives from outside this repository.

The public site renders article bodies and discovery text through an allowlist sanitizer
(`apps/web/src/lib/sanitize.ts`), which is what actually protects a reader. This module is the
second half of the same rule at the other end of the pipe: what a feed or a model hands us is
stored, edited, re-fed into generators, exported through RSS, and read by scripts that do not go
through a React renderer. A `javascript:` link or an `<img onerror>` should not be sitting in the
database in the first place.

Both sides exist on purpose. The renderer cannot trust the row, and the row cannot trust the
renderer.
"""

import html
import re
import urllib.parse
from typing import Optional

# A link a reader may follow. `data:` is excluded even though browsers support it, because a
# `data:text/html` body is a page we did not write; `file:` and `ftp:` reach the reader's own disk.
SAFE_SCHEMES = {"http", "https", "mailto"}

# Tags whose *presence* is the payload, not just their attributes: they execute, redirect, or
# re-parent the document. Their contents go with them.
DROP_WITH_CONTENT = ("script", "style", "iframe", "object", "embed", "template", "svg", "math", "noscript")

# Tags that carry no readable content of their own and only ever do something.
DROP_EMPTY = ("form", "input", "button", "textarea", "select", "option", "base", "meta", "link", "frame", "frameset")

# `on*` covers every event handler; `srcdoc`, `xlink:href`, `formaction`, `data-*` and `style` are
# the other ways a browser is talked into running something.
_DANGEROUS_ATTRS = re.compile(
    r"""\s+(?:on[a-z]+\s*=|srcdoc\s*=|xlink:href\s*=|formaction\s*=|action\s*=|dynsrc\s*=|lowsrc\s*=|style\s*=)
    (?:"[^"]*"|'[^']*'|[^\s>]+)?""",
    re.IGNORECASE | re.VERBOSE,
)

# No space is allowed between `<` and the tag name. Browsers follow the spec here — `<` must be
# followed by a letter to start a tag — and so must this pattern, otherwise ordinary editorial
# prose such as "turnout trailed, 40 < 50 per cent and the margin > 3" gets rewritten as markup.
_TAG = re.compile(r"</?([a-zA-Z][a-zA-Z0-9:-]*)((?:[^>\"']|\"[^\"]*\"|'[^']*')*)>", re.DOTALL)
_ATTR_WITH_VALUE = re.compile(r"""([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))""")

_MAX_LENGTH = 200_000


def _scheme_of(url: str) -> str:
    """The scheme a browser would see: entities decoded, control characters removed."""
    cleaned = html.unescape(url or "")
    cleaned = "".join(ch for ch in cleaned if not (ord(ch) <= 0x20 or ord(ch) == 0x7F))
    if cleaned.lower().startswith("//"):
        return "//"
    colon = cleaned.find(":")
    if colon <= 0:
        return ""
    candidate = cleaned[:colon].lower()
    # A colon that appears after the first `/`, `?` or `#` is part of a path or a port, not a scheme.
    if re.search(r"[/?#]", cleaned[:colon]):
        return ""
    return candidate if re.fullmatch(r"[a-z][a-z0-9+.\-]*", candidate) else ""


def safe_link(url: Optional[str], *, allow_relative: bool = True) -> Optional[str]:
    """
    The URL if a reader may follow it, otherwise None.

    Relative and protocol-free values are kept only when `allow_relative` is set: an article's
    `primary_source_url` must name a publisher, so a bare `example.com/story` is refused there,
    while a site-local `/travel/place/angkor-wat` stays valid.
    """
    if not url or not isinstance(url, str):
        return None
    cleaned = html.unescape(url.strip())
    cleaned = "".join(ch for ch in cleaned if not (ord(ch) <= 0x20 or ord(ch) == 0x7F))
    if not cleaned:
        return None

    scheme = _scheme_of(cleaned)
    if scheme:
        if scheme not in SAFE_SCHEMES:
            return None
        return cleaned[:500]

    if not allow_relative:
        return None
    if cleaned.startswith("//"):
        # Protocol-relative: the browser resolves it against whatever origin the page happens to be
        # on, so nothing here has validated the host.
        return None
    if cleaned.startswith("/") or cleaned.startswith("#") or cleaned.startswith("?"):
        return cleaned[:500]
    # A scheme-less value such as `example.com/news` would be stored as a path and 404 on our own
    # origin. Not a security failure, but not the attribution the reader was promised either.
    return None


def sanitize_stored_html(value: Optional[str]) -> str:
    """
    Markup that is safe to keep, from markup that was sent to us.

    Deliberately coarser than the renderer's allowlist: the CMS stores real `<p>`, `<a>`, `<strong>`
    and lists, and rewriting them here would destroy the article. What is removed is what executes:
    script-bearing tags with their contents, control-only tags, every event handler and `style`
    attribute, and any `href`/`src` whose scheme a reader must not follow.
    """
    if not value or not isinstance(value, str):
        return ""
    source = value[:_MAX_LENGTH]

    for tag in DROP_WITH_CONTENT:
        source = re.sub(
            rf"<{tag}\b[^>]*>.*?(?:</{tag}\s*>|$)",
            "",
            source,
            flags=re.IGNORECASE | re.DOTALL,
        )
        source = re.sub(rf"</?{tag}\b[^>]*>", "", source, flags=re.IGNORECASE | re.DOTALL)
    for tag in DROP_EMPTY:
        source = re.sub(rf"</?{tag}\b[^>]*>", "", source, flags=re.IGNORECASE | re.DOTALL)

    # `<!-- -->` can hide the `<script` a parser would otherwise see, and conditional comments are
    # an instruction to the parser.
    source = re.sub(r"<!--.*?-->", "", source, flags=re.DOTALL)
    source = re.sub(r"<!\[CDATA\[.*?\]\]>", "", source, flags=re.DOTALL)
    source = re.sub(r"<(!|\?)[^>]*>", "", source, flags=re.DOTALL)

    def _clean_tag(match: re.Match) -> str:
        closing = match.group(0)[:2] == "</"
        name = match.group(1)
        rest = match.group(2) or ""
        if closing:
            return f"</{name}>"

        # Keyed by attribute name so a row that has already been through here once comes out
        # identical the second time; an editor saving a story twice must not accumulate markup.
        attrs: dict[str, str] = {}
        for attr in _ATTR_WITH_VALUE.finditer(rest):
            key = attr.group(1).lower()
            raw = attr.group(2) or attr.group(3) or attr.group(4) or ""
            if key.startswith("on") or key in {"srcdoc", "formaction", "action", "style", "xlink:href", "data", "dynsrc", "lowsrc"}:
                continue
            if key in {"href", "src"}:
                # Article bodies never legitimately link to a site-local path, and a scheme a reader
                # must not follow has to go; the text of the link is preserved.
                target = safe_link(raw, allow_relative=False)
                if not target:
                    continue
                attrs[key] = f'{key}="{html.escape(target, quote=True)}"'
                continue
            if key == "datetime":
                if not re.fullmatch(r"[0-9TZ:.+\-]{4,40}", raw.strip()):
                    continue
            if key in {"colspan", "rowspan", "start"}:
                digits = re.sub(r"\D", "", raw)[:4]
                if not digits:
                    continue
                attrs[key] = f'{key}="{digits}"'
                continue
            value_text = html.unescape(raw).strip()[:300]
            if not value_text:
                continue
            attrs[key] = f'{key}="{html.escape(value_text, quote=True)}"'

        # A syndicated link opens its own document and must not be able to script the page it came
        # from, so the relationship attributes are set here rather than trusted to the feed. Both
        # are assigned, not defaulted: a feed that shipped `target="_top"` is asking to navigate
        # the newsroom's own window, and a feed that shipped its own `rel` still has to be fenced.
        if name == "a" and "href" in attrs:
            attrs["target"] = 'target="_blank"'
            attrs["rel"] = 'rel="noopener noreferrer nofollow ugc"'

        return f"<{name}{' ' + ' '.join(attrs.values()) if attrs else ''}>"

    return _TAG.sub(_clean_tag, source)


def strip_for_text(value: Optional[str]) -> str:
    """Plain text out of markup — for a summary, an alt string or a log line."""
    if not value:
        return ""
    without_tags = re.sub(r"<[^>]*>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(without_tags)).strip()
