# Responsive Design & Breakpoint Standards

## 1. Breakpoint Scale
| Breakpoint | Minimum Width | Device Category | Standard Layout Behavior |
| :--- | :--- | :--- | :--- |
| `sm` | 640px | Large phones / phablets | 2-column card grids, compact search |
| `md` | 768px | Tablets | Tablet navbar, 2-column listing, side-by-side forms |
| `lg` | 1024px | Small laptops | Full horizontal desktop navigation, 3-column card grid |
| `xl` | 1280px | Standard desktop monitors | 4-column card grid, sidebar layouts (`8:4` column split) |
| `2xl` | 1536px | Large widescreen displays | Wide map & dashboard views with max container constraints |

## 2. Mobile Conversion Rules
1. **Map / List Toggle**: On desktop, maps and place listings render side-by-side. On mobile, a segmented control toggles between Map and List views to prevent the map from trapping touch scrolls.
2. **Filters Drawer**: On desktop, search filters occupy a dedicated sidebar column. On mobile, filters collapse into a bottom sheet drawer.
3. **Table Horizontal Scrolling**: Admin tables wrap with overflow containers (`overflow-x-auto`) to preserve high-density data integrity without clipped columns.
