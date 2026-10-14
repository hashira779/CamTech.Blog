"""
AI Content Service — extends the site's AI automation beyond news.

Generates, with the existing Gemini setup (Google Search grounding when available):
  * Visual Discoveries  -> evergreen "how things work" explainers (Discover section)
  * Daily Quiz          -> one fresh quiz per day (Cambodia time)
  * Travel Guides       -> evergreen destination guides
  * Travel Events       -> upcoming festivals/events with ISO dates

Every generated row is stamped with ai_metadata = {"engine": <model>} and starts in a
non-public state (is_published=0 / status=AI_DRAFT). The News Autopilot lifecycle
publishes trusted-engine rows and expires ended events, so nothing AI-written goes
live or stays live without the same hybrid review window as news.
"""
import json
import re
import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple

try:
    from google import genai
    from google.genai import types
except ImportError:  # SDK optional at import time
    genai = None
    types = None

from app.common.config import settings
from app.common.database import SessionLocal
from app.models.audit import AuditLog, SiteSetting
from app.models.discovery import Discovery
from app.models.guide_event import Event, TravelGuide
from app.models.location import Destination
from app.models.quiz import Quiz, QuizQuestion
from app.services.image_search_service import image_search_service

logger = logging.getLogger(__name__)

KH_TZ = timezone(timedelta(hours=7))  # Cambodia time, no DST

QUIZ_TOPIC_POOL = [
    "Science and space exploration",
    "World geography and capitals",
    "History and ancient civilizations",
    "Technology and the internet",
    "Cambodia culture, provinces and landmarks",
    "Nature, animals and the ocean",
]


def _slugify(text: str, max_len: int = 80) -> str:
    slug = re.sub(r"[^\w-]", "", re.sub(r"\s+", "-", (text or "").lower()))
    return slug[:max_len].strip("-") or f"item-{uuid.uuid4().hex[:8]}"


def _meta(engine: str) -> str:
    return json.dumps({"engine": engine, "generated_at": datetime.now(timezone.utc).isoformat()})


