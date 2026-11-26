import json
import re
from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import or_, and_, desc
from app.models.article import Article, ArticleSource, ArticleRevision
from app.models.category import Category
from app.models.author import Author
from app.models.source import Source
from app.schemas.article import ArticleCreate, ArticleUpdate, QualityChecklist
from app.deduplication.detector import detect_duplicates
from app.common.html_hygiene import safe_link, sanitize_stored_html
from app.services.content_quality import body_quality_issue, has_specific_source, khmer_quality_issue

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")

class ArticleService:
    # Public responses embed author / category / primary_source, so every read path
    # eager-loads the same set; without it a 20-item list fires 80 extra queries.
    # The to-one relationships use joinedload (no row multiplication). `sources` is a
    # collection, so it uses selectinload: a joined collection would be cut by the
    # page's own LIMIT and silently return fewer articles than requested.
    _READER_RELATIONSHIPS = (
        selectinload(Article.sources),
        joinedload(Article.author),
        joinedload(Article.category),
        joinedload(Article.primary_source),
    )

    @staticmethod
    def get_articles(
        db: Session,
        country: Optional[str] = None,
        category_slug: Optional[str] = None,
        author_slug: Optional[str] = None,
        source_slug: Optional[str] = None,
        status: Optional[str] = "PUBLISHED",
        tag: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[Article], int]:
        query = db.query(Article).options(*ArticleService._READER_RELATIONSHIPS)

        if status and status.upper() not in ("ALL", "ANY"):
            if status.upper() == "DRAFT":
                query = query.filter(Article.status.in_(["DRAFT", "AI_DRAFT", "IN_REVIEW", "NEEDS_REVISION", "APPROVED"]))
            elif status.upper() == "ARCHIVED":
                query = query.filter(Article.status.in_(["ARCHIVED", "REJECTED"]))
            else:
                query = query.filter(Article.status == status)
        if country:
            codes = [c.strip().upper() for c in country.split(",") if c.strip()]
            if len(codes) == 1:
                query = query.filter(Article.country == codes[0])
            elif codes:
                query = query.filter(Article.country.in_(codes))
        if category_slug:
            query = query.join(Article.category).filter(Category.slug == category_slug)
        if author_slug:
            query = query.join(Article.author).filter(Author.slug == author_slug)
        if source_slug:
            query = query.join(Article.primary_source).filter(Source.slug == source_slug)
        if search:
            search_fmt = f"%{search}%"
            query = query.filter(
                or_(
                    Article.title.ilike(search_fmt),
                    Article.title_km.ilike(search_fmt),
                    Article.summary.ilike(search_fmt),
                    Article.summary_km.ilike(search_fmt),
                    Article.content.ilike(search_fmt),
                    Article.content_km.ilike(search_fmt),
                )
            )

        total = query.count()
        if (status or "").upper() == "PUBLISHED":
            articles = query.order_by(
                Article.published_at.desc().nullslast(),
                Article.created_at.desc()
            ).offset(skip).limit(limit).all()
        else:
            articles = query.order_by(
                Article.created_at.desc()
            ).offset(skip).limit(limit).all()
        return articles, total

    @staticmethod
    def get_article_by_slug(db: Session, slug: str) -> Optional[Article]:
        return db.query(Article).options(*ArticleService._READER_RELATIONSHIPS).filter(Article.slug == slug).first()

    @staticmethod
    def get_article_by_id(db: Session, article_id: str) -> Optional[Article]:
        return db.query(Article).options(joinedload(Article.sources)).filter(Article.id == article_id).first()

    @staticmethod
    def validate_quality_gate(article: Article, db: Session) -> QualityChecklist:
        """
        Section 35: Strict Quality Gate pre-publish checklist.
        """
        missing = []

        # Ensure minimal SEO metadata fallback
        if not article.seo_title and article.title:
            article.seo_title = article.title[:150]
        if not article.seo_description and article.summary:
            article.seo_description = article.summary[:155]

        has_headline = bool(article.title and len(article.title.strip()) >= 5)
        if not has_headline: missing.append("Headline is missing or too short")

        has_summary = bool(article.summary and len(article.summary.strip()) >= 10)
        if not has_summary: missing.append("Original editorial summary is missing")

        body_issue = body_quality_issue(article.content, article.summary, article.why_it_matters)
        has_body = body_issue is None
        if body_issue: missing.append(body_issue)

        has_author = bool(article.author_id and db.query(Author.id).filter(Author.id == article.author_id).first())
        if not has_author: missing.append("Author byline must be selected")

        has_category = bool(article.category_id and db.query(Category.id).filter(Category.id == article.category_id).first())
        if not has_category: missing.append("Category must be assigned")

        has_source_attribution = bool(article.source_attribution_text or article.primary_source_id)
        if not has_source_attribution: missing.append("Source attribution must be specified")

        has_source_url = has_specific_source(article.primary_source_url)
        if not has_source_url: missing.append("Link to the specific source article or document, not a publisher homepage")

        has_image_with_credit = bool(not article.hero_image_url or (article.hero_image_credit and len(article.hero_image_credit) > 2))
        if not has_image_with_credit: missing.append("Hero image requires credit attribution")

        # A story may ship with no photograph; it may not ship with a wrong one or a
        # caption that does not belong to the file it names.
        from app.services.filing import hero_provenance_ok, filing_is_consistent
        hero_provenance_verified, hero_reason = hero_provenance_ok(article.hero_image_url, article.hero_image_credit)
        if not hero_provenance_verified: missing.append(f"Hero image cannot be shown: {hero_reason}")

        category_row = db.query(Category).filter(Category.id == article.category_id).first() if article.category_id else None
        filing_consistent = filing_is_consistent(
            article.country,
            category_row.slug if category_row else None,
            category_row.scope if category_row else None,
        )
        if not filing_consistent:
            missing.append(
                f"Filed under the {category_row.name if category_row else 'Cambodia'} category but on the "
                f"{article.country or 'unset'} desk — set the country or the category"
            )

        # Duplicate check against other published articles using lightweight tuple query
        candidate_rows = db.query(Article.id, Article.title, Article.primary_source_url).filter(Article.id != article.id).order_by(desc(Article.created_at)).limit(100).all()
        candidates = [{"id": r[0], "title": r[1], "url": r[2]} for r in candidate_rows]
        dups = detect_duplicates(article.title, article.primary_source_url, candidates)
        no_duplicate_detected = len(dups) == 0 or dups[0]["similarity"] < 0.85
        if not no_duplicate_detected: missing.append(f"Potential duplicate detected: '{dups[0]['title']}'")

        editorial_reviewed = article.status in ["APPROVED", "PUBLISHED"]
        no_unsupported_claims = editorial_reviewed  # Requires an editor; text length cannot verify facts.
        seo_metadata_complete = bool(article.seo_title and article.seo_description)
        if not seo_metadata_complete: missing.append("SEO title and description must be completed")

        km_issue = khmer_quality_issue(
            article.title_km,
            article.summary_km,
            article.content_km,
            article.title,
            article.summary,
            article.content,
            require_complete=False,
        )
        if km_issue:
            missing.append(km_issue)

        canonical_valid = bool(article.canonical_url or article.slug)

        can_publish = (
            has_headline and has_summary and has_body and has_author and
            has_category and has_source_attribution and has_source_url and
            has_image_with_credit and hero_provenance_verified and filing_consistent and
            no_duplicate_detected and seo_metadata_complete and km_issue is None
        )

        return QualityChecklist(
            has_headline=has_headline,
            has_summary=has_summary,
            has_body=has_body,
            has_author=has_author,
            has_category=has_category,
            has_source_attribution=has_source_attribution,
            has_source_url=has_source_url,
            has_image_with_credit=has_image_with_credit,
            hero_provenance_verified=hero_provenance_verified,
            filing_consistent=filing_consistent,
            no_duplicate_detected=no_duplicate_detected,
            no_unsupported_claims=no_unsupported_claims,
            editorial_reviewed=editorial_reviewed,
            seo_metadata_complete=seo_metadata_complete,
            canonical_valid=canonical_valid,
            can_publish=can_publish,
            missing_items=missing
        )

    @staticmethod
    def create_article(db: Session, article_in: ArticleCreate, editor_user_id: Optional[str] = None) -> Article:
        slug = article_in.slug or slugify(article_in.title)
        
        # Ensure slug uniqueness
        base_slug = slug
        count = 1
        while db.query(Article).filter(Article.slug == slug).first():
            slug = f"{base_slug}-{count}"
            count += 1

        # The CMS posts the body as HTML, and this row is read back by the public renderer, the RSS
        # export and the generators. Script-bearing markup and a link a reader must not follow are
        # removed here, at the door, so they never sit in the database waiting for a weaker reader.
        body = sanitize_stored_html(article_in.content)
        body_km = sanitize_stored_html(article_in.content_km) if article_in.content_km else None
        source_url = safe_link(article_in.primary_source_url, allow_relative=False)

        article = Article(
            slug=slug,
            title=article_in.title,
            title_km=article_in.title_km,
            subheadline=article_in.subheadline,
            summary=article_in.summary,
            summary_km=article_in.summary_km,
            content=body,
            content_km=body_km,
            key_points=article_in.key_points,
            why_it_matters=article_in.why_it_matters,
            timeline=article_in.timeline,
            who_said_what=article_in.who_said_what,
            what_is_documented=article_in.what_is_documented,
            what_remains_disputed=article_in.what_remains_disputed,
            category_id=article_in.category_id,
            author_id=article_in.author_id,
            country=article_in.country or "KH",
            province_or_city=article_in.province_or_city,
            language=article_in.language or "en",
            primary_source_id=article_in.primary_source_id,
            primary_source_url=source_url,
            source_attribution_text=article_in.source_attribution_text,
            hero_image_url=article_in.hero_image_url,
            hero_image_credit=article_in.hero_image_credit,
            hero_image_license=article_in.hero_image_license,
            hero_image_alt=article_in.hero_image_alt,
            status=article_in.status or "DRAFT",
            is_featured=article_in.is_featured or False,
            is_breaking=article_in.is_breaking or False,
            canonical_url=article_in.canonical_url or f"/news/{article_in.country.lower() if article_in.country else 'cambodia'}/{slug}",
            seo_title=article_in.seo_title or article_in.title,
            seo_description=article_in.seo_description or article_in.summary[:155],
        )

        db.add(article)
        db.commit()
        db.refresh(article)

        # Log creation revision
        revision = ArticleRevision(
            article_id=article.id,
            editor_user_id=editor_user_id,
            previous_status=None,
            new_status=article.status,
            change_summary="Initial article draft created",
            diff_json=json.dumps({"title": article.title, "status": article.status})
        )
        db.add(revision)
        db.commit()

        return article

    @staticmethod
    def publish_article(
        db: Session, 
        article_id: str, 
        editor_user_id: Optional[str] = None,
        force: bool = False
    ) -> Tuple[Article, QualityChecklist]:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            raise ValueError("Article not found")

        # Auto-remedy common metadata omissions for editorial publishing
        if not article.author_id and editor_user_id:
            article.author_id = editor_user_id
        elif not article.author_id:
            author = db.query(Author).first()
            if author:
                article.author_id = author.id

        if not article.category_id:
            cat = db.query(Category).first()
            if cat:
                article.category_id = cat.id

        if not article.seo_title and article.title:
            article.seo_title = article.title[:150]
        if not article.seo_description and article.summary:
            article.seo_description = article.summary[:155]
        if not article.source_attribution_text:
            article.source_attribution_text = "Source: CamTech Editorial Desk"

        db.commit()
        db.refresh(article)

        checklist = ArticleService.validate_quality_gate(article, db)
        if not checklist.can_publish and not force:
            raise ValueError(f"Quality gate validation failed: {', '.join(checklist.missing_items)}")

        prev_status = article.status
        article.status = "PUBLISHED"
        article.quality_checklist_passed = True
        article.published_at = datetime.now(timezone.utc)
        article.updated_at = datetime.now(timezone.utc)

        revision = ArticleRevision(
            article_id=article.id,
            editor_user_id=editor_user_id,
            previous_status=prev_status,
            new_status="PUBLISHED",
            change_summary="Quality gate passed and article published to public feed"
        )
        db.add(revision)
        db.commit()
        db.refresh(article)
        return article, checklist
