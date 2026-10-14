import json
import re
import logging
import asyncio
from typing import Dict, Any, List, Optional

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

from app.common.config import settings
from app.common.database import SessionLocal
from app.models.audit import SiteSetting

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
        # Clean text
        clean_content = re.sub(r"<[^>]+>", " ", source_content)
        sentences = [s.strip() for s in re.split(r"[.!?]+", clean_content) if len(s.strip()) > 20]
        
        # Attribution prefix
        attribution = f"According to reporting from {source_name}"
        
        # Generate original editorial summary
        if sentences:
            summary = f"{attribution}, {sentences[0].lower()}."
            if len(sentences) > 1:
                summary += f" The development highlights key ongoing shifts in the sector."
        else:
            summary = f"{attribution}, significant developments were reported regarding {title}."

        # Extract 3-4 key bullet points
        key_points = []
        for s in sentences[1:4]:
            key_points.append(f"Documented report: {s}")
        if not key_points:
            key_points = [
                f"Initial coverage provided by {source_name}.",
                "Official statements and documentation are being monitored.",
                "Further regional developments are expected to follow."
            ]

        # Why it matters
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
                        "None of the above"
                    ],
                    "correct_answer_idx": 0,
                    "explanation": f"Factual understanding of {topic} is based on verified scientific principles and empirical research.",
                    "source_reference": "Encyclopedia Britannica"
                }
            ]
        }


class GeminiAIProvider(BaseAIProvider):
    """
    Google Gemini AI provider with multi-model fallback and structured output.
    """
    def _get_client(self):
        if genai is None:
            return None
        api_key = settings.AI_API_KEY
        if not api_key:
            db = SessionLocal()
            try:
                setting = db.query(SiteSetting).filter(SiteSetting.key == 'GEMINI_API_KEY').first()
                if setting and setting.value_json:
                    api_key = setting.value_json.strip()
            finally:
                db.close()
        if not api_key:
            return None
        return genai.Client(api_key=api_key)

    def _get_models(self) -> List[str]:
        preferred = []
        if settings.AI_MODEL_NAME and not any(fake in settings.AI_MODEL_NAME for fake in ["3.8", "3.5", "3.0", "3.1"]):
            preferred.append(settings.AI_MODEL_NAME)
        preferred.extend(['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'])
        return list(dict.fromkeys(preferred))

    async def generate_draft_editorial(self, title: str, source_content: str, source_name: str) -> Dict[str, Any]:
        client = self._get_client()
        if not client:
            raise ValueError("Gemini client not configured")

        clean_content = re.sub(r"<[^>]+>", " ", source_content)[:3000]
        prompt = f"""You are an elite, neutral news editor for Daily Discovery / CamTech.
A verified source ({source_name}) published the following article:
Title: {title}
Content snippet: {clean_content}

Write a professional editorial draft with:
1. summary: A clean, objective, original 2-sentence summary attributing to {source_name}.
2. key_points: Array of 3-4 factual key takeaways from the event.
3. why_it_matters: A 2-3 sentence analytical paragraph explaining the broader context and importance.
4. suggested_tags: Array of 3-5 tags.
5. seo_title: Catchy, clear headline (max 60 chars).
6. seo_description: Meta description (max 155 chars).

Return valid JSON with keys: summary, key_points, why_it_matters, suggested_tags, seo_title, seo_description.
"""
        models = self._get_models()
        for m in models:
            try:
                def _call(model_name=m):
                    return client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.3,
                            response_mime_type="application/json"
                        )
                    )
                res = await asyncio.wait_for(asyncio.to_thread(_call), timeout=15.0)
                data = json.loads(res.text)
                if not isinstance(data, dict):
                    raise ValueError("Gemini returned non-object JSON")
                data["ai_draft_status"] = "AI_DRAFT_PENDING_EDITOR_REVIEW"
                data["engine"] = "gemini"
                return data
            except Exception as e:
                logger.warning(f"Gemini model {m} editorial draft error: {e}")
                continue

        raise RuntimeError("All Gemini models failed to generate editorial draft")

    async def classify_category(self, title: str, content: str) -> str:
        client = self._get_client()
        if not client:
            raise ValueError("Gemini client not configured")

        prompt = f"""Classify the following news item into EXACTLY ONE of these categories:
- Cambodia
- Technology
- World
- Business
- Science
- Travel

News Title: {title}
Snippet: {content[:500]}

Respond with ONLY the exact category name, nothing else.
"""
        models = self._get_models()
        for m in models:
            try:
                def _call(model_name=m):
                    return client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(temperature=0.0)
                    )
                res = await asyncio.wait_for(asyncio.to_thread(_call), timeout=8.0)
                cat = res.text.strip().title()
                valid = ["Cambodia", "Technology", "World", "Business", "Science", "Travel"]
                for v in valid:
                    if v.lower() in cat.lower():
                        return v
                return "World"
            except Exception as e:
                logger.warning(f"Gemini model {m} classification error: {e}")
                continue

        raise RuntimeError("All Gemini models failed category classification")

    async def generate_quiz_draft(self, topic: str) -> Dict[str, Any]:
        client = self._get_client()
        if not client:
            raise ValueError("Gemini client not configured")

        prompt = f"""Generate a high-quality educational quiz challenge on '{topic}'.
Include 3 questions with 4 choices each, the correct choice index (0-3), and a clear educational explanation.
Return JSON with: title, description, category, questions (each having question, choices, correct_answer_idx, explanation, source_reference).
"""
        models = self._get_models()
        for m in models:
            try:
                def _call(model_name=m):
                    return client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            temperature=0.4,
                            response_mime_type="application/json"
                        )
                    )
                res = await asyncio.wait_for(asyncio.to_thread(_call), timeout=15.0)
                return json.loads(res.text)
            except Exception:
                continue

        raise RuntimeError("All Gemini models failed quiz draft")


class HybridAIProvider(BaseAIProvider):
    """
    Intelligent Hybrid AI provider:
    Attempts Google Gemini first for top-tier reasoning & drafting;
    Gracefully and transparently falls back to LocalAIProvider when offline or unconfigured.
    Guarantees that the pipeline NEVER crashes.
    """
    def __init__(self):
        self.gemini = GeminiAIProvider()
        self.local = LocalAIProvider()

    async def generate_draft_editorial(self, title: str, source_content: str, source_name: str) -> Dict[str, Any]:
        try:
            return await self.gemini.generate_draft_editorial(title, source_content, source_name)
        except Exception as e:
            logger.debug(f"Gemini editorial draft unavailable ({e}), using local extraction fallback.")
            return await self.local.generate_draft_editorial(title, source_content, source_name)

    async def classify_category(self, title: str, content: str) -> str:
        try:
            return await self.gemini.classify_category(title, content)
        except Exception as e:
            logger.debug(f"Gemini category classification unavailable ({e}), using local classification fallback.")
            return await self.local.classify_category(title, content)

    async def generate_quiz_draft(self, topic: str) -> Dict[str, Any]:
        try:
            return await self.gemini.generate_quiz_draft(topic)
        except Exception as e:
            logger.debug(f"Gemini quiz draft unavailable ({e}), using local quiz fallback.")
            return await self.local.generate_quiz_draft(topic)


_provider_instance = HybridAIProvider()

def get_ai_provider() -> BaseAIProvider:
    return _provider_instance
