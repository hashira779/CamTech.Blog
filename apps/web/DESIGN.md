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
- `ui/reveal.tsx` — `Reveal index variant as immediate`; the only scroll animation.
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

## Motion — six moves, no more

Motion is what makes a calm editorial layout feel alive, and it is also the easiest thing
to overdo. There are exactly six allowed moves, all defined in `globals.css`; a page does
not get to invent a seventh, an arbitrary duration, or a `hover:scale-105` written inline.

1. **`<Reveal>`** (`.dd-reveal`) — content rises into place the first time it scrolls into
   view. `index` staggers siblings by 70ms (capped at 8) so a grid arrives as a wave.
   `variant="left|right|zoom"` changes the direction, nothing else. Above-the-fold content
   passes `immediate`, because a reveal that delays the hero photograph is a Core Web
   Vitals regression, not a design.
   One observer and one scroll pass serve every `<Reveal>` on the page. The observer alone
   is not enough: it only reports a *change* of intersection, so a jump (hash link, restored
   scroll, End key) moves a card from "below, not intersecting" to "above, not intersecting"
   without ever crossing a threshold and delivers nothing. A `/travel` jump left 19 article
   cards at `opacity: 0` above the reader for the rest of the visit; the scroll pass catches
   them. Keep `threshold: 0` — a wrapper around a long list is taller than the viewport and
   could never reach a 5% ratio.
2. **`.photo-in`** — a newly mounted photograph fades up (`@starting-style`), wrapper-level,
   so it never fights the zoom on the image inside it.
3. **`.photo-zoom`** (`<Photo zoom>`, default on) — 1.045 scale on card hover. Cards carry
   `group`; the scale lives in CSS so no page repeats `duration-[900ms]`.
4. **`.link-nudge`** — the arrow in a row or card link slides 2px on hover, on the same
   `group` trigger as the photo zoom. It replaced 27 inline copies of
   `transition-transform duration-300 group-hover:translate-x-0.5`, which is why every arrow
   used to feel slightly different.
5. **`.pressable`** — controls push in 0.97 on `:active`. It is on `Button` already; use it
   on any styled link that acts like a button.
6. **`.animate-ken-burns`** — one slow 26s drift, reserved for the front-page hero. A page
   gets one; more than one reads as a screensaver.

Rules that keep this from becoming a toy:

- **Transform and opacity only.** Nothing animates `top`, `height`, `width`, or
  `box-shadow`; those run on the main thread and stutter.
- **Server HTML is already readable.** The hidden start state is gated on `html.js`, set by
  the inline script in `layout.tsx`, so a crawler, a reader with JS off, or a failed
  hydration sees the page fully positioned.
- **`prefers-reduced-motion: reduce` removes all of it** — reveals never hold content back,
  Ken Burns stops, transitions collapse, and `PageTransition` swaps pages without moving
  them. Every one of the five moves is neutralised in that single `@media` block; put new
  motion there too, not in a component.
- Route changes already rise 6px through `layout/PageTransition.tsx` (framer-motion). That
  is the only place framer-motion is used; page-level animation is CSS, so it costs no
  bundle and no hydration work.
- Motion is wired where the reader scrolls: listing grids, ranked rails, place galleries.
  Utility pages (policies, contact) stay still.

## Verifying a change

```bash
cd apps/web
npx tsc --noEmit
npm run build
```

Then check the rendered page for `bg-white`, `text-gray-`, `border-slate-`,
`rounded-[`, `text-[10px]` / `text-[11px]` and any `unsplash` URL that is not coming
from the API — all four are regressions. Motion has the same kind of check: a page
containing `duration-[`, `hover:scale-`, `animate-[`, `group-hover:translate-x-`,
`group-hover:scale-` or a hand-written `transition:` invented a move instead of using one
of the six. `grep -rn "group-hover:translate-x-0.5\|group-hover:scale-105" src/**/*.tsx`
should return nothing; those rows want `.link-nudge` and `.photo-zoom`.

Scroll behaviour is checked in the browser, not by reading the file, because the failure is
silent: load a listing page, run `window.scrollTo({top: document.body.scrollHeight,
behavior: 'instant'})`, then count `.dd-reveal:not([data-revealed="true"])` whose
`getBoundingClientRect().bottom < 0`. Any element in that set is copy the reader has already
scrolled past and cannot see. It must be empty.
