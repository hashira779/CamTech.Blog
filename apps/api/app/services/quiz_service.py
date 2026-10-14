import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt
from app.schemas.quiz import QuizAttemptSubmit, QuizAttemptResult, QuestionResult

class QuizService:
    @staticmethod
    def get_quizzes(db: Session, is_daily_only: bool = False) -> List[Quiz]:
        query = db.query(Quiz)
        if is_daily_only:
            query = query.filter(Quiz.is_daily == True)
        return query.all()

    @staticmethod
    def get_quiz_by_slug(db: Session, slug: str) -> Optional[Quiz]:
        return db.query(Quiz).filter(Quiz.slug == slug).first()

    @staticmethod
    def verify_attempt(db: Session, quiz_id: str, submit_data: QuizAttemptSubmit) -> QuizAttemptResult:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise ValueError("Quiz not found")

        results = []
        score = 0
        total = len(quiz.questions)

        for q in quiz.questions:
            chosen_idx = submit_data.answers.get(str(q.id), -1)
            is_correct = (chosen_idx == q.correct_answer_idx)
            if is_correct:
                score += 1

            results.append(QuestionResult(
                question_id=q.id,
                chosen_idx=chosen_idx,
                correct_idx=q.correct_answer_idx,
                is_correct=is_correct,
                explanation=q.explanation,
                source_reference=q.source_reference
            ))

        # Save attempt record
        attempt = QuizAttempt(
            quiz_id=quiz.id,
            user_id=submit_data.user_id,
            session_id=submit_data.session_id,
            score=score,
            total_questions=total,
            time_taken_seconds=submit_data.time_taken_seconds or 0
        )
        db.add(attempt)
        db.commit()

        percentage = round((score / total * 100) if total > 0 else 0.0, 1)

        return QuizAttemptResult(
            quiz_id=quiz.id,
            score=score,
            total=total,
            percentage=percentage,
            results=results
        )

    @classmethod
    async def scan_and_generate_quizzes(cls, count: int = 1) -> Dict[str, Any]:
        """Generates interactive daily quizzes with 5 questions each."""
        import re
        import uuid
        from datetime import datetime, timezone
        from app.common.config import settings
        from app.models.audit import SiteSetting
        try:
            from google import genai
            from google.genai import types
        except ImportError:
            genai = None

        from app.common.database import SessionLocal
        db = SessionLocal()
        created = []
        try:
            client = None
            if genai:
                api_key_setting = db.query(SiteSetting).filter(SiteSetting.key == 'GEMINI_API_KEY').first()
                api_key = api_key_setting.value_json if api_key_setting else settings.AI_API_KEY
                if api_key:
                    client = genai.Client(api_key=api_key)

            existing_titles = set(q.title.lower().strip() for q in db.query(Quiz).all())

            quiz_data = []
            if client:
                prompt = """Generate 1 daily interactive technology challenge quiz.
STRICT JSON output format:
{
  "title": "Daily Challenge: [Catchy Topic, e.g. Cloud Architecture & Microservices]",
  "category": "Tech",
  "difficulty": "MEDIUM",
  "description": "Test your knowledge on modern cloud systems, microservices, and distributed architecture.",
  "estimated_minutes": 3,
  "questions": [
    {
      "question": "Clear, technically precise question?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer_idx": 1,
      "explanation": "Clear educational explanation of why the correct option is right.",
      "source_reference": "RFC or standard documentation"
    }
  ]
}
Include exactly 5 questions."""
                for m in ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']:
                    try:
                        res = client.models.generate_content(
                            model=m,
                            contents=prompt,
                            config=types.GenerateContentConfig(temperature=0.7, response_mime_type="application/json")
                        )
                        if res and res.text:
                            data = json.loads(res.text)
                            if isinstance(data, dict) and data.get("questions"):
                                quiz_data = [data]
                                break
                    except Exception:
                        pass

            if not quiz_data:
                # Curated fallback quiz
                today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                quiz_data = [{
                    "title": f"Daily Tech Knowledge: High-Performance Systems ({today_str})",
                    "category": "Tech",
                    "difficulty": "MEDIUM",
                    "description": "5 quick questions on databases, caching, HTTP/3, and modern web infrastructure.",
                    "estimated_minutes": 3,
                    "questions": [
                        {
                            "question": "What is the primary architectural difference between HTTP/2 and HTTP/3?",
                            "choices": ["HTTP/3 uses TCP with TLS 1.3", "HTTP/3 uses QUIC over UDP to eliminate head-of-line blocking", "HTTP/3 only works with WebSockets", "HTTP/3 removes all compression"],
                            "correct_answer_idx": 1,
                            "explanation": "HTTP/3 replaces TCP with QUIC over UDP, ensuring packet drops in one stream do not stall unrelated parallel streams.",
                            "source_reference": "IETF RFC 9114"
                        },
                        {
                            "question": "In a Write-Ahead Log (WAL) database, what is the primary purpose of checkpointing?",
                            "choices": ["Encrypting the data files", "Flushing changes from WAL into the main database file to reclaim disk space", "Deleting user sessions", "Rebuilding all B-tree indexes"],
                            "correct_answer_idx": 1,
                            "explanation": "Checkpointing flushes dirty pages committed in the WAL file back into the primary database file, keeping the log file from growing indefinitely.",
                            "source_reference": "SQLite WAL Documentation"
                        },
                        {
                            "question": "Which caching eviction policy removes the items that have not been accessed for the longest time?",
                            "choices": ["FIFO (First In, First Out)", "LFU (Least Frequently Used)", "LRU (Least Recently Used)", "Random Eviction"],
                            "correct_answer_idx": 2,
                            "explanation": "LRU (Least Recently Used) keeps track of read/write timestamps and evicts the stalest item when memory limits are reached.",
                            "source_reference": "CS Algorithms"
                        },
                        {
                            "question": "What is the typical time complexity of searching in a balanced B-Tree of N records?",
                            "choices": ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
                            "correct_answer_idx": 1,
                            "explanation": "B-Tree lookups traverse a shallow, wide tree with logarithmically bounded depth proportional to O(log_B N).",
                            "source_reference": "Database Systems Handbook"
                        },
                        {
                            "question": "Why is hashing with bcrypt or Argon2 preferred over SHA-256 for storing user passwords?",
                            "choices": ["They produce shorter strings", "They are computationally slow and resistant to brute-force GPU cracking", "They are symmetrical and reversible", "They do not require salt"],
                            "correct_answer_idx": 1,
                            "explanation": "Password-hashing algorithms like Argon2 and bcrypt incorporate configurable work factors and memory hardness to thwart massively parallel GPU/ASIC cracking.",
                            "source_reference": "OWASP Password Storage Cheat Sheet"
                        }
                    ]
                }]

            for qz in quiz_data:
                title = qz.get("title", "").strip()
                if not title or title.lower() in existing_titles:
                    continue
                slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')[:100]
                slug = f"{slug}-{uuid.uuid4().hex[:4]}"

                new_quiz = Quiz(
                    slug=slug,
                    title=title,
                    description=qz.get("description", ""),
                    category=qz.get("category", "Tech"),
                    difficulty=qz.get("difficulty", "MEDIUM"),
                    is_daily=True,
                    featured_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    estimated_minutes=qz.get("estimated_minutes", 3)
                )
                db.add(new_quiz)
                db.flush()

                for idx, item in enumerate(qz.get("questions", [])):
                    q_obj = QuizQuestion(
                        quiz_id=new_quiz.id,
                        question=item.get("question", ""),
                        choices_json=json.dumps(item.get("choices", [])),
                        correct_answer_idx=item.get("correct_answer_idx", 0),
                        explanation=item.get("explanation", ""),
                        source_reference=item.get("source_reference"),
                        order_num=idx + 1
                    )
                    db.add(q_obj)

                db.commit()
                created.append({"id": new_quiz.id, "title": new_quiz.title, "slug": new_quiz.slug})

            return {"status": "success", "created_count": len(created), "quizzes": created}
        finally:
            db.close()

