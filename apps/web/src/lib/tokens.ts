/**
 * CamTech.Blog — design token reference for component code.
 *
 * The values themselves live in `src/app/globals.css`; this module only exposes
 * the same scale to TSX so components stop inventing their own. Key names are
 * preserved for existing call sites.
 */

export const DESIGN_TOKENS = {
  // Spacing scale (multiples of 4px)
  spacing: {
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
  },

  // Standard icon sizes (lucide-react only)
  iconSize: {
    xs: 14,
    sm: 16,
    md: 18,
    lg: 20,
    xl: 24,
    display: 32,
  },

  // Aspect ratios. Travel photography prefers 3:2; news rails use 16:9.
  aspectRatio: {
    news: "aspect-video", // 16:9 heroes and grid cards
    feature: "aspect-[3/2]", // 3:2 lead images
    place: "aspect-[4/3]", // 4:3 destinations and places
    hotel: "aspect-[4/3]",
    avatar: "aspect-square",
    operator: "aspect-[16/9]",
  },

  // Border radii — bound to the --radius-* scale, so these are the only four
  // corners the site uses.
  radius: {
    sm: "rounded-sm", // 8px
    md: "rounded-md", // 12px
    lg: "rounded-lg", // 16px
    xl: "rounded-xl", // 20px
    hero: "rounded-2xl sm:rounded-3xl", // 24 / 28px, full-bleed photography
    full: "rounded-full",
  },

  // Elevation. Warm-tinted, from --shadow-*.
  shadow: {
    sm: "shadow-xs",
    md: "shadow-sm",
    lg: "shadow-md",
    popover: "shadow-lg",
  },

  // Content widths. Prefer <Container> over applying these by hand.
  container: {
    reading: "max-w-reading", // 46rem — editorial measure
    standard: "max-w-page", // 78rem
    wide: "max-w-wide", // 92rem — dashboards and map panels
  },
} as const;

/**
 * Typography scale.
 *
 * Two families only: `font-display` (Fraunces) for headlines, the default sans
 * (Inter) for everything else. Nothing on the site is smaller than 12px.
 */
export const TYPOGRAPHY = {
  display: "font-display text-4xl sm:text-5xl leading-[1.05] font-semibold tracking-tight",
  h1: "font-display text-3xl sm:text-4xl leading-tight font-semibold tracking-tight",
  h2: "font-display text-2xl sm:text-3xl leading-tight font-semibold tracking-tight",
  h3: "text-lg sm:text-xl leading-snug font-semibold tracking-tight",
  h4: "text-base leading-snug font-semibold",
  bodyLarge: "text-lg leading-relaxed text-foreground/90",
  body: "text-base leading-relaxed text-muted-foreground",
  bodySmall: "text-sm leading-normal text-muted-foreground",
  caption: "text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground",
  label: "text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground",
} as const;

/**
 * Section accents. Each entry maps to a token hue in globals.css; the tints are
 * derived with color-mix so a hue change never needs six edits.
 */
export const CATEGORY_TOKENS: Record<
  string,
  { label: string; badgeClass: string; borderClass: string; textClass: string }
> = {
  news: {
    label: "News",
    badgeClass: "bg-category-news/10 text-category-news",
    borderClass: "border-category-news/30",
    textClass: "text-category-news",
  },
  world: {
    label: "World",
    badgeClass: "bg-category-world/10 text-category-world",
    borderClass: "border-category-world/30",
    textClass: "text-category-world",
  },
  travel: {
    label: "Travel",
    badgeClass: "bg-category-travel/10 text-category-travel",
    borderClass: "border-category-travel/30",
    textClass: "text-category-travel",
  },
  discover: {
    label: "Discover",
    badgeClass: "bg-category-discover/10 text-category-discover",
    borderClass: "border-category-discover/30",
    textClass: "text-category-discover",
  },
  quiz: {
    label: "Quiz",
    badgeClass: "bg-category-quiz/10 text-category-quiz",
    borderClass: "border-category-quiz/30",
    textClass: "text-category-quiz",
  },
  tools: {
    label: "Tools",
    badgeClass: "bg-category-tools/10 text-category-tools",
    borderClass: "border-category-tools/30",
    textClass: "text-category-tools",
  },
  transport: {
    label: "Transport",
    badgeClass: "bg-category-transport/10 text-category-transport",
    borderClass: "border-category-transport/30",
    textClass: "text-category-transport",
  },
};
