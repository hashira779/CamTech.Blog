# Color System & Semantic Palette

Daily Discovery employs a semantic color architecture supporting Light Mode, Dark Mode, and system preferences without arbitrary page-level color assignments.

## 1. Core Surfaces & Foreground
| Role | Light Hex | Dark Hex | Semantic Intent |
| :--- | :--- | :--- | :--- |
| `background` | `#ffffff` | `#090d16` | Main viewport background |
| `foreground` | `#0f172a` | `#f8fafc` | Primary high-contrast text |
| `surface` | `#ffffff` | `#0f172a` | Resting card, sheet, and panel surfaces |
| `surface-muted` | `#f8fafc` | `#0c1222` | Secondary content strips and toolbars |
| `border` | `#e2e8f0` | `#1e293b` | Component dividers and card borders |
| `input` | `#cbd5e1` | `#334155` | Form input borders and inactive switches |

## 2. Brand & Semantic Action Colors
| Role | Light Token | Dark Token | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary** | Teal-700 (`#0f766e`) | Teal-500 (`#14b8a6`) | Key interactive actions, primary CTA buttons |
| **Secondary** | Slate-100 (`#f1f5f9`) | Slate-800 (`#1e293b`) | Secondary actions, inactive tab triggers |
| **Success** | Emerald-600 (`#10b981`) | Emerald-400 (`#34d399`) | Verified status, confirmation feedback |
| **Warning** | Amber-600 (`#f59e0b`) | Amber-400 (`#fbbf24`) | Needs review, provisional data, difficulty |
| **Destructive** | Red-600 (`#ef4444`) | Red-400 (`#f87171`) | Closed places, errors, irreversible actions |
| **Info** | Sky-600 (`#0284c7`) | Sky-400 (`#38bdf8`) | Informational badges, guidance callouts |

## 3. Category Accent Tokens
* **News**: Blue (`bg-blue-50 text-blue-700 border-blue-200`)
* **Travel**: Emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`)
* **Discover**: Purple (`bg-purple-50 text-purple-700 border-purple-200`)
* **Quiz**: Amber (`bg-amber-50 text-amber-700 border-amber-200`)
* **Tools**: Cyan (`bg-cyan-50 text-cyan-700 border-cyan-200`)
* **Transit**: Indigo (`bg-indigo-50 text-indigo-700 border-indigo-200`)
