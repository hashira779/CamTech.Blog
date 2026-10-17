"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, Laptop } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { SuperSearch } from "@/components/shared/SuperSearch";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

/**
 * Masthead.
 *
 * One paper masthead that folds away as you read. The utility rail, the wordmark and the search
 * field are the front door, and they are the first thing to go: past a short scroll the header
 * collapses to the section nav alone, with a compact mark of the brand beside it, so the bar that
 * stays pinned is the one that tells you where you are. The fold is the grid-row accordion in
 * globals.css, which needs no fixed heights and no JS measuring.
 *
 * The active-section mark is a single element that slides between links rather than a border on
 * each one. It follows the pointer while you hover and returns to the current page — the reason
 * the nav reads as built rather than styled. Movement is a transform on a 2px rule, so it never
 * touches layout.
 *
 * Labels come from the `nav.*` dictionary keys rather than a second inline copy table — the header
 * used to carry its own translations that drifted from the ones every other page used.
 */
const navLinks: { href: string; labelKey: string; highlight?: boolean }[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/cambodia", labelKey: "nav.cambodia" },
  { href: "/world", labelKey: "nav.world" },
  { href: "/discover", labelKey: "nav.discover" },
  { href: "/travel", labelKey: "nav.travel" },
  { href: "/quiz", labelKey: "nav.quiz" },
  { href: "/tools", labelKey: "nav.tools" },
  { href: "/trending", labelKey: "nav.trending" },
  { href: "/wedding", labelKey: "nav.wedding", highlight: true },
];

function isActivePath(pathname: string | null, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || Boolean(pathname?.startsWith(href + "/"));
}

/** True once the reader has scrolled past the masthead. rAF-batched, passive, no layout thrash. */
function useFolded(threshold = 96) {
  const [folded, setFolded] = useState(false);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      setFolded((window.scrollY || document.documentElement.scrollTop || 0) > threshold);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return folded;
}

