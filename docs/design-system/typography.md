# Typography System

The typography system provides optimal legibility across both English and Khmer scripts (`Khmer OS Battambang`, `Kantumruy Pro`).

## 1. Type Scale Hierarchy
| Level | Desktop Size / Leading | Mobile Size | Weight | Class Name (`TYPOGRAPHY`) |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | 48px / 1.15 | 32px | Extrabold (800) | `text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight` |
| **H1** | 30px / 1.2 | 24px | Bold (700) | `text-2xl sm:text-3xl font-bold tracking-tight` |
| **H2** | 24px / 1.25 | 20px | Semibold (600) | `text-xl sm:text-2xl font-semibold tracking-tight` |
| **H3** | 20px / 1.3 | 18px | Semibold (600) | `text-lg sm:text-xl font-semibold` |
| **H4** | 16px / 1.4 | 15px | Semibold (600) | `text-base font-semibold` |
| **Body Large** | 18px / 1.6 | 16px | Normal (400) | `text-lg leading-relaxed text-foreground/90` |
| **Body** | 16px / 1.6 | 14px | Normal (400) | `text-sm sm:text-base leading-relaxed text-foreground/80` |
| **Body Small** | 14px / 1.5 | 13px | Normal (400) | `text-xs sm:text-sm leading-normal text-muted-foreground` |
| **Caption** | 12px / 1.4 | 11px | Medium (500) | `text-xs font-medium text-muted-foreground tracking-wide` |
| **Label** | 12px / 1.2 | 11px | Semibold (600) | `text-xs font-semibold uppercase tracking-wider text-muted-foreground` |

## 2. Reading Column Width Rule
Long-form article content (`apps/web/src/components/layout/article-shell.tsx`) is capped at `max-w-3xl` (65–75 characters per line). This prevents reader eye fatigue on ultrawide desktop monitors.
