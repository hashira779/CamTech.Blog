"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, Laptop, ArrowUpRight, Flag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { SuperSearch } from "@/components/shared/SuperSearch";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const navLinks: { href: string; key: string }[] = [
  { href: "/", key: "nav.home" },
  { href: "/travel", key: "nav.travel" },
  { href: "/tools", key: "nav.tools" },
  { href: "/discover", key: "nav.discover" },
  { href: "/cambodia", key: "nav.cambodia" },
];

function isNavActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  if (href === "/tools") {
    return pathname.startsWith("/tools") || pathname.startsWith("/cv-builder");
  }
  return pathname.startsWith(href);
}
const subscribeHydration = () => () => {};

export function Header() {
  const pathname = usePathname();
  const { lang, setLang, t } = useI18n();
  const { theme, isDark, setTheme } = useTheme();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const open = menuPath !== null && menuPath === pathname;
  const setOpen = (next: boolean) => setMenuPath(next ? pathname : null);
  const mounted = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuPath !== null) {
        setMenuPath(null);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuPath]);

  const reportHref =
    pathname && pathname !== "/contact"
      ? `/contact?topic=bug&page=${encodeURIComponent(pathname)}`
      : "/contact";

  return (
    <header className="field-header" data-scrolled={scrolled ? "true" : "false"}>
      <div className="field-topline">
        <Container>
          <span>{t("header.topline_tagline")}</span>
          <div className="field-topline-links">
            <Link href={reportHref}>
              <Flag size={11} aria-hidden="true" />
              <span>{t("nav.feedback")}</span>
            </Link>
            <span className="field-topline-divider" aria-hidden="true">·</span>
            <Link href="/about" className="field-topline-corner">
              {t("header.topline_corner")} <ArrowUpRight size={11} aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </div>
      <Container className="field-masthead">
        <Link href="/" aria-label="CamTech.Blog home" className="shrink-0"><Logo size="md" variant="wordmark" /></Link>
        <nav aria-label="Main navigation" className="field-desktop-nav">
          {navLinks.map(({ href, key }) => (
            <Link
              href={href}
              key={href}
              aria-current={isNavActive(href, pathname) ? "page" : undefined}
            >
              <span>{t(key)}</span>
            </Link>
          ))}
        </nav>
        <div className="field-header-actions">
          <SuperSearch />
          <button type="button" className="field-theme-button" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={mounted && isDark ? "Switch to light mode" : "Switch to dark mode"}>{mounted && isDark ? <Sun size={17} /> : <Moon size={17} />}</button>
          <div className="field-desktop-language"><LangToggle lang={lang} setLang={setLang} compact /></div>
          <button ref={menuButton} type="button" className="field-menu-button" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-navigation">{open ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </Container>
      {open && (
        <div id="mobile-navigation" className="field-mobile-nav">
          <Container>
            <nav aria-label="Mobile navigation">
              {navLinks.map(({ href, key }) => (
                <Link
                  href={href}
                  key={href}
                  onClick={() => setOpen(false)}
                  aria-current={isNavActive(href, pathname) ? "page" : undefined}
                >
                  <span>{t(key)}</span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              ))}
              <Link
                href={reportHref}
                className="field-mobile-report"
                onClick={() => setOpen(false)}
                aria-current={pathname === "/contact" ? "page" : undefined}
              >
                <span className="inline-flex items-center gap-2.5">
                  <Flag size={16} aria-hidden="true" />
                  <span>{t("nav.feedback")}</span>
                </span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </nav>
            <div className="field-mobile-settings"><ThemeToggle mounted={mounted} theme={theme} setTheme={setTheme} compact /><LangToggle lang={lang} setLang={setLang} /></div>
          </Container>
        </div>
      )}
    </header>
  );
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
