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
