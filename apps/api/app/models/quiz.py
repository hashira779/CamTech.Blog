import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.common.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    title_km = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)  # Daily Challenge, Science, World, History, Tech
    difficulty = Column(String(50), default="MEDIUM")  # EASY, MEDIUM, HARD
    is_daily = Column(Boolean, default=False)
    featured_date = Column(String(10), nullable=True, index=True)  # YYYY-MM-DD
    estimated_minutes = Column(Integer, default=3)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.order_num")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    question_km = Column(Text, nullable=True)
    choices_json = Column(Text, nullable=False)  # JSON array of strings
    correct_answer_idx = Column(Integer, nullable=False)
    explanation = Column(Text, nullable=False)  # Educational explanation of the fact
    source_reference = Column(String(500), nullable=True)  # Authoritative source URL/name
    difficulty = Column(String(50), default="MEDIUM")
    category = Column(String(100), nullable=True)
    order_num = Column(Integer, default=0)

    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(String(100), nullable=False)
    score = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    time_taken_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    quiz = relationship("Quiz", back_populates="attempts")
