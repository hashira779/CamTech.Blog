# Accessibility & WCAG Compliance Standards

Daily Discovery targets WCAG 2.1 AA accessibility across all pages.

## 1. Accessible Focus Rings
All interactive components (Buttons, Inputs, Selects, Links, Tabs) declare visible, high-contrast focus rings:
```css
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```
Browser default focus outlines are never hidden without being replaced by this styled ring.

## 2. Contrast Requirements
* Normal body text ($\le 18px$) maintains a minimum contrast ratio of **4.5:1** against the background surface.
* Large text ($\ge 24px$ or bold $\ge 18px$) maintains a minimum contrast ratio of **3:1**.
* Muted text (`text-slate-500` light / `text-slate-400` dark) meets or exceeds 4.5:1 on their respective light and dark surfaces.

## 3. ARIA & Screen Reader Support
* Icon-only buttons (like theme toggle or clear search) provide `aria-label` attributes.
* Forms use explicit `<label htmlFor="...">` associations.
* Status pills and badges carry semantic text labels in addition to icons.
* Tabs adhere to WAI-ARIA tablist/tab/tabpanel keyboard navigation.
