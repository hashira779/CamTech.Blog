"use client";

import React from "react";
import Link from "next/link";
import { Rss, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/Logo";

/**
 * Footer.
 *
 * Same destinations as before, restated on the token palette: one hairline
 * column grid, small caps headings, no borrowed ad-network jargon. The literal
 * "Standard AdSense Optimized UI" line is gone — it described an ad slot, not
 * the site, and it was the only thing in the footer a reader could not verify.
 *
 * Labels reuse existing dictionary keys where they have them. Nothing here
 * invents a Khmer translation: an untranslated English label is honest, a wrong
 * one is not.
 */
type FooterLink = { href: string; label: string; external?: boolean };

const columns: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Sections",
    links: [
      { href: "/cambodia", label: "Cambodia" },
      { href: "/world", label: "World" },
      { href: "/discover", label: "Discover" },
      { href: "/trending", label: "Trending" },
    ],
  },
  {
    heading: "Travel",
    links: [
      { href: "/travel", label: "Guides" },
      { href: "/travel/planner", label: "Trip Planner" },
      { href: "/quiz", label: "Daily Quiz" },
      { href: "/tools", label: "Tools" },
    ],
  },
  {
    heading: "Editorial",
    links: [
      { href: "/editorial-policy", label: "Editorial Policy" },
      { href: "/content-standards", label: "Content Standards" },
      { href: "/corrections-policy", label: "Corrections" },
      { href: "/sources", label: "Our Sources" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/advertising", label: "Advertising" },
      { href: "/contact", label: "Contact" },
      { href: "https://cms.camtech.cam", label: "CMS Portal", external: true },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookie-policy", label: "Cookie Policy" },
    ],
  },
];

/** Existing dictionary keys that already cover these routes in both languages. */
const TRANSLATED: Record<string, string> = {
  "/cambodia": "nav.cambodia",
  "/world": "nav.world",
  "/discover": "nav.discover",
  "/trending": "nav.trending",
  "/travel": "nav.travel",
  "/quiz": "nav.quiz",
  "/tools": "nav.tools",
  "/about": "footer.about",
  "/contact": "footer.contact",
  "/editorial-policy": "footer.editorial_policy",
  "/corrections-policy": "footer.corrections",
  "/advertising": "footer.advertising",
  "/privacy": "footer.privacy",
  "/terms": "footer.terms",
  "/cookie-policy": "footer.cookies",
};

export function Footer() {
  const { lang, t } = useI18n();

  const label = (link: FooterLink) => {
    const key = TRANSLATED[link.href];
    return key ? t(key) : link.label;
  };

  return (
    <footer className="mt-16 border-t border-border bg-surface select-none">
      <Container className="py-12 sm:py-16">
        <div className="flex flex-col gap-6 border-b border-border pb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <Link
              href="/"
              className="inline-flex items-center"
            >
              <Logo size="lg" />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/feed.xml"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              <Rss size={14} aria-hidden="true" />
              RSS
            </Link>
            <Link
              href="/sources"
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              <ArrowUpRight size={14} aria-hidden="true" />
              {lang === "km" ? "ប្រភព" : "All sources"}
            </Link>
          </div>
        </div>

        <nav
          aria-label="Site"
          className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {columns.map((column) => (
            <div key={column.heading}>
              <h2 className="kicker section-label text-accent">{column.heading}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="title-sweep inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-accent"
                      >
                        {label(link)}
                        <ArrowUpRight size={13} aria-hidden="true" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="title-sweep text-muted-foreground transition-colors hover:text-accent"
                      >
                        {label(link)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-3 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CamTech.Blog</p>
          <p>{t("footer.copyright")}</p>
        </div>
      </Container>
    </footer>
  );
}
