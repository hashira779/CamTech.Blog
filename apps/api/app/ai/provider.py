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


class BaseAIProvider:
    async def generate_draft_editorial(self, title: str, source_content: str, source_name: str) -> Dict[str, Any]:
        raise NotImplementedError

    async def classify_category(self, title: str, content: str) -> str:
        raise NotImplementedError

    async def generate_quiz_draft(self, topic: str) -> Dict[str, Any]:
        raise NotImplementedError


class LocalAIProvider(BaseAIProvider):
    """
    Deterministic local extraction and structured draft generator.
    Works reliably without external API dependencies, creating safe, attributed editorial drafts.
    """
    async def generate_draft_editorial(self, title: str, source_content: str, source_name: str) -> Dict[str, Any]:
        clean_content = re.sub(r"<[^>]+>", " ", source_content)
        sentences = [s.strip() for s in re.split(r"[.!?]+", clean_content) if len(s.strip()) > 20]
        attribution = f"According to reporting from {source_name}"

        if sentences:
            summary = f"{attribution}, {sentences[0].lower()}."
            if len(sentences) > 1:
                summary += " The development highlights key ongoing shifts in the sector."
        else:
            summary = f"{attribution}, significant developments were reported regarding {title}."

        key_points = [f"Documented report: {s}" for s in sentences[1:4]]
        if not key_points:
            key_points = [
                f"Initial coverage provided by {source_name}.",
                "Official statements and documentation are being monitored.",
                "Further regional developments are expected to follow.",
            ]

        why_it_matters = (
            f"This event represents an important indicator for stakeholders following regional and sector-specific "
            f"trends. As noted by {source_name}, sustained monitoring will clarify long-term impacts."
        )

        return {
            "summary": summary,
            "key_points": key_points,
            "why_it_matters": why_it_matters,
            "suggested_tags": [source_name, "Verified Reporting", "Current Affairs"],
            "seo_title": f"{title} | Daily Discovery News Analysis"[:60],
            "seo_description": summary[:155],
            "ai_draft_status": "AI_DRAFT_PENDING_EDITOR_REVIEW",
            "engine": "local",
        }

    async def classify_category(self, title: str, content: str) -> str:
        text = (title + " " + content).lower()
        if any(w in text for w in ["phnom penh", "cambodia", "siem reap", "khmer", "ministry", "angkor"]):
            return "Cambodia"
        if any(w in text for w in ["ai", "software", "tech", "gadget", "cyber", "apple", "google", "semiconductor", "chip"]):
            return "Technology"
        if any(w in text for w in ["market", "economy", "bank", "inflation", "trade", "investment", "stock", "gdp"]):
            return "Business"
        if any(w in text for w in ["planet", "nasa", "physics", "climate", "biology", "science", "space", "health"]):
            return "Science"
        if any(w in text for w in ["travel", "tourism", "hotel", "resort", "flight", "destination", "heritage"]):
            return "Travel"
        return "World"

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
            raise RuntimeError("No AI provider produced an editorial draft")
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
            logger.debug(f"Gateway editorial draft unavailable ({e}), using local extraction fallback.")
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