export function Header() {
  const pathname = usePathname();
  const { lang, setLang, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const folded = useFolded();

  const listRef = useRef<HTMLUListElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const [indicator, setIndicator] = useState<{ x: number; w: number; href: string } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // A route change should never leave the drawer open over a new page.
    setMobileMenuOpen(false);
  }, [pathname]);

  const place = useCallback((href: string) => {
    const list = listRef.current;
    const item = itemRefs.current.get(href);
    if (!list || !item) return;
    const listBox = list.getBoundingClientRect();
    const box = item.getBoundingClientRect();
    if (box.width <= 0) return;
    setIndicator({ x: box.left - listBox.left, w: box.width, href });
  }, []);

  const activeHref =
    navLinks.find((link) => isActivePath(pathname, link.href))?.href ?? navLinks[0].href;

  // Re-place after layout, after a route change, and whenever the row reflows.
  useLayoutEffect(() => {
    place(activeHref);
  }, [activeHref, place, lang]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") {
      const onResize = () => place(activeHref);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    const observer = new ResizeObserver(() => place(activeHref));
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeHref, place]);

  /* A webfont that lands after first paint changes every link's width. The observer above only
     watches the row, and the row's width does not change — its children do. */
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts?.ready) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) place(activeHref);
    });
    return () => {
      cancelled = true;
    };
  }, [activeHref, place]);

  // When viewing a public wedding invitation card, hide the blog header completely
  if (pathname && pathname.startsWith("/wedding/") && pathname !== "/wedding") {
    return null;
  }

  return (
    <header
      data-scrolled={folded ? "true" : "false"}
      className="sticky top-0 z-50 select-none border-b border-border bg-background/92 backdrop-blur-md supports-[backdrop-filter]:bg-background/75"
    >
      {/* Everything above the section nav folds away together. */}
      <div className="masthead-fold">
        <div>
          {/* Utility rail — date, theme, language. Quiet, small, hairline-separated. */}
          <div className="hidden border-b border-border/70 lg:block">
            <Container className="flex h-9 items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground/80 tabular-nums">{formatDateline()}</span>
                <span aria-hidden="true" className="text-border-strong">/</span>
                <span>{t("brand.tagline")}</span>
              </div>

              <div className="flex items-center gap-2">
                <ThemeToggle mounted={mounted} theme={theme} setTheme={setTheme} />
                <LangToggle lang={lang} setLang={setLang} />
              </div>
            </Container>
          </div>

          {/* Masthead */}
          <Container className="flex items-center justify-between gap-4 py-4 sm:py-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
                className="-ml-2 rounded-md p-2 text-foreground transition-colors hover:bg-muted lg:hidden"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <Link href="/" className="group inline-flex items-center" aria-label="CamTech.Blog home">
                <Logo size="md" />
              </Link>
            </div>

            {/* Mobile-only controls; the desktop utility rail already carries them. The search
                field lives in the pinned nav row so it stays reachable after this bar folds. */}
            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle mounted={mounted} theme={theme} setTheme={setTheme} compact />
              <LangToggle lang={lang} setLang={setLang} compact />
            </div>
          </Container>
        </div>
      </div>

      {/* Section nav — the part that stays. */}
      <nav
        aria-label="Sections"
        className={cn(
          "border-t transition-colors",
          folded ? "border-t-transparent" : "border-t-border/70"
        )}
      >
        <Container className="flex items-center gap-1">
          {/* Compact identity, for when the masthead has folded away. Fixed width so nothing
              reflows as it crossfades, and out of the tab order and the accessibility tree while
              the full masthead above still carries the brand. */}
          <span
            aria-hidden={!folded || undefined}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center transition-opacity duration-200 lg:mr-1",
              folded ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <Link href="/" tabIndex={folded ? undefined : -1} aria-label="CamTech.Blog home" className="contents">
              <Logo size="sm" />
            </Link>
          </span>

          <ul ref={listRef} className="relative flex min-w-0 items-stretch overflow-x-auto no-scrollbar">
            {navLinks.map((link) => {
              const active = isActivePath(pathname, link.href);
              return (
                <li
                  key={link.href}
                  ref={(node) => {
                    if (node) itemRefs.current.set(link.href, node);
                    else itemRefs.current.delete(link.href);
                  }}
                  onMouseEnter={() => place(link.href)}
                  onMouseLeave={() => place(activeHref)}
                  className="shrink-0"
                >
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors lg:py-3",
                      active
                        ? "text-accent lg:text-foreground"
                        : link.highlight
                        ? "text-amber-500 hover:text-amber-400 font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{t(link.labelKey)}</span>
                    {link.highlight && (
                      <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500 border border-amber-500/30">
                        NEW
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}

            {/* One rule that travels; the link owns the meaning, this owns the eye. */}
            <span
              aria-hidden="true"
              className="nav-indicator hidden lg:block"
              style={{
                transform: indicator
                  ? `translate3d(${indicator.x}px, 0, 0) scaleX(${indicator.w})`
                  : "translate3d(0, 0, 0) scaleX(0)",
                opacity: indicator ? 1 : 0,
              }}
            />
          </ul>

          <div className="ml-auto flex shrink-0 items-center gap-2 pl-1">
            <SuperSearch />
          </div>
        </Container>
      </nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-surface lg:hidden">
          <Container className="py-3">
            <ul className="divide-y divide-border/70">
              {navLinks.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between py-3 text-sm transition-colors",
                        active
                          ? "font-semibold text-accent"
                          : link.highlight
                          ? "font-semibold text-amber-500"
                          : "font-medium text-foreground hover:text-accent"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {t(link.labelKey)}
                        {link.highlight && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500 border border-amber-500/30">
                            NEW
                          </span>
                        )}
                      </span>
                      {active && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 sm:hidden">
              <ThemeToggle mounted={mounted} theme={theme} setTheme={setTheme} />
              <LangToggle lang={lang} setLang={setLang} />
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}

/** "Wednesday 15 October 2026" — the dateline is print's, and it tells the reader which edition this is. */
function formatDateline() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type ThemeMode = "light" | "dark" | "system";

function ThemeToggle({
  mounted,
  theme,
  setTheme,
  compact = false,
}: {
  mounted: boolean;
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
  compact?: boolean;
}) {
  const options: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
    { value: "light", label: "Light", Icon: Sun },
    { value: "dark", label: "Dark", Icon: Moon },
    { value: "system", label: "System", Icon: Laptop },
  ];

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-surface-muted/60 p-0.5">
      {options.map(({ value, label, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            title={`${label} mode`}
            aria-label={`${label} mode`}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              "pressable flex items-center justify-center rounded-xs transition-colors",
              compact ? "h-7 w-7" : "px-2 py-1",
              active
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={13} strokeWidth={active ? 2.25 : 1.75} />
            {compact || active ? null : <span className="ml-1.5 hidden text-xs font-medium xl:inline">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}

function LangToggle({
  lang,
  setLang,
  compact = false,
}: {
  lang: "en" | "km";
  setLang: (next: "en" | "km") => void;
  compact?: boolean;
}) {
  const options = [
    { value: "en" as const, label: "EN" },
    { value: "km" as const, label: "ខ្មែរ" },
  ];

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-surface-muted/60 p-0.5">
      {options.map(({ value, label }) => {
        const active = lang === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setLang(value)}
            aria-pressed={active}
            className={cn(
              "pressable rounded-xs text-xs transition-colors",
              compact ? "h-7 min-w-9 px-1" : "px-2.5 py-1",
              active
                ? "bg-surface font-semibold text-accent shadow-xs"
                : "font-medium text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
