# Page Patterns & Layout Shells

To ensure every page looks and behaves as part of one cohesive product, all routes compose one of six standardized page shells.

## 1. `PublicPageShell` (`apps/web/src/components/layout/public-shell.tsx`)
* **Use for**: Standard marketing, policy, landing, and generic information pages (`/about`, `/privacy`, `/terms`).
* **Structure**: Breadcrumb $\to$ Header with badge/title/actions $\to$ Max-width wrapper (`standard`, `reading`, or `wide`) $\to$ Content.

## 2. `ArticlePageShell` (`apps/web/src/components/layout/article-shell.tsx`)
* **Use for**: Long-form editorial news stories and deep visual discoveries (`/cambodia/news/[slug]`, `/discover/[slug]`).
* **Structure**: Breadcrumb $\to$ Category badge $\to$ Headline $\to$ Author/Date/Reading time bar $\to$ 16:9 Hero photo with credit $\to$ Reading column (`max-w-3xl`) $\to$ Source attribution box $\to$ Sidebar (Trending & Utilities) $\to$ Related stories grid.

## 3. `ListingPageShell` (`apps/web/src/components/layout/listing-shell.tsx`)
* **Use for**: Catalogs and collection feeds (`/cambodia`, `/world`, `/travel`, `/quiz`, `/tools`, `/sources`).
* **Structure**: Breadcrumb $\to$ Header with description $\to$ Search & Filter toolbar $\to$ Result count bar $\to$ Responsive grid (`2` or `3` columns) $\to$ Pagination $\to$ Empty / Error state fallback.

## 4. `DetailPageShell` (`apps/web/src/components/layout/detail-shell.tsx`)
* **Use for**: Rich entity profiles (`/travel/[destination]`, `/travel/place/[slug]`, `/travel/operator/[slug]`, `/author/[slug]`).
* **Structure**: Breadcrumbs $\to$ Hero visual banner $\to$ Title & Action controls $\to$ Main content column (Overview, Verified Amenities, Timetables) $\to$ Sidebar (Map, Contact, Quick Facts) $\to$ Related places.

## 5. `WizardPageShell` (`apps/web/src/components/layout/wizard-shell.tsx`)
* **Use for**: Multi-step guided workflows (`/travel/planner`, `/travel/suggest`).
* **Structure**: Breadcrumb $\to$ Step-by-step progress indicator $\to$ Current step card with title & description $\to$ Form input area $\to$ Back and Continue action buttons.

## 6. `AdminPageShell` (`apps/web/src/components/layout/admin-shell.tsx`)
* **Use for**: High-density operational dashboards (`/admin`, `/admin/security`, `/admin/infrastructure`).
* **Structure**: Collapsible hierarchical sidebar (Overview, Content, Travel, Operations) $\to$ Top status bar with live website link $\to$ Page title with filter/export toolbar $\to$ High-density responsive data tables.
