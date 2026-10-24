"""
AI Provider — the editorial assistant used by RSS ingestion and source previews.

It now delegates to the multi-provider AI Gateway (see app/services/ai_gateway.py):
any enabled provider with a key (Gemini, OpenAI, Anthropic, Groq, ...) can produce the
draft; if none succeeds it transparently falls back to the deterministic LocalAIProvider so
the ingestion pipeline never crashes. Drafts authored by a real provider are stamped with a
trusted engine (e.g. "openai:gpt-4o-mini") so the News Autopilot can auto-publish them;
local-extraction fallbacks are stamped "local" and are held for manual review.
"""
import json
import re
import logging
import asyncio
from typing import Dict, Any, List, Optional

from app.services import ai_gateway

logger = logging.getLogger(__name__)


def _match_text(value) -> str:
    """Lowercased, entity-free, single-spaced text for keyword matching."""
    return re.sub(r"\s+", " ", str(value or "").lower())


def _has_word(text: str, word: str) -> bool:
    """Whole-word (prefix-tolerant) match.

    Signals are matched on word boundaries so "ai" no longer fires on "said", "email",
    "domain" or "campaign" — the substring bug that filed most of the feed as Technology.
    Short tokens still need a boundary; longer ones may match a stem ("invest" -> "investment").
    """
    if not text or not word:
        return False
    if len(word) >= 6:
        return word in text
    return re.search(rf"(?<![a-z0-9]){re.escape(word)}(?![a-z0-9])", text) is not None


class BaseAIProvider:
    async def generate_draft_editorial(self, title: str, source_content: str, source_name: str) -> Dict[str, Any]:
        raise NotImplementedError

    async def classify_category(self, title: str, content: str) -> str:
        raise NotImplementedError

    async def generate_quiz_draft(self, topic: str) -> Dict[str, Any]:
        raise NotImplementedError


