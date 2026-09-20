from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel

class QuizQuestionOut(BaseModel):
    id: str
    question: str
    question_km: Optional[str] = None
    choices: List[str]
    order_num: int
    difficulty: str
    category: Optional[str] = None

    class Config:
        from_attributes = True

class QuizQuestionWithAnswerOut(QuizQuestionOut):
    correct_answer_idx: int
    explanation: str
    source_reference: Optional[str] = None

class QuizOut(BaseModel):
    id: str
    slug: str
    title: str
    title_km: Optional[str] = None
    description: str
    category: str
    difficulty: str
    is_daily: bool
    featured_date: Optional[str] = None
    estimated_minutes: int
    questions: List[QuizQuestionOut] = []

    class Config:
        from_attributes = True

class QuizAttemptSubmit(BaseModel):
    session_id: str
    user_id: Optional[str] = None
    answers: Dict[str, int]  # question_id -> chosen index
    time_taken_seconds: Optional[int] = 0

class QuestionResult(BaseModel):
    question_id: str
    chosen_idx: int
    correct_idx: int
    is_correct: bool
    explanation: str
    source_reference: Optional[str] = None

class QuizAttemptResult(BaseModel):
    quiz_id: str
    score: int
    total: int
    percentage: float
    results: List[QuestionResult]
