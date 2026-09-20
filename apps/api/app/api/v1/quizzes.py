import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.services.quiz_service import QuizService
from app.schemas.quiz import QuizOut, QuizQuestionOut, QuizAttemptSubmit, QuizAttemptResult
from app.models.quiz import Quiz

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

@router.get("", response_model=List[QuizOut])
def list_quizzes(is_daily_only: bool = False, db: Session = Depends(get_db)):
    quizzes = QuizService.get_quizzes(db, is_daily_only)
    output = []
    for q in quizzes:
        questions_out = [
            QuizQuestionOut(
                id=q_item.id,
                question=q_item.question,
                question_km=q_item.question_km,
                choices=json.loads(q_item.choices_json),
                order_num=q_item.order_num,
                difficulty=q_item.difficulty,
                category=q_item.category
            )
            for q_item in q.questions
        ]
        output.append(QuizOut(
            id=q.id,
            slug=q.slug,
            title=q.title,
            title_km=q.title_km,
            description=q.description,
            category=q.category,
            difficulty=q.difficulty,
            is_daily=q.is_daily,
            featured_date=q.featured_date,
            estimated_minutes=q.estimated_minutes,
            questions=questions_out
        ))
    return output

@router.get("/daily", response_model=QuizOut)
def get_daily_quiz(db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.is_daily == True).first()
    if not quiz:
        quiz = db.query(Quiz).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Daily quiz not found")

    questions_out = [
        QuizQuestionOut(
            id=q_item.id,
            question=q_item.question,
            question_km=q_item.question_km,
            choices=json.loads(q_item.choices_json),
            order_num=q_item.order_num,
            difficulty=q_item.difficulty,
            category=q_item.category
        )
        for q_item in quiz.questions
    ]
    return QuizOut(
        id=quiz.id,
        slug=quiz.slug,
        title=quiz.title,
        title_km=quiz.title_km,
        description=quiz.description,
        category=quiz.category,
        difficulty=quiz.difficulty,
        is_daily=quiz.is_daily,
        featured_date=quiz.featured_date,
        estimated_minutes=quiz.estimated_minutes,
        questions=questions_out
    )

@router.get("/{slug}", response_model=QuizOut)
def get_quiz(slug: str, db: Session = Depends(get_db)):
    quiz = QuizService.get_quiz_by_slug(db, slug)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions_out = [
        QuizQuestionOut(
            id=q_item.id,
            question=q_item.question,
            question_km=q_item.question_km,
            choices=json.loads(q_item.choices_json),
            order_num=q_item.order_num,
            difficulty=q_item.difficulty,
            category=q_item.category
        )
        for q_item in quiz.questions
    ]
    return QuizOut(
        id=quiz.id,
        slug=quiz.slug,
        title=quiz.title,
        title_km=quiz.title_km,
        description=quiz.description,
        category=quiz.category,
        difficulty=quiz.difficulty,
        is_daily=quiz.is_daily,
        featured_date=quiz.featured_date,
        estimated_minutes=quiz.estimated_minutes,
        questions=questions_out
    )

@router.post("/{quiz_id}/attempt", response_model=QuizAttemptResult)
def submit_attempt(quiz_id: str, submit_data: QuizAttemptSubmit, db: Session = Depends(get_db)):
    try:
        return QuizService.verify_attempt(db, quiz_id, submit_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
