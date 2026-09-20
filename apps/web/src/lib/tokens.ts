/**
 * Daily Discovery Platform - Unified Design System Tokens
 * Source of truth for spacing, typography, radii, icon sizes, and semantic styles.
 */

export const DESIGN_TOKENS = {
  // Spacing scale (multiples of 4px)
  spacing: {
    1: "0.25rem",  // 4px
    2: "0.5rem",   // 8px
    3: "0.75rem",  // 12px
    4: "1rem",      // 16px
    5: "1.25rem",  // 20px
    6: "1.5rem",   // 24px
    8: "2rem",     // 32px
    10: "2.5rem",  // 40px
    12: "3rem",    // 48px
    16: "4rem",    // 64px
    20: "5rem",    // 80px
    24: "6rem",    // 96px
  },

  // Standard Icon Sizes (Lucide icons only)
  iconSize: {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24,
    display: 32,
  },

  // Aspect Ratios for visual media
  aspectRatio: {
    news: "aspect-video",         // 16:9 for article heroes and cards
    place: "aspect-[4/3]",        // 4:3 for destinations and places
    hotel: "aspect-[4/3]",        // 4:3 for hotel rooms and amenities
    avatar: "aspect-square",      // 1:1 for author/user avatars
    operator: "aspect-[16/9]",    // 16:9 for transit operator buses
  },

  // Standard Border Radii
  radius: {
    sm: "rounded",          // 4px
    md: "rounded-md",       // 6px
    lg: "rounded-lg",       // 8px
    xl: "rounded-xl",       // 12px
    full: "rounded-full",   // 9999px
  },

  // Standard Shadows (subtle elevation, avoid over-shadowing)
  shadow: {
    sm: "shadow-xs",
    md: "shadow-sm",
    lg: "shadow-md",
    popover: "shadow-lg",
  },

  // Container Max Widths
  container: {
    reading: "max-w-3xl",    // 768px for readable editorial copy
    standard: "max-w-7xl",   // 1280px standard content width
    wide: "max-w-screen-2xl",// 1536px for dashboards and map panels
  },
} as const;

/**
 * Standard Typography scale class names
 */
export const TYPOGRAPHY = {
  display: "text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight",
  h1: "text-2xl sm:text-3xl font-bold tracking-tight",
  h2: "text-xl sm:text-2xl font-semibold tracking-tight",
  h3: "text-lg sm:text-xl font-semibold",
  h4: "text-base font-semibold",
  bodyLarge: "text-lg leading-relaxed text-foreground/90",
  body: "text-sm sm:text-base leading-relaxed text-foreground/80",
  bodySmall: "text-xs sm:text-sm leading-normal text-muted-foreground",
  caption: "text-xs font-medium text-muted-foreground tracking-wide",
  label: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
} as const;

/**
 * Category Semantic Accent Tokens
 */
export const CATEGORY_TOKENS: Record<string, { label: string; badgeClass: string; borderClass: string; textClass: string }> = {
  news: {
    label: "News",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    borderClass: "border-blue-500",
    textClass: "text-blue-600 dark:text-blue-400",
  },
  travel: {
    label: "Travel",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    borderClass: "border-emerald-500",
    textClass: "text-emerald-600 dark:text-emerald-400",
  },
  discover: {
    label: "Discover",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    borderClass: "border-purple-500",
    textClass: "text-purple-600 dark:text-purple-400",
  },
  quiz: {
    label: "Quiz",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    borderClass: "border-amber-500",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  tools: {
    label: "Tools",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800",
    borderClass: "border-cyan-500",
    textClass: "text-cyan-600 dark:text-cyan-400",
  },
  transport: {
    label: "Transport",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800",
    borderClass: "border-indigo-500",
    textClass: "text-indigo-600 dark:text-indigo-400",
  },
};
