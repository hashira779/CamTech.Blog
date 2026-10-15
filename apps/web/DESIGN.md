# CamTech.Blog web design system

Read this before changing anything under `src/app` or `src/components`. The public
site is a warm-paper editorial register: photography first, one serif for display,
one sans for UI, one terracotta accent, hairline rules. No teal, no gradients, no
glow, no neon shadows.

## Tailwind v4 — tokens are the API

`src/app/globals.css` is the single source of truth. Tailwind v4 only generates a
utility for a token declared in `@theme inline`, so **hardcoded palette classes
(`bg-white`, `text-gray-600`, `border-slate-800`) are the bug, not the style.** They
do not respond to the theme switch and they are what made every page drift.

Use only these:

| Need | Classes |
| --- | --- |
| surfaces | `bg-background` `bg-surface` `bg-surface-muted` `bg-surface-elevated` `bg-card` `bg-popover` |
| text | `text-foreground` `text-muted-foreground` `text-card-foreground` |
| lines | `border-border` `border-border-strong` `divide-border` `ring-ring` |
| action | `bg-primary text-primary-foreground` · `text-accent` `bg-accent text-accent-foreground` `bg-accent-soft` |
| status | `text-success` `text-warning` `text-info` `text-destructive` (tints: `bg-success/10`) |
| sections | `text-category-news` `text-category-world` `text-category-travel` `text-category-discover` `text-category-quiz` `text-category-tools` `text-category-transport` `text-category-breaking` |
| width | `container-page` `container-reading` `container-wide` — or `<Container width="page">` |
| type | `font-display` (serif) / `font-sans`, `text-xs` … `text-5xl`. **Nothing below `text-xs` (12px).** |
| radius | `rounded-xs` `rounded-sm` `rounded-md` `rounded-lg` `rounded-xl` `rounded-2xl` `rounded-3xl` `rounded-full`. No arbitrary `rounded-[..]`. |
| shadow | `shadow-xs` `shadow-sm` `shadow-md` `shadow-lg`. Nothing heavier. |

Component helpers in `globals.css`: `.section-label` (uppercase mark), `.hairline`,
`.hover-lift`, `.drop-cap`, `.paper-grain`, `.no-scrollbar`, `.reading-progress`.

## Primitives — use them, do not re-invent them

- `ui/container.tsx` — `Container`, `Section`. Every page starts with these.
- `ui/section-header.tsx` — `SectionHeader label title description actionHref actionLabel`.
- `ui/photo.tsx` (server) and `ui/photo-image.tsx` (client) — every photograph.
- `ui/category-mark.tsx` — `CategoryMark`, `categoryKey()` for section marks.
- `ui/byline.tsx` — `Byline`, `SourceChip`, `MetaDot`. `tone="invert"` over photos.
- `ui/card.tsx`, `ui/badge.tsx`, `ui/button.tsx` — variants only, no local overrides.
- `shared/news-card.tsx` — the one news card; variants `hero | feature | standard | compact | list | text`.
- `lib/format.ts` — `formatDate`, `formatCount`, `formatReadingTime`, `estimateReadingMinutes`, `cleanText`.

## Content honesty — the product rule

The site stores only material it can attribute. UI must never paper over a missing
value:

1. **No stock fallback images.** If `hero_image_url` / `image_url` is empty, render the
   honest placeholder (`Photo` does this) or a typographic card. Never import a
   placeholder URL.
2. **No invented bylines.** Missing `author` renders as nothing — not "Editorial Desk",
   not "Staff", not an initial avatar.
3. **No fabricated dates.** Missing `published_at` and `created_at` renders as nothing —
   not "Today".
4. **No measured-out-loud read times.** `formatReadingTime` returns `null` under 40 words;
   render nothing then.
5. **No default counts.** `views_count === 0` renders nothing, not "0 reads" or "Trending story".
6. **No unearned labels.** "Breaking" only when `is_breaking`. Ratings, "verified", "top
   rated" only when the field really carries them.
7. **Clean syndicated copy at render time** with `cleanText()` (`&nbsp;`, stray entities,
   tags), and keep `title_km` / `summary_km` behind `lang === "km"`.
8. **Empty sections are hidden**, not shown as an empty frame.

## Layout rules

One column rhythm per page. Hero is full-bleed or none. Cards align to the same
container, so columns line up across routes. Touch targets ≥ 32px. Keyboard focus
is visible (`focus-visible:outline-2`).

## Verifying a change

```bash
cd apps/web
npx tsc --noEmit
npm run build
```

Then check the rendered page for `bg-white`, `text-gray-`, `border-slate-`,
`rounded-[`, `text-[10px]` / `text-[11px]` and any `unsplash` URL that is not coming
from the API — all four are regressions.
