# Motion & Transition Design

## 1. Subtle, Purposeful Transitions
Animations in Daily Discovery communicate state changes rather than decorative showmanship.

* **Hover transitions**: `transition-colors duration-150 ease-in-out` on buttons and nav links.
* **Card elevation**: `transition-transform duration-200 group-hover:scale-102` on hero image containers.
* **Drawer / Modal**: `animate-in fade-in duration-200` for overlays and drawers.
* **Loading Skeletons**: Standard gentle shimmer / pulse (`animate-pulse duration-1000`).

## 2. Prefers-Reduced-Motion Override
For users with vestibular motion sensitivities, all transitions and animations are collapsed globally in `apps/web/src/app/globals.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
