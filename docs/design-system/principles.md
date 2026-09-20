# Design Principles: Daily Discovery Platform

## 1. Core Philosophy: Clarity Before Decoration
The primary goal of the Daily Discovery design system is to convey trustworthy news, cultural travel intelligence, and actionable tools with maximum readability and visual calm.

Prioritize in order:
1. **Usability**: Primary actions and interactive states are unmistakable.
2. **Information Hierarchy**: Headings, summaries, timestamps, and sources are scannable in under 3 seconds.
3. **Readability**: Controlled reading line lengths (`max-w-3xl` for editorial copy) and balanced line heights.
4. **Consistency**: The same primitive, card, badge, or input pattern is reused across all routes without page-level divergence.
5. **Accessibility**: Strict WCAG 2.1 AA contrast compliance, keyboard focus rings, and screen-reader labels.
6. **Performance**: Zero visual layout shifts (CLS), standard aspect ratios on media containers, minimal CSS bundle overhead.
7. **Visual Polish**: Subtle, restrained elevation and state transitions rather than flashy novelties.

---

## 2. Anti-Patterns (What We Avoid)
* **No Flashy Animations**: No floating background orbs, continuous bouncing badges, or heavy parallax.
* **No Arbitrary Gradients**: Gradients are exceptional; clean solid surfaces provide high-contrast readability.
* **No Oversized Cards or Pill-shaped Blobs**: Border radii are restrained to `sm` (4px), `md` (6px), and `lg` (8px).
* **No Emoji as UI Navigation**: Emojis are reserved for colloquial text content only. System navigation uses standardized Lucide icons.
* **No Color Chaos**: Each category uses predetermined semantic tokens rather than arbitrary bright colors.
