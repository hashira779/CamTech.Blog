# Navigation System & Information Architecture

Daily Discovery uses a cohesive navigation system uniting all 34+ routes under one shared mental model.

## 1. Global Desktop Header
* **Brand Identity**: Compact logo (`Compass` inside teal rounded square) + Brand title ("DAILY.DISCOVERY") + bilingual tagline.
* **Top Navigation Bar**: Direct links to primary domains (`Home`, `Cambodia`, `World`, `Discover`, `Travel`, `Quiz`, `Tools`, `Trending`).
* **Global Utilities**:
  * Quick Search popover trigger.
  * Language toggle (`ខ្មែរ` / `EN`).
  * Theme switcher (`Light` / `Dark`).
  * Admin / CMS shortcut for verified staff.

## 2. Responsive Mobile Drawer
* On viewports $< 1024px$, navigation condenses into a clean side drawer with full touch targets ($\ge 44px$ height).
* Core domains are prominently listed with contextual Lucide icons.
* Nested sections (like Transit routes, Siem Reap guide, Trip Planner) are grouped cleanly under parent categories.

## 3. Breadcrumb Path Standard
* Breadcrumbs are rendered on every detail and nested listing page:
  `Home › Travel › Cambodia › Siem Reap › Hotels`
* Standard Lucide `ChevronRight` divider with `text-slate-400`.
* Truncated labels prevent horizontal overflow on narrow mobile screens.
