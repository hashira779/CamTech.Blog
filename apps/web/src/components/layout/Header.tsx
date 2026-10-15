"use client";

import React, { useEffect, useState } from "react";
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
 * The old header stacked three bars of teal gradients, glass blur, a neon
 * underline and a pulsing rose pill, so nothing read as the brand. This is one
 * quiet paper masthead: serif wordmark, hairline rules, a single accent for the
 * active section. Same routes, same controls, no invented colour.
 *
 * Labels come from the `nav.*` dictionary keys rather than a second inline copy
 * table — the header used to carry its own translations that drifted from the
 * ones every other page used.
 */
const navLinks = [
  { href: "/", labelKey: "nav.home" },
  { href: "/cambodia", labelKey: "nav.cambodia" },
  { href: "/world", labelKey: "nav.world" },
  { href: "/discover", labelKey: "nav.discover" },
  { href: "/travel", labelKey: "nav.travel" },
  { href: "/quiz", labelKey: "nav.quiz" },
  { href: "/tools", labelKey: "nav.tools" },
  { href: "/trending", labelKey: "nav.trending" },
];

function isActivePath(pathname: string | null, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || Boolean(pathname?.startsWith(href + "/"));
}

export function Header() {
  const pathname = usePathname();
  const { lang, setLang, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // A route change should never leave the drawer open over a new page.
    setMobileMenuOpen(false);
  }, [pathname]);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-50 select-none border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      {/* Utility rail — date, theme, language. Quiet, small, hairline-separated. */}
      <div className="hidden border-b border-border/70 lg:block">
        <Container className="flex h-9 items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="font-medium text-foreground/80 tabular-nums">{today}</span>
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

          <Link href="/" className="group inline-flex items-center">
            <Logo size="md" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <SuperSearch />
          {/* Mobile-only controls; the desktop rail already carries them. */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle mounted={mounted} theme={theme} setTheme={setTheme} compact />
            <LangToggle lang={lang} setLang={setLang} compact />
          </div>
        </div>
      </Container>

      {/* Section nav */}
      <nav className="hidden border-t border-border/70 lg:block">
        <Container>
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActivePath(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block px-3 py-3 text-sm font-medium transition-colors",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(link.labelKey)}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3 bottom-0 h-px transition-colors",
                        active ? "bg-accent" : "bg-transparent"
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
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
                          : "font-medium text-foreground hover:text-accent"
                      )}
                    >
                      {t(link.labelKey)}
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
              "flex items-center justify-center rounded-xs transition-colors",
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
              "rounded-xs text-xs transition-colors",
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
