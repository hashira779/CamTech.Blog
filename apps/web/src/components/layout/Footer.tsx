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
type FooterLink = { href: string; label: string; key?: string; external?: boolean };

const columns: { headingKey: string; fallbackHeading: string; links: FooterLink[] }[] = [
  {
    headingKey: "footer.col_sections",
    fallbackHeading: "Sections",
    links: [
      { href: "/cambodia", label: "Cambodia", key: "nav.cambodia" },
      { href: "/world", label: "World", key: "nav.world" },
      { href: "/discover", label: "Discover", key: "nav.discover" },
      { href: "/trending", label: "Trending", key: "nav.trending" },
    ],
  },
  {
    headingKey: "footer.col_travel",
    fallbackHeading: "Travel",
    links: [
      { href: "/travel", label: "Guides", key: "footer.guides" },
      { href: "/travel/planner", label: "Trip Planner", key: "footer.trip_planner" },
      { href: "/cv-builder", label: "CV Builder", key: "nav.cv_builder" },
      { href: "/tools", label: "Tools", key: "nav.tools" },
    ],
  },
  {
    headingKey: "footer.col_editorial",
    fallbackHeading: "Editorial",
    links: [
      { href: "/editorial-policy", label: "Editorial Policy", key: "footer.editorial_policy" },
      { href: "/content-standards", label: "Content Standards", key: "footer.content_standards" },
      { href: "/corrections-policy", label: "Corrections", key: "footer.corrections" },
      { href: "/sources", label: "Our Sources", key: "footer.sources" },
    ],
  },
  {
    headingKey: "footer.col_company",
    fallbackHeading: "Company",
    links: [
      { href: "/about", label: "About", key: "footer.about" },
      { href: "/advertising", label: "Advertising", key: "footer.advertising" },
      { href: "/contact", label: "Contact", key: "footer.contact" },
    ],
  },
  {
    headingKey: "footer.col_legal",
    fallbackHeading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy", key: "footer.privacy" },
      { href: "/terms", label: "Terms of Service", key: "footer.terms" },
      { href: "/cookie-policy", label: "Cookie Policy", key: "footer.cookies" },
    ],
  },
];

export function Footer() {
  const { t } = useI18n();

  const label = (link: FooterLink) => {
    return link.key ? t(link.key) : link.label;
  };

  return (
    <footer className="field-footer">
      <Container className="py-12 sm:py-16">
        <div className="field-footer-top">
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

          <div className="field-footer-linkbox">
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
              {t("footer.all_sources")}
            </Link>
          </div>
        </div>

        <nav
          aria-label="Site"
          className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:grid-cols-3 lg:grid-cols-5"
        >
          {columns.map((column) => (
            <div key={column.headingKey}>
              <h2 className="kicker section-label text-accent">{t(column.headingKey) || column.fallbackHeading}</h2>
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