class AIContentService:
    """Shared Gemini client + JSON generation helpers for all content generators."""

    def _get_gemini_client(self, db):
        if genai is None:
            return None
        key_row = db.query(SiteSetting).filter(SiteSetting.key == "GEMINI_API_KEY").first()
        api_key = key_row.value_json if key_row else settings.AI_API_KEY
        if not api_key:
            return None
        return genai.Client(api_key=api_key)

    def _fallback_models(self) -> List[str]:
        preferred = []
        if settings.AI_MODEL_NAME and not any(f in settings.AI_MODEL_NAME for f in ["3.8", "3.5", "3.0", "3.1"]):
            preferred.append(settings.AI_MODEL_NAME)
        preferred.extend(["gemini-2.5-flash", "gemini-2.0-flash"])
        return list(dict.fromkeys(preferred))

    @staticmethod
    def _extract_json(text: str) -> Any:
        if not text:
            return None
        cleaned = re.sub(r"```(?:json)?", "", text).strip()
        for candidate in (cleaned,):
            try:
                return json.loads(candidate)
            except Exception:
                pass
        for open_ch, close_ch in (("[", "]"), ("{", "}")):
            start, end = cleaned.find(open_ch), cleaned.rfind(close_ch)
            if start != -1 and end > start:
                try:
                    return json.loads(cleaned[start:end + 1])
                except Exception:
                    continue
        return None

    async def _generate_json(
        self,
        client,
        prompt: str,
        use_search: bool = True,
        timeout: float = 90.0,
    ) -> Tuple[Any, Optional[str]]:
        """Call Gemini across fallback models; returns (parsed_json, model_name)."""
        for model in self._fallback_models():
            tools = None
            if use_search and ("gemini-2.5" in model or "gemini-2.0" in model):
                try:
                    tools = [types.Tool(google_search=types.GoogleSearch())]
                except Exception:
                    tools = None

            def _call(m=model, tc=tools):
                return client.models.generate_content(
                    model=m,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.5,
                        response_mime_type=None if tc else "application/json",
                        tools=tc,
                    ),
                )

            try:
                resp = await asyncio.wait_for(asyncio.to_thread(_call), timeout=timeout)
                data = self._extract_json(resp.text or "")
                if data is None:
                    logger.warning(f"[AIContent] Model {model} returned unparseable JSON")
                    continue
                return data, model
            except Exception as e:
                logger.warning(f"[AIContent] Model {model} failed: {e}")
                continue
        return None, None

    @staticmethod
    def _audit(db, action: str, entity: str, entity_id: str, detail: str):
        try:
            db.add(AuditLog(
                user_id=None,
                action=action,
                entity=entity,
                entity_id=entity_id,
                new_value_json=json.dumps({"detail": detail})[:4000],
                request_id="ai-content",
            ))
            db.commit()
        except Exception as e:
            logger.warning(f"[AIContent] audit log failed: {e}")
            db.rollback()

    async def _find_image(self, title: str, category: str = "science", country: str = "WORLD"):
        try:
            return await image_search_service.search_news_image(title=title, category=category, country=country)
        except Exception as e:
            logger.warning(f"[AIContent] image search failed for '{title}': {e}")
            return None, None, None

    # ------------------------------------------------------------------ #
    # Discoveries                                                         #
    # ------------------------------------------------------------------ #
    async def generate_discoveries(self, count: int = 2) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            client = self._get_gemini_client(db)
            existing_titles = [t for (t,) in db.query(Discovery.title).all()]
        finally:
            db.close()

        if not client:
            return {"status": "skipped", "reason": "no_ai_key", "generated": 0}

        avoid = "\n".join(f"- {t}" for t in existing_titles[-60:]) or "- (none yet)"
        prompt = f"""You are a science communicator creating visual explainer content called "Visual Discoveries".
Propose {count} EVERGREEN topics that explain how something in the real world actually works
(e.g. how GPS uses relativity, how underwater fiber optics carry the internet, how monsoons form).
These topics already exist — do NOT repeat or rephrase them:
{avoid}

Return a JSON array of {count} objects, each with:
- title: engaging title (max 90 chars)
- category: one of [Science, Technology, Space, AI, How Things Work, Nature]
- intro: 2-3 sentence hook (max 300 chars)
- main_explanation: 300-500 word clear explanation in Markdown with ## subheadings
- important_facts: array of 5 short factual bullets
- timeline: array of 4-6 objects {{"year": "YYYY", "milestone": "short text"}}
- visual_sections: array of 3 objects {{"title": str, "description": str (1-2 sentences), "caption": str}}
- interactive_type: one of [step_breakdown, comparison, simulator, interactive_diagram]
- sources: array of 2-4 authoritative source names/URLs
"""
        data, model = await self._generate_json(client, prompt)
        if not isinstance(data, list):
            data = [data] if isinstance(data, dict) else []
        if not data or not model:
            return {"status": "failed", "error": "generation_failed", "generated": 0}

        generated = 0
        db = SessionLocal()
        try:
            for item in data[:count]:
                if not isinstance(item, dict) or not item.get("title"):
                    continue
                title = str(item["title"])[:255]
                if db.query(Discovery).filter(Discovery.title == title).first():
                    continue
                hero_url, hero_credit, hero_alt = await self._find_image(title, category="science")
                visual_sections = []
                for sec in (item.get("visual_sections") or [])[:3]:
                    if not isinstance(sec, dict):
                        continue
                    sec_title = str(sec.get("title") or "")[:200]
                    img_url, _, _ = await self._find_image(sec_title or title, category="science")
                    visual_sections.append({
                        "title": sec_title,
                        "description": str(sec.get("description") or "")[:600],
                        "caption": str(sec.get("caption") or "")[:300],
                        "image_url": img_url,
                    })
                disc = Discovery(
                    slug=f"{_slugify(title)}-{uuid.uuid4().hex[:6]}",
                    title=title,
                    hero_image_url=hero_url or "",
                    hero_image_credit=hero_credit,
                    hero_image_alt=hero_alt or title[:255],
                    category=str(item.get("category") or "Science")[:100],
                    intro=str(item.get("intro") or title)[:2000],
                    main_explanation=str(item.get("main_explanation") or item.get("intro") or "")[:20000],
                    visual_sections=json.dumps(visual_sections),
                    important_facts=json.dumps([str(f) for f in (item.get("important_facts") or [])][:8]),
                    timeline=json.dumps([t for t in (item.get("timeline") or []) if isinstance(t, dict)][:8]),
                    interactive_type=str(item.get("interactive_type") or "step_breakdown")[:100],
                    sources=json.dumps([str(s) for s in (item.get("sources") or [])][:6]),
                    is_published=0,  # autopilot publishes after the review window
                    ai_metadata=_meta(model),
                )
                db.add(disc)
                db.commit()
                self._audit(db, "AI_GENERATE", "DISCOVERY", disc.id, f"Drafted by {model}")
                generated += 1
        except Exception as e:
            logger.error(f"[AIContent] discovery save failed: {e}")
            db.rollback()
        finally:
            db.close()
        return {"status": "success", "generated": generated, "engine": model}

    # ------------------------------------------------------------------ #
    # Daily quiz                                                          #
    # ------------------------------------------------------------------ #
    async def generate_daily_quiz(self) -> Dict[str, Any]:
        today = datetime.now(KH_TZ).strftime("%Y-%m-%d")
        db = SessionLocal()
        try:
            existing = db.query(Quiz).filter(Quiz.featured_date == today).first()
            if existing:
                return {"status": "skipped", "reason": "already_exists", "generated": 0}
            client = self._get_gemini_client(db)
        finally:
            db.close()

        if not client:
            return {"status": "skipped", "reason": "no_ai_key", "generated": 0}

        day_index = datetime.now(KH_TZ).timetuple().tm_yday
        topic = QUIZ_TOPIC_POOL[day_index % len(QUIZ_TOPIC_POOL)]
        prompt = f"""Create today's daily quiz ({today}) on the topic: {topic}.
Write 5 original, factual, family-friendly questions with 4 choices each.
Return JSON with:
- title: short quiz title (max 90 chars)
- description: 1-2 sentence intro (max 200 chars)
- category: one of [Daily Challenge, Science, World, History, Tech, Cambodia]
- difficulty: one of [EASY, MEDIUM, HARD]
- estimated_minutes: integer 2-6
- questions: array of 5 objects {{question, choices (4 strings), correct_answer_idx (0-3), explanation (1-2 sentences), source_reference (source name or URL)}}
"""
        data, model = await self._generate_json(client, prompt, use_search=True, timeout=60.0)
        if not isinstance(data, dict) or not data.get("questions") or not model:
            return {"status": "failed", "error": "generation_failed", "generated": 0}

        db = SessionLocal()
        try:
            quiz = Quiz(
                slug=f"daily-quiz-{today}",
                title=str(data.get("title") or f"Daily Quiz {today}")[:255],
                description=str(data.get("description") or "Today's daily challenge.")[:2000],
                category=str(data.get("category") or "Daily Challenge")[:100],
                difficulty=str(data.get("difficulty") or "MEDIUM")[:50],
                is_daily=True,
                featured_date=today,
                estimated_minutes=int(data.get("estimated_minutes") or 3),
                ai_metadata=_meta(model),
            )
            db.add(quiz)
            db.flush()
            for idx, q in enumerate(data["questions"][:5]):
                if not isinstance(q, dict) or not q.get("question"):
                    continue
                choices = [str(c) for c in (q.get("choices") or [])][:4]
                if len(choices) != 4:
                    continue
                correct = int(q.get("correct_answer_idx") or 0)
                if not 0 <= correct <= 3:
                    continue
                db.add(QuizQuestion(
                    quiz_id=quiz.id,
                    question=str(q["question"])[:2000],
                    choices_json=json.dumps(choices),
                    correct_answer_idx=correct,
                    explanation=str(q.get("explanation") or "")[:2000],
                    source_reference=str(q.get("source_reference") or "")[:500] or None,
                    difficulty=quiz.difficulty,
                    category=quiz.category,
                    order_num=idx,
                ))
            db.commit()
            self._audit(db, "AI_GENERATE", "QUIZ", quiz.id, f"Daily quiz {today} drafted by {model}")
            return {"status": "success", "generated": 1, "engine": model, "date": today}
        except Exception as e:
            logger.error(f"[AIContent] quiz save failed: {e}")
            db.rollback()
            return {"status": "failed", "error": str(e), "generated": 0}
        finally:
            db.close()

    # ------------------------------------------------------------------ #
    # Travel guides & events                                              #
    # ------------------------------------------------------------------ #
    async def generate_travel_content(self, max_destinations: int = 3) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            client = self._get_gemini_client(db)
            rows = (
                db.query(Destination, TravelGuide.id)
                .outerjoin(TravelGuide, TravelGuide.destination_id == Destination.id)
                .filter(Destination.status == "ACTIVE")
                .all()
            )
            guide_counts: Dict[str, int] = {}
            names: Dict[str, str] = {}
            for dest, guide_id in rows:
                names[dest.id] = dest.name
                guide_counts[dest.id] = guide_counts.get(dest.id, 0) + (1 if guide_id else 0)
            # Prefer destinations with the fewest AI/seed guides
            targets = sorted(guide_counts.items(), key=lambda kv: kv[1])[:max_destinations]
        finally:
            db.close()

        if not client:
            return {"status": "skipped", "reason": "no_ai_key", "generated": 0}

        guides = events = 0
        model_used = None
        for dest_id, _count in targets:
            dest_name = names.get(dest_id, "Cambodia")
            prompt = f"""You are a Cambodia travel editor. For the province/destination "{dest_name}" produce:
1) ONE evergreen travel guide (itinerary or practical guide) that does not duplicate generic content.
2) 1-2 REAL upcoming or annual cultural events/festivals in or near {dest_name} within the next 12 months.
Today is {datetime.now(KH_TZ).strftime('%Y-%m-%d')}. Event dates MUST be ISO format YYYY-MM-DD.
Return JSON with:
- guide: {{title, summary (1-2 sentences), content (400-600 word Markdown with ## subheadings), read_time_minutes (e.g. "6 min")}}
- events: array of objects {{name, event_type (FESTIVAL|CULTURAL|EXHIBITION|CONCERT|SPORTS), venue, start_date, end_date, description (1-2 sentences)}}
"""
            data, model = await self._generate_json(client, prompt, use_search=True, timeout=90.0)
            if not isinstance(data, dict) or not model:
                continue
            model_used = model
            db = SessionLocal()
            try:
                guide = data.get("guide")
                if isinstance(guide, dict) and guide.get("title"):
                    g_title = str(guide["title"])[:200]
                    dup = db.query(TravelGuide).filter(TravelGuide.title == g_title).first()
                    if not dup:
                        img_url, img_credit, _ = await self._find_image(f"{g_title} {dest_name}", category="travel", country="KH")
                        g = TravelGuide(
                            destination_id=dest_id,
                            title=g_title,
                            slug=f"{_slugify(g_title)}-{uuid.uuid4().hex[:6]}",
                            summary=str(guide.get("summary") or g_title)[:4000],
                            content=str(guide.get("content") or guide.get("summary") or "")[:30000],
                            hero_image_url=img_url,
                            read_time_minutes=str(guide.get("read_time_minutes") or "6 min")[:20],
                            status="AI_DRAFT",  # autopilot publishes after the review window
                            ai_metadata=_meta(model),
                        )
                        db.add(g)
                        db.commit()
                        self._audit(db, "AI_GENERATE", "GUIDE", g.id, f"Drafted by {model}")
                        guides += 1
                for ev in (data.get("events") or [])[:2]:
                    if not isinstance(ev, dict) or not ev.get("name") or not ev.get("start_date"):
                        continue
                    start = str(ev["start_date"])[:50]
                    if not re.match(r"^\d{4}-\d{2}-\d{2}$", start):
                        continue  # refuse vague dates; expiry logic needs ISO
                    e_name = str(ev["name"])[:200]
                    if db.query(Event).filter(Event.name == e_name, Event.destination_id == dest_id).first():
                        continue
                    img_url, _, _ = await self._find_image(f"{e_name} festival Cambodia", category="travel", country="KH")
                    e = Event(
                        destination_id=dest_id,
                        name=e_name,
                        slug=f"{_slugify(e_name)}-{uuid.uuid4().hex[:6]}",
                        description=str(ev.get("description") or e_name)[:4000],
                        event_type=str(ev.get("event_type") or "FESTIVAL")[:50],
                        venue=str(ev.get("venue") or "")[:200] or None,
                        start_date=start,
                        end_date=(str(ev.get("end_date"))[:50] if re.match(r"^\d{4}-\d{2}-\d{2}$", str(ev.get("end_date") or "")) else None),
                        hero_image_url=img_url,
                        status="AI_DRAFT",  # autopilot activates after the review window
                        ai_metadata=_meta(model),
                    )
                    db.add(e)
                    db.commit()
                    self._audit(db, "AI_GENERATE", "EVENT", e.id, f"Drafted by {model}")
                    events += 1
            except Exception as e:
                logger.error(f"[AIContent] travel save failed for {dest_name}: {e}")
                db.rollback()
            finally:
                db.close()
        return {"status": "success", "guides": guides, "events": events, "engine": model_used}


ai_content_service = AIContentService()