class LocalAIProvider(BaseAIProvider):
    """
    Deterministic local extraction used when no AI provider answers.

    This engine has no model behind it, so it must not write editorial prose. It only
    copies sentences that the publisher actually printed, in their original casing. The
    old version stamped "According to reporting from {source}", force-lowercased the
    publisher's first sentence ("...created with ai"), added a filler sentence the source
    never wrote, and invented a why-it-matters paragraph — 77 of 81 stored summaries were
    that template. An empty extract is honest and gets held for review; a padded one ships
    fabricated copy to readers.
    """

    # Whole-word signals. The previous version tested substrings in a fixed order, so
    # "ai" matched "said"/"email"/"campaign" and most of the feed was filed Technology,
    # while a bare "ministry" pulled world politics onto the Cambodia desk.
    _CATEGORY_SIGNALS: List[tuple] = [
        ("Cambodia", [
            "cambodia", "cambodian", "phnom penh", "siem reap", "khmer", "angkor",
            "asean", "mekong", "kratie", "mondulkiri", "ratanakiri", "preah vihear",
            "sihanouk", "kampong", "kampot", "battambang", "pursat", "bavet",
            "bakong", "funan", "hunsen", "hun manet", "soc son", "khmer times",
        ]),
        ("Technology", [
            "ai", "artificial intelligence", "software", "tech", "technology", "gadget",
            "cyber", "apple", "google", "semiconductor", "chip", "chips", "datacenter",
            "data centre", "llm", "startup", "broadband", "5g", "smartphone", "android",
            "microsoft", "nvidia", "openai", "satellite", "robot", "robotics",
        ]),
        ("Business", [
            "market", "markets", "economy", "economic", "bank", "banks", "inflation",
            "trade", "investment", "investments", "stock", "stocks", "gdp", "exports",
            "import", "currency", "riel", "earnings", "revenue", "funding", "raises",
            "acquisition", "merger", "budget", "wage", "wages",
        ]),
        ("Science", [
            "planet", "nasa", "physics", "climate", "biology", "science", "scientific",
            "space", "telescope", "research", "study", "studies", "health", "disease",
            "vaccine", "gene", "genome", "fossil", "archaeolog", "astronom", "quantum",
        ]),
        ("Travel", [
            "travel", "tourism", "tourists", "hotel", "hotels", "resort", "flight",
            "flights", "destination", "heritage", "visa", "airline", "airport",
            "arrivals", "itinerary", "cruise",
        ]),
    ]

    _ENTITIES = {
        "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'",
        "&lt;": "<", "&gt;": ">", "&ndash;": "-", "&mdash;": "—", "&rsquo;": "'",
        "&lsquo;": "'", "&ldquo;": '"', "&rdquo;": '"', "&hellip;": "…",
    }

    # Runs a publisher uses for their own boilerplate, not for reporting.
    _NOISE_SENTENCES = re.compile(
        r"^(click|read more|sign up|subscribe|follow us|join the conversation|share this|related|comments?|advertisement|sponsored)",
        re.I,
    )

    @classmethod
    def _plain_text(cls, value: str) -> str:
        """Strip markup and untangle HTML entities before anything is split or shown."""
        # Entities first: a feed-escaped "&lt;div&gt;" must not survive decoding and then
        # be removed as markup, or publisher boilerplate reaches the page as literal "<div>".
        text = str(value or "")
        for entity, char in cls._ENTITIES.items():
            text = text.replace(entity, char)
        text = re.sub(r"&#(\d+);", lambda m: chr(int(m.group(1))) if int(m.group(1)) < 1114112 else " ", text)
        text = re.sub(r"<[^>]+>", " ", text)
        return re.sub(r"\s+", " ", text).strip()

    @classmethod
    def _sentences(cls, text: str) -> List[str]:
        """Publisher sentences, verbatim. No rewriting, no case changes, no added filler."""
        out: List[str] = []
        for part in re.split(r"(?<=[.!?])\s+", cls._plain_text(text)):
            sentence = part.strip()
            if len(sentence) < 30 or sentence.count(" ") < 4:
                continue
            if cls._NOISE_SENTENCES.match(sentence):
                continue
            out.append(sentence)
        return out

    @classmethod
    def _restore_case(cls, sentence: str, title: str) -> str:
        """Re-capitalise proper nouns the old template lowercased, using the publisher's own title."""
        if sentence[:1].isupper():
            return sentence
        words = sentence.split(" ")
        title_words = {w for w in re.findall(r"[A-Za-z][A-Za-z0-9'-]{2,}", title or "")}
        if words:
            head = words[0]
            match = next((t for t in title_words if t.lower() == head.lower()), None)
            if match:
                words[0] = match
        restored = " ".join(words)
        for word in title_words:
            restored = re.sub(rf"\b{re.escape(word.lower())}\b", word, restored)
        return restored[:1].upper() + restored[1:]

    async def generate_draft_editorial(self, title: str, source_content: str, source_name: str) -> Dict[str, Any]:
        sentences = self._sentences(source_content)
        if not sentences:
            # Nothing quotable arrived. Leave the fields empty: the quality gate holds the
            # draft instead of shipping an invented summary, and the UI hides blank sections.
            return {
                "summary": "",
                "key_points": [],
                "why_it_matters": "",
                "suggested_tags": [],
                "seo_title": (title or "")[:60],
                "seo_description": (title or "")[:155],
                "ai_draft_status": "AI_DRAFT_PENDING_EDITOR_REVIEW",
                "engine": "local",
                "extracted": False,
            }

        summary = self._restore_case(sentences[0], title)
        if len(summary) > 320:
            summary = summary[:320].rsplit(" ", 1)[0] + "…"

        return {
            "summary": summary,
            "key_points": [self._restore_case(s, title) for s in sentences[1:4]],
            "why_it_matters": "",
            "suggested_tags": [],
            "seo_title": (title or "")[:60],
            "seo_description": summary[:155],
            "ai_draft_status": "AI_DRAFT_PENDING_EDITOR_REVIEW",
            "engine": "local",
            "extracted": True,
        }

    async def classify_category(self, title: str, content: str) -> str:
        text = _match_text(title + " " + content)
        headline = _match_text(title)
        scores: Dict[str, int] = {}
        for category, words in LocalAIProvider._CATEGORY_SIGNALS:
            score = 0
            for word in words:
                if _has_word(headline, word):
                    score += 3
                elif _has_word(text, word):
                    score += 1
            if score:
                scores[category] = score
        if not scores:
            return "World"
        best = max(scores.items(), key=lambda kv: kv[1])[0]
        # Cambodia outranks a generic vertical when the two are within one point of each
        # other: a Bakong payment story is Cambodia news before it is Business news.
        # The story must name Cambodia at all: with a lone body hit elsewhere (score 1), a zero
        # Cambodia score is also "within one point", which filed Singapore and Bangkok stories
        # on the Cambodia desk.
        cambodia = scores.get("Cambodia", 0)
        if best != "Cambodia" and cambodia > 0 and cambodia >= max(scores.values()) - 1:
            return "Cambodia"
        return best

    async def generate_quiz_draft(self, topic: str) -> Dict[str, Any]:
        return {
            "title": f"Quick Knowledge Challenge: {topic}",
            "description": f"Test your understanding of {topic} with factual, educational questions.",
            "category": "Science",
            "questions": [
                {
                    "question": f"What is a primary documented principle behind {topic}?",
                    "choices": [
                        "Established empirical observations verified through research",
                        "Random statistical fluctuations",
                        "Unsubstantiated claims",
                        "None of the above",
                    ],
                    "correct_answer_idx": 0,
                    "explanation": f"Factual understanding of {topic} is based on verified scientific principles and empirical research.",
                    "source_reference": "Encyclopedia Britannica",
                }
            ],
        }


