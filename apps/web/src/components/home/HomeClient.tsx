"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  Compass,
  Cpu,
  MapPin,
  Newspaper,
  Route,
  Sparkles,
} from "lucide-react";
import { cleanText, formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { Container } from "@/components/ui/container";
import { Photo } from "@/components/ui/photo";
import { Reveal } from "@/components/ui/reveal";
import type { Article, Discovery } from "@/types";

interface HomeClientProps {
  journal: Article[];
  explainers: Discovery[];
}

export function HomeClient({ journal, explainers }: HomeClientProps) {
  const { lang, t } = useI18n();
  const isKm = lang === "km";

  const destinations = [
    {
      slug: "siem-reap",
      name: t("home.dest_siemreap_name"),
      note: t("home.dest_siemreap_note"),
      image: "siem-reap",
      label: t("home.dest_siemreap_label"),
    },
    {
      slug: "kampot",
      name: t("home.dest_kampot_name"),
      note: t("home.dest_kampot_note"),
      image: "kampot",
      label: t("home.dest_kampot_label"),
    },
    {
      slug: "ratanakiri",
      name: t("home.dest_ratanakiri_name"),
      note: t("home.dest_ratanakiri_note"),
      image: "ratanakiri",
      label: t("home.dest_ratanakiri_label"),
    },
  ];

  const pathways = [
    {
      href: "/travel",
      number: "01",
      tag: isKm ? "កម្ពុជា" : "Cambodia",
      title: t("home.pathway_1_title"),
      note: t("home.pathway_1_note"),
      Icon: Compass,
      tone: "green",
    },
    {
      href: "/cambodia",
      number: "02",
      tag: isKm ? "ជីវិត" : "Life",
      title: t("home.pathway_2_title"),
      note: t("home.pathway_2_note"),
      Icon: Newspaper,
      tone: "orange",
    },
    {
      href: "/discover",
      number: "03",
      tag: isKm ? "បច្ចេកវិទ្យា" : "Technology",
      title: t("home.pathway_3_title"),
      note: t("home.pathway_3_note"),
      Icon: Cpu,
      tone: "purple",
    },
  ];

  return (
    <div className="field-home" lang={isKm ? "km" : undefined}>
      <Container>
        <section className="field-hero" aria-labelledby="home-title">
          <div className="field-hero-copy">
            <p className="field-eyebrow">
              <span className="field-sun" aria-hidden="true">✳</span> {t("home.hero_eyebrow")}
            </p>
            <h1 id="home-title">
              {t("home.hero_title_1")}<br />
              {t("home.hero_title_2")}<br />
              <em>{t("home.hero_title_3")}</em>
            </h1>
            <p className="field-hero-deck">{t("home.hero_deck")}</p>
            <div className="field-actions">
              <Link href="/travel" className="field-button">
                {t("home.explore_cambodia")} <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/cambodia" className="field-button-secondary">
                {t("home.browse_journal")} <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <a href="#start-exploring" className="field-scroll">
              <span><ArrowDown size={14} aria-hidden="true" /></span> {t("home.start_exploring")}
            </a>
          </div>

          <div className="field-hero-visual">
            <Link
              href="/travel/ratanakiri"
              className="field-cover group"
              aria-label="Explore Ratanakiri and its crater lake"
            >
              <Image
                src="/images/destinations/ratanakiri.jpg"
                alt="A blue crater lake surrounded by the green landscape of Ratanakiri, Cambodia"
                fill
                priority
                sizes="(max-width: 767px) 94vw, 52vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="field-cover-scrim" />
              <span className="field-cover-tag">
                <MapPin size={12} aria-hidden="true" /> {t("home.hero_visual_tag")}
              </span>
              <span className="field-cover-caption">
                <span>{t("home.hero_visual_collection")}</span>
                <strong className="whitespace-pre-line">{t("home.hero_visual_heading")}</strong>
              </span>
              <span className="field-cover-arrow">
                <ArrowUpRight size={23} aria-hidden="true" />
              </span>
            </Link>

            <Link href="/travel/planner" className="field-planner-note">
              <span className="field-note-icon">
                <Route size={22} aria-hidden="true" />
              </span>
              <span>
                <small>{t("home.hero_planner_tag")}</small>
                <strong>{t("home.hero_planner_sub")}</strong>
              </span>
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <span className="field-visual-note">{t("home.hero_visual_sub")}</span>
          </div>
        </section>

        <Reveal variant="up">
          <nav id="start-exploring" aria-label="Cambodia, Life and Technology pillars" className="field-pathways">
            {pathways.map(({ href, number, tag, title, note, Icon, tone }) => (
              <Link key={href} href={href} className="field-pathway group">
                <span className={`field-path-icon ${tone}`}>
                  <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <small>{number} / {tag}</small>
                  <strong>{title}</strong>
                  <span>{note}</span>
                </span>
                <ArrowUpRight size={18} className="field-path-arrow" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </Reveal>

        <section className="field-section" aria-labelledby="places-title">
          <Reveal variant="up">
            <div className="field-section-heading">
              <div>
                <p className="field-eyebrow">{t("home.places_eyebrow")}</p>
                <h2 id="places-title">{t("home.places_title")}</h2>
                <p>{t("home.places_desc")}</p>
              </div>
              <Link href="/travel" className="field-text-link">
                {t("home.explore_all_destinations")} <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

          <div className="field-destinations">
            {destinations.map((place, index) => (
              <Reveal key={place.slug} index={index} variant="up" className="min-w-0">
                <Link href={`/travel/${place.slug}`} className="field-destination group">
                  <div className="field-destination-image">
                    <Image
                      src={`/images/destinations/${place.image}.jpg`}
                      alt={`Landscape of ${place.name}, Cambodia`}
                      fill
                      sizes="(max-width: 639px) 92vw, (max-width: 1023px) 45vw, 31vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="field-destination-label">{place.label}</span>
                    <span className="field-destination-number">0{index + 1}</span>
                  </div>
                  <div className="field-destination-copy">
                    <div>
                      <h3>{place.name}</h3>
                      <p>{place.note}</p>
                    </div>
                    <span>
                      <ArrowUpRight size={20} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {journal.length > 0 && (
          <section className="field-section field-journal" aria-labelledby="journal-title">
            <Reveal variant="up">
              <div className="field-section-heading">
                <div>
                  <p className="field-eyebrow">{t("home.journal_eyebrow")}</p>
                  <h2 id="journal-title">{t("home.journal_title")}</h2>
                </div>
                <Link href="/cambodia" className="field-text-link">
                  {t("home.browse_journal")} <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>

            <Reveal variant="left">
              <div className="field-journal-list">
                {journal.map((article) => {
                  const articleTitle = cleanText(isKm && article.title_km ? article.title_km : article.title);
                  return (
                    <Link
                      key={article.id}
                      href={`/${article.country === "KH" ? "cambodia" : "world"}/news/${article.slug}`}
                    >
                      <span className="field-eyebrow">{article.category?.name || (isKm ? "ព័ត៌មាន" : "Journal")}</span>
                      <h3>{articleTitle}</h3>
                      <time dateTime={article.published_at || article.created_at}>
                        {formatDate(article.published_at || article.created_at, "medium", lang)}
                      </time>
                      <ArrowUpRight size={20} aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            </Reveal>
          </section>
        )}

        {explainers.length > 0 && (
          <section className="field-section" aria-labelledby="curiosity-title">
            <Reveal variant="up">
              <div className="field-section-heading">
                <div>
                  <p className="field-eyebrow">{t("home.curiosity_eyebrow")}</p>
                  <h2 id="curiosity-title">{t("home.curiosity_title")}</h2>
                  <p>{t("home.curiosity_desc")}</p>
                </div>
                <Link href="/discover" className="field-text-link">
                  {t("home.follow_curiosity")} <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>

            <div className="field-reading-grid">
              {explainers.map((item, index) => {
                const localized = item as Discovery & { title_km?: string; intro_km?: string };
                const itemTitle = cleanText(isKm && localized.title_km ? localized.title_km : item.title);
                const itemIntro = cleanText(isKm && localized.intro_km ? localized.intro_km : item.intro);
                return (
                  <Reveal key={item.id} index={index} variant="up" className="min-w-0">
                    <Link className="field-reading-card group" href={`/discover/${item.slug}`}>
                      <Photo
                        src={item.hero_image_url}
                        alt={item.hero_image_alt || itemTitle}
                        ratio="3/2"
                        radius="xl"
                        credit={item.hero_image_credit}
                      />
                      <div className="field-reading-copy">
                        <p className="field-eyebrow">{item.category.replace(/_/g, " ")}</p>
                        <h3>{itemTitle}</h3>
                        <p>{itemIntro}</p>
                        <span>
                          {t("home.read_explainer")} <ArrowUpRight size={15} aria-hidden="true" />
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}

        <Reveal variant="zoom">
          <section className="field-planner-banner" aria-labelledby="planner-title">
            <div className="field-banner-icon">
              <Route size={42} strokeWidth={1.2} aria-hidden="true" />
            </div>
            <div>
              <p className="field-eyebrow">{t("home.planner_eyebrow")}</p>
              <h2 id="planner-title">{t("home.planner_title")}</h2>
              <p>{t("home.planner_desc")}</p>
            </div>
            <Link href="/travel/planner" className="field-button">
              {t("home.planner_button")} <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </section>
        </Reveal>

        <Reveal variant="up">
          <section className="field-values" aria-label="About this corner of the internet">
            <span className="field-values-mark">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <p>
              <strong>{t("home.values_title")}</strong> {t("home.values_desc")}
            </p>
            <Link href="/about" className="field-text-link">
              {t("home.meet_camtech")} <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </section>
        </Reveal>
      </Container>
    </div>
  );
}
