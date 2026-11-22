"""Read-only published news audit. Run from apps/api with the deployment's environment.

    python scripts/audit_content_quality.py

No content or settings are modified. Results identify editorial work, not AdSense approval.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.common.database import SessionLocal
from app.models.article import Article
from app.services.content_quality import body_quality_issue, has_specific_source


def audit(db):
    findings = []
    checked = 0
    for article in db.query(Article).filter(Article.status == "PUBLISHED").yield_per(100):
        checked += 1
        issues = []
        issue = body_quality_issue(article.content, article.summary, article.why_it_matters)
        if issue:
            issues.append(issue)
        if not has_specific_source(article.primary_source_url):
            issues.append("Missing link to a specific source article or document")
        if not article.quality_checklist_passed:
            issues.append("Published without a passed quality checklist")
        if issues:
            findings.append({"id": article.id, "slug": article.slug, "title": article.title, "issues": issues})
    return {"checked": checked, "needs_review": len(findings), "findings": findings}


if __name__ == "__main__":
    with SessionLocal() as db:
        print(json.dumps(audit(db), ensure_ascii=True, indent=2))