class GeminiAIProvider(BaseAIProvider):
    """
    Backwards-compatible name for the real-model provider; now backed by the multi-provider
    AI Gateway so any configured vendor (not just Google) can answer, with automatic fallback.
    Raises when no provider succeeds, letting HybridAIProvider fall back to the local engine.
    """
    VALID_CATEGORIES = ["Cambodia", "Technology", "World", "Business", "Science", "Travel"]

    async def generate_draft_editorial(self, title: str, source_content: str, source_name: str) -> Dict[str, Any]:
        clean_content = re.sub(r"<[^>]+>", " ", source_content)[:3000]
        prompt = f"""You are an elite, neutral news editor for Daily Discovery / CamTech.
A verified source ({source_name}) published the following article:
Title: {title}
Content snippet: {clean_content}

Write a professional editorial draft as JSON with keys:
summary (2-sentence original summary attributing to {source_name}),
key_points (3-4 factual takeaways), why_it_matters (2-3 sentences of context),
suggested_tags (3-5 tags), seo_title (max 60 chars), seo_description (max 155 chars).
Return only valid JSON."""
        data, meta = await asyncio.to_thread(ai_gateway.generate_json, prompt, use_search=False, timeout=25.0)
        if not isinstance(data, dict):
            raise RuntimeError(f"No AI provider produced an editorial draft: {(meta or {}).get('details') or (meta or {}).get('error') or 'unparseable response'}")
        data.setdefault("ai_draft_status", "AI_DRAFT_PENDING_EDITOR_REVIEW")
        data["engine"] = (meta or {}).get("engine", "gemini")
        return data

    async def classify_category(self, title: str, content: str) -> str:
        prompt = (
            "Classify the following news item into EXACTLY ONE of these categories: "
            + ", ".join(self.VALID_CATEGORIES)
            + f".\nNews Title: {title}\nSnippet: {content[:500]}\n"
            + "Respond with ONLY the exact category name, nothing else."
        )
        text, _meta = await asyncio.to_thread(ai_gateway.generate_text, prompt, use_search=False, timeout=12.0)
        if not text:
            raise RuntimeError("No AI provider could classify the item")
        cat = text.strip().title()
        for v in self.VALID_CATEGORIES:
            if v.lower() in cat.lower():
                return v
        return "World"

    async def generate_quiz_draft(self, topic: str) -> Dict[str, Any]:
        prompt = (
            f"Generate a high-quality educational quiz challenge on '{topic}'. "
            "Include 3 questions with 4 choices each, the correct choice index (0-3), and a clear "
            "educational explanation. Return JSON with: title, description, category, "
            "questions (each having question, choices (4 strings), correct_answer_idx, explanation, source_reference)."
        )
        data, _meta = await asyncio.to_thread(ai_gateway.generate_json, prompt, use_search=False, timeout=25.0)
        if not isinstance(data, dict):
            raise RuntimeError("No AI provider produced a quiz draft")
        return data


class HybridAIProvider(BaseAIProvider):
    """
    Try a real AI model via the Gateway first for top-tier drafting; gracefully and
    transparently fall back to LocalAIProvider when offline or unconfigured.
    Guarantees that the pipeline NEVER crashes.
    """
    def __init__(self):
        self.gemini = GeminiAIProvider()
        self.local = LocalAIProvider()

    async def generate_draft_editorial(self, title: str, source_content: str, source_name: str) -> Dict[str, Any]:
        try:
            return await self.gemini.generate_draft_editorial(title, source_content, source_name)
        except Exception as e:
            logger.warning(f"Gateway editorial draft unavailable ({e}), using local extraction fallback.")
            return await self.local.generate_draft_editorial(title, source_content, source_name)

    async def classify_category(self, title: str, content: str) -> str:
        try:
            return await self.gemini.classify_category(title, content)
        except Exception as e:
            logger.debug(f"Gateway classification unavailable ({e}), using local classification fallback.")
            return await self.local.classify_category(title, content)

    async def generate_quiz_draft(self, topic: str) -> Dict[str, Any]:
        try:
            return await self.gemini.generate_quiz_draft(topic)
        except Exception as e:
            logger.debug(f"Gateway quiz draft unavailable ({e}), using local quiz fallback.")
            return await self.local.generate_quiz_draft(topic)


_provider_instance = HybridAIProvider()


def get_ai_provider() -> BaseAIProvider:
    return _provider_instance
