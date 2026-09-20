# Design Tokens Specification

All visual primitives across Daily Discovery derive from centralized tokens defined in `apps/web/src/lib/tokens.ts` and `apps/web/src/app/globals.css`.

## 1. Spacing Scale (4px Base Unit)
| Token | REM Value | Pixel Value | Standard Usage |
| :--- | :--- | :--- | :--- |
| `1` | `0.25rem` | 4px | Inline icon gaps, badge padding |
| `2` | `0.5rem` | 8px | Button padding-y, form field vertical gaps |
| `3` | `0.75rem` | 12px | Card header padding-bottom, breadcrumbs |
| `4` | `1rem` | 16px | Standard component padding, list spacing |
| `5` | `1.25rem` | 20px | Card padding, section gaps |
| `6` | `1.5rem` | 24px | Grid gap on tablets/desktops |
| `8` | `2rem` | 32px | Page header margin-bottom, major section dividers |
| `12` | `3rem` | 48px | Page bottom margins, footer top padding |
| `16` | `4rem` | 64px | Hero section spacing |

## 2. Border Radii
* `sm` (`4px`): Badges, inline chips, status pills.
* `md` (`6px`): Buttons, form inputs, select dropdowns, code blocks.
* `lg` (`8px`): Content cards, modal dialogs, search containers.
* `xl` (`12px`): Hero visual frames, featured editorial cards.
* `full` (`9999px`): Category chips, avatar photos, circular icon badges.

## 3. Shadows & Elevation
* `shadow-xs`: Subtle card resting state.
* `shadow-sm`: Interactive card hover elevation.
* `shadow-md`: Dropdown menus and floating quick action bars.
* `shadow-lg`: Modal dialogs and alert dialog drawers.

## 4. Standard Media Aspect Ratios
* `16:9` (`aspect-video`): News heroes, article thumbnails, transit vehicle photos.
* `4:3` (`aspect-[4/3]`): Destination landmarks, hotels, place galleries.
* `1:1` (`aspect-square`): Author avatars, verified contributor badges.
