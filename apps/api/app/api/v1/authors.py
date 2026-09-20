from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.models.author import Author
from app.schemas.author import AuthorOut, AuthorCreate
from app.services.auth_service import require_admin
from app.models.user import User

router = APIRouter(prefix="/authors", tags=["Authors"])

@router.get("", response_model=List[AuthorOut])
def list_authors(db: Session = Depends(get_db)):
    return db.query(Author).filter(Author.is_active == True).order_by(Author.name).all()

@router.get("/{slug_or_id}", response_model=AuthorOut)
def get_author(slug_or_id: str, db: Session = Depends(get_db)):
    author = db.query(Author).filter((Author.slug == slug_or_id) | (Author.id == slug_or_id)).first()
    if not author:
        raise HTTPException(status_code=404, detail="Author not found")
    return author

@router.post("", response_model=AuthorOut, status_code=status.HTTP_201_CREATED)
def create_author(author_in: AuthorCreate, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    import re
    slug = author_in.slug or re.sub(r"[^\w-]", "", author_in.name.lower().replace(" ", "-"))
    author = Author(
        name=author_in.name,
        slug=slug,
        avatar_url=author_in.avatar_url,
        bio=author_in.bio,
        role=author_in.role or "Staff Journalist",
        expertise=author_in.expertise,
        email=author_in.email,
        twitter_handle=author_in.twitter_handle,
        linkedin_url=author_in.linkedin_url,
        is_active=author_in.is_active if author_in.is_active is not None else True
    )
    db.add(author)
    db.commit()
    db.refresh(author)
    return author
