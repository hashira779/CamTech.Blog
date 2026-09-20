# Editorial Review Workflow & Quality Gate

Daily Discovery enforces a strict **Human-in-the-Loop** editorial model. AI assists with synthesis and classification, but NEVER automatically publishes news to the public.

---

## 1. Editorial Lifecycle

```
Source Feed (RSS / API)
        ↓
Ingestion & Normalization
        ↓
Duplicate Detection Engine
        ↓
AI Draft Generation (summary, key points, tags)
        ↓
Editorial Review Queue (Status: AI_DRAFT)
        ↓
Editor Review & Quality Gate Check
        ↓
Approve / Edit / Publish (Status: PUBLISHED)
```

---

## 2. The 13-Point Quality Gate Checklist (Section 35)

Before an article can transition to `PUBLISHED`, the system verifies:

1. [x] **Headline exists** and meets length requirements.
2. [x] **Original editorial summary exists** ("What happened?").
3. [x] **Full article content body exists** with context.
4. [x] **Author byline selected** from verified staff.
5. [x] **Category assigned** with appropriate country scope.
6. [x] **Source attribution text exists** (e.g. "Reporting by Reuters / AKP").
7. [x] **Valid primary source URL exists** pointing to original reporting.
8. [x] **Hero image has rights & credit attribution**.
9. [x] **No duplicate detected** within 7-day window.
10. [x] **No unsupported or invented claims** (neutral phrasing).
11. [x] **Editorial sign-off completed** by authorized editor.
12. [x] **SEO metadata complete** (title & description).
13. [x] **Canonical URL valid**.

If any requirement is missing, the **Publish** action is rejected with actionable error messages.
