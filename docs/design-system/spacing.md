# Spacing & Grid System

## 1. Predictable Responsive Grid
* **Desktop ($\ge$ 1024px)**: 12-column grid system (`grid-cols-12`) with `gap-6` or `gap-8`.
* **Tablet (768px - 1023px)**: 8-column layout or 2-column card grid (`grid-cols-2`).
* **Mobile (< 768px)**: Single column stream (`grid-cols-1`) with `gap-4`.

## 2. Container Max Widths
* **`reading`** (`max-w-3xl` / 768px): Long-form articles, policy pages, terms.
* **`standard`** (`max-w-7xl` / 1280px): Destination listings, hotel catalogs, tool explorers, homepage.
* **`wide`** (`max-w-screen-2xl` / 1536px): High-density admin consoles and interactive map viewports.

## 3. Section Spacing Standards
* Component internal padding: `p-4 sm:p-5`
* List row separation: `space-y-3`
* Page header margin bottom: `mb-6 sm:mb-8`
* Major section vertical separation: `mt-10 sm:mt-14`
