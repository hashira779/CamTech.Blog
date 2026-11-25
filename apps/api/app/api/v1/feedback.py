import re
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.models.feedback import FeedbackReport
from app.models.user import User
from app.services.auth_service import require_admin

router = APIRouter(tags=["Feedback & Reports"])

ALLOWED_TOPICS = {"bug", "cv-builder", "article", "travel", "tools", "suggestion", "other"}
ALLOWED_STATUSES = {"NEW", "REVIEWED", "RESOLVED"}
EMAIL_RE = re.compile(r"^[^\s@<>\"'`\\?&]+@[^\s@<>\"'`\\?&]+\.[a-zA-Z0-9-]{2,63}$")
URL_RE = re.compile(r"\b(?:https?://|www\.)\S+", re.IGNORECASE)


class FeedbackCreateIn(BaseModel):
    topic: str = Field(default="other", max_length=40)
    name: Optional[str] = Field(default=None, max_length=100)
    reply_email: Optional[str] = Field(default=None, max_length=150)
    page_path: str = Field(default="/", max_length=200)
    message: str = Field(..., min_length=10, max_length=1500)


class FeedbackPatchIn(BaseModel):
    status: Optional[str] = Field(default=None, max_length=20)
    admin_notes: Optional[str] = Field(default=None, max_length=1000)


class FeedbackOut(BaseModel):
    id: str
    topic: str
    name: Optional[str] = None
    reply_email: Optional[str] = None
    page_path: str
    message: str
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


def _client_ip(request: Request) -> str:
    cf_ip = (request.headers.get("cf-connecting-ip") or "").strip()
    real_ip = (request.headers.get("x-real-ip") or "").strip()
    host = request.client.host if request.client else "127.0.0.1"
    raw = cf_ip or real_ip or host or "127.0.0.1"
    return re.sub(r"[^a-zA-Z0-9.:_-]", "", raw)[:64] or "127.0.0.1"


def _clean_text(value: str) -> str:
    return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value).strip()


@router.post("/feedback", response_model=FeedbackOut, status_code=201)
def create_feedback_report(
    payload: FeedbackCreateIn,
    request: Request,
    db: Session = Depends(get_db),
):
    topic = (payload.topic or "other").strip().lower()
    if topic not in ALLOWED_TOPICS:
        topic = "other"

    message = _clean_text(payload.message)
    if len(message) < 10:
        raise HTTPException(status_code=400, detail="Please enter at least 10 characters.")
    if len(URL_RE.findall(message)) > 1:
        raise HTTPException(status_code=400, detail="Too many links in feedback message.")

    reply_email = None
    if payload.reply_email:
        candidate = payload.reply_email.strip()
        if candidate:
            if not EMAIL_RE.match(candidate):
                raise HTTPException(status_code=400, detail="Invalid reply email format.")
            reply_email = candidate

    name = re.sub(r"[\r\n\t\x00-\x1f]+", " ", payload.name or "").strip()[:100] or None
    raw_page = (payload.page_path or "/").strip()
    page_path = raw_page[:200] if re.match(r"^/[a-zA-Z0-9/_-]{0,190}$", raw_page) else "/"

    ip_address = _client_ip(request)
    now = datetime.now(timezone.utc)
    recent_window = now - timedelta(minutes=15)
    hour_window = now - timedelta(hours=1)

    recent_ip_count = (
        db.query(FeedbackReport)
        .filter(FeedbackReport.ip_address == ip_address, FeedbackReport.created_at >= recent_window)
        .count()
    )
    if recent_ip_count >= 5:
        raise HTTPException(status_code=429, detail="Too many reports from this address recently.")

    global_hour_count = (
        db.query(FeedbackReport)
        .filter(FeedbackReport.created_at >= hour_window)
        .count()
    )
    if global_hour_count >= 100:
        raise HTTPException(status_code=429, detail="Feedback queue is busy. Please try again soon.")

    duplicate = (
        db.query(FeedbackReport)
        .filter(FeedbackReport.message == message, FeedbackReport.created_at >= recent_window)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=429, detail="Duplicate report already received.")

    report = FeedbackReport(
        topic=topic,
        name=name,
        reply_email=reply_email,
        page_path=page_path,
        message=message,
        ip_address=ip_address,
        status="NEW",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/admin/feedback", response_model=list[FeedbackOut])
def list_feedback_reports(
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(FeedbackReport)
    if status:
        normalized = status.strip().upper()
        if normalized in ALLOWED_STATUSES:
            query = query.filter(FeedbackReport.status == normalized)
    return query.order_by(desc(FeedbackReport.created_at)).limit(limit).all()


@router.patch("/admin/feedback/{report_id}", response_model=FeedbackOut)
def update_feedback_report(
    report_id: str,
    payload: FeedbackPatchIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    report = db.query(FeedbackReport).filter(FeedbackReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Feedback report not found.")
    if payload.status is not None:
        normalized = payload.status.strip().upper()
        if normalized not in ALLOWED_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid report status.")
        report.status = normalized
    if payload.admin_notes is not None:
        report.admin_notes = _clean_text(payload.admin_notes)[:1000]
    db.commit()
    db.refresh(report)
    return report


@router.delete("/admin/feedback/{report_id}")
def delete_feedback_report(
    report_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    report = db.query(FeedbackReport).filter(FeedbackReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Feedback report not found.")
    db.delete(report)
    db.commit()
    return {"deleted": True}
