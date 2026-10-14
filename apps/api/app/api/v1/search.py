from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.common.database import get_db
from app.services.search_service import SearchService
from app.schemas.search import SearchResponse, SearchAnswerResponse

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/answer", response_model=SearchAnswerResponse)
async def search_answer(
    q: str = Query(..., min_length=3, max_length=300),
    db: Session = Depends(get_db)
):
    """AI answer grounded in the site's own verified content (news, travel, quizzes, tools...)."""
    from app.services.ai_content_service import ai_content_service
    from app.services import ai_gateway

    hits = SearchService.search(db=db, query_text=q, limit=8)
    citations = [
        {"title": h["title"], "url": h["url"], "type": h["type"]}
        for h in hits[:5]
    ]
    if not hits:
        return SearchAnswerResponse(query=q, answer=None, citations=[])

    if not ai_gateway.has_any_configured_provider():
        return SearchAnswerResponse(query=q, answer=None, citations=citations)

    context = "\n".join(f"- [{h['type']}] {h['title']}: {h['summary']}" for h in hits)
    prompt = (
        "Using ONLY the following verified site content, answer the question in 2-4 clear sentences. "
        "If the content does not contain the answer, say that the site has no matching information yet.\n"
        f"Question: {q}\nContent:\n{context}\n"
        'Return JSON: {"answer": string}'
    )
    data, model = await ai_content_service._generate_json(prompt, use_search=False, timeout=25.0)
    answer = data.get("answer") if isinstance(data, dict) else None
    return SearchAnswerResponse(query=q, answer=answer, engine=model, citations=citations)

@router.get("", response_model=SearchResponse)
def search_global(
    q: str = Query(..., min_length=1),
    category: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(25, ge=1, le=50),
    db: Session = Depends(get_db)
):
    results = SearchService.search(
        db=db,
        query_text=q,
        category=category,
        country=country,
        entity_type=type,
        limit=limit
    )
    return SearchResponse(
        query=q,
        total=len(results),
        results=results
    )
