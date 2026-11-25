"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import {
  Briefcase,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileDown,
  FileUp,
  FolderKanban,
  Globe,
  GraduationCap,
  Languages,
  LayoutTemplate,
  Mail,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { buildCvPdfBlob } from "@/lib/cv-pdf";
import {
  clearCvDraftFromSession,
  readCvDraftFromSession,
  sanitizeCvDraft,
  writeCvDraftToSession,
} from "@/lib/cv-draft";
import { CvPrivacySessionNotice } from "./CvPrivacySessionNotice";
import {
  CV_TEMPLATES,
  cvDate,
  cvFileName,
  cvInitials,
  cvLanguageScore,
  cvListItems,
  cvParseLanguageItem,
  cvParseSkillItem,
  cvSplitDisplayName,
  cvTextLines,
  type CvLanguage,
  type CvSkillStyle,
  type CvTemplate,
  type CvText,
} from "@/lib/cv-templates";
import styles from "./CvBuilder.module.css";

type Entry = {
  id: string;
  title: CvText;
  organization: CvText;
  details: CvText;
  from: string;
  to: string;
  current: boolean;
};

type Project = { id: string; title: CvText; details: CvText };

type CvData = {
  name: CvText;
  role: CvText;
  location: CvText;
  email: string;
  phone: string;
  website: string;
  photo: string;
  summary: CvText;
  skills: CvText;
  languages: CvText;
  experience: Entry[];
  education: Entry[];
  projects: Project[];
};

type SectionKey = "contact" | "summary" | "experience" | "education" | "skills" | "languages" | "projects";

const VALID_TEMPLATE_IDS = new Set(CV_TEMPLATES.map((item) => item.id));

const pair = (): CvText => ({ en: "", km: "" });
const entry = (id: string): Entry => ({
  id,
  title: pair(),
  organization: pair(),
  details: pair(),
  from: "",
  to: "",
  current: false,
});
const emptyCv = (): CvData => ({
  name: pair(),
  role: pair(),
  location: pair(),
  email: "",
  phone: "",
  website: "",
  photo: "",
  summary: pair(),
  skills: pair(),
  languages: pair(),
  experience: [entry("experience-1")],
  education: [entry("education-1")],
  projects: [],
});
const hasData = (cv: CvData) => JSON.stringify(cv) !== JSON.stringify(emptyCv());

// Real studio portrait stored locally under public/images for photo-centric templates.
const samplePortrait = "/images/cv-sample-portrait.jpg";

// Balanced 1-page A4 example (~88–95% fill on 794x1123px) for gallery previews & optional loading.
const sampleCv: CvData = {
  ...emptyCv(),
  name: { en: "Dara Sok", km: "សុខ ដារ៉ា" },
  role: { en: "Senior Product Designer", km: "អ្នករចនាផលិតផលជាន់ខ្ពស់" },
  email: "dara.sok@example.com",
  phone: "+855 12 345 678",
  location: { en: "Phnom Penh, Cambodia", km: "ភ្នំពេញ កម្ពុជា" },
  website: "darasok.design",
  photo: samplePortrait,
  summary: {
    en: "Product designer with 6+ years crafting bilingual web and mobile payment tools for teams across Southeast Asia. Focused on clarity, accessibility, and measurable product growth.",
    km: "អ្នករចនាផលិតផលដែលមានបទពិសោធន៍ជាង ៦ ឆ្នាំ ក្នុងការបង្កើតកម្មវិធីទូទាត់ និងសេវាឌីជីថលសម្រាប់អាជីវកម្មនៅអាស៊ីអាគ្នេយ៍ ដោយផ្ដោតលើភាពងាយស្រួលប្រើប្រាស់។",
  },
  experience: [
    {
      ...entry("sample-lead"),
      from: "2022-03",
      current: true,
      title: { en: "Senior Product Designer", km: "អ្នករចនាផលិតផលជាន់ខ្ពស់" },
      organization: { en: "Mekong Pay Studio · Phnom Penh", km: "មេគង្គ ផេ ស្ទូឌីយោ · ភ្នំពេញ" },
      details: {
        en: "Led redesign of a merchant booking & KHQR checkout flow adopted by 420+ local shops.\nBuilt a bilingual Khmer–English design system that cut engineering handoff revisions by 35%.",
        km: "ដឹកនាំការរចនាឡើងវិញនូវប្រព័ន្ធកក់សេវា និងទូទាត់ KHQR ដែលមានហាងប្រើប្រាស់ជាង ៤២០ កន្លែង។\nបង្កើតប្រព័ន្ធរចនាពីរភាសា (ខ្មែរ-អង់គ្លេស) ជួយកាត់បន្ថយការកែសម្រួល UI បាន ៣៥%។",
      },
    },
    {
      ...entry("sample-designer"),
      from: "2020-01",
      to: "2022-02",
      title: { en: "UI/UX & Visual Designer", km: "អ្នករចនាក្រាហ្វិក និង UI/UX" },
      organization: { en: "Tonle Creative Agency", km: "ទីភ្នាក់ងារ ទន្លេ គ្រីអេធីវ" },
      details: {
        en: "Designed responsive web platforms and brand identities for 12 retail and hospitality clients.\nPartnered with frontend engineers to ship accessible React interfaces and print collateral.",
        km: "រចនាគេហទំព័រ និងអត្តសញ្ញាណម៉ាកសម្រាប់អតិថិជនលក់រាយ និងបដិសណ្ឋារកិច្ចចំនួន ១២។\nសហការជាមួយវិស្វករ frontend ដើម្បីអភិវឌ្ឍផ្ទាំងប្រើប្រាស់ដែលលឿន និងងាយស្រួល។",
      },
    },
  ],
  education: [
    {
      ...entry("sample-degree"),
      from: "2015-10",
      to: "2019-07",
      title: { en: "B.Sc. in Computer Science", km: "បរិញ្ញាបត្រ វិទ្យាសាស្ត្រកុំព្យូទ័រ" },
      organization: { en: "Royal University of Phnom Penh", km: "សាកលវិទ្យាល័យភូមិន្ទភ្នំពេញ" },
      details: {
        en: "GPA 3.82 / 4.00 · Thesis on Khmer web typography.",
        km: "ពិន្ទុមធ្យម ៣.៨២ / ៤.០០ · និក្ខេបបទស្ដីពីអក្សរខ្មែរលើគេហទំព័រ។",
      },
    },
    {
      ...entry("sample-cert"),
      from: "2020-06",
      to: "2021-01",
      title: { en: "UX Design Certificate", km: "វិញ្ញាបនបត្រ រចនា UX" },
      organization: { en: "Southeast Asia Design Lab", km: "សាលារចនាឌីជីថលអាស៊ី" },
    },
  ],
  skills: {
    en: "Product Design · 95%\nDesign Systems · 90%\nFigma & UI · 92%\nUser Research · 85%\nHTML & CSS · 80%\nTypography · 90%",
    km: "ការរចនាផលិតផល · 95%\nប្រព័ន្ធ UI · 90%\nFigma · 92%\nការស្រាវជ្រាវ · 85%\nHTML & CSS · 80%\nអក្សរខ្មែរឌីជីថល · 90%",
  },
  languages: {
    en: "Khmer · Native\nEnglish · Fluent\nFrench · Basic",
    km: "ខ្មែរ · ភាសាកំណើត\nអង់គ្លេស · ស្ទាត់ជំនាញ\nបារាំង · កម្រិតមូលដ្ឋាន",
  },
  projects: [
    {
      id: "sample-project",
      title: { en: "Kramuon Open UI Kit", km: "ឈុតគំរូ UI បើកចំហ ក្រមួន" },
      details: {
        en: "Open-source Figma & CSS starter tokens tuned for bilingual Khmer + Latin interfaces.",
        km: "គំរូរចនាបើកចំហសម្រាប់គេហទំព័រភាសាខ្មែរ និងអង់គ្លេសដែលងាយអានទាំងលើទូរស័ព្ទ និងកុំព្យូទ័រ។",
      },
    },
  ],
};

// Showcase our hero clones & new additions right at the top of the collection.
const galleryLeadIds = [
  "compass",
  "slate",
  "atlas",
  "summit",
  "horizon",
  "momentum",
  "beacon",
  "saffron",
  "marine",
  "apex",
  "harbor",
  "iris",
];
const galleryLead = galleryLeadIds.flatMap((id) => CV_TEMPLATES.filter((item) => item.id === id));
const galleryCollection = [
  ...galleryLead,
  ...CV_TEMPLATES.filter((item) => !galleryLeadIds.includes(item.id)),
];

const LEFT_RAIL_TEMPLATES = new Set([
  "canopy",
  "compass",
  "metro",
  "summit",
  "horizon",
  "beacon",
  "momentum",
  "focus",
  "pathway",
  "marine",
  "harbor",
  "iris",
]);
const TWO_COL_SPLIT_TEMPLATES = new Set(["north", "progress", "outline", "saffron", "apex"]);
const SPLIT_HEADER_TEMPLATES = new Set(["bridge", "progress", "studio"]);

function CvPair({
  value,
  language,
  twoTone = false,
}: {
  value: CvText;
  language: CvLanguage;
  twoTone?: boolean;
}) {
  return (
    <>
      {cvTextLines(value, language).map((line, index) => {
        if (twoTone) {
          const split = cvSplitDisplayName(line.text);
          if (split.tail) {
            return (
              <span
                key={line.language}
                lang={line.language}
                className={`${styles.textLine} ${index > 0 ? styles.secondary : ""}`}
              >
                <span className={styles.nameHead}>{split.head} </span>
                <span className={styles.nameTail}>{split.tail}</span>
              </span>
            );
          }
        }
        return (
          <span
            key={line.language}
            lang={line.language}
            className={`${styles.textLine} ${index > 0 ? styles.secondary : ""}`}
          >
            {line.text}
          </span>
        );
      })}
    </>
  );
}

function SectionBadgeIcon({ sectionKey }: { sectionKey: SectionKey }) {
  switch (sectionKey) {
    case "contact":
      return <Mail size={10} strokeWidth={2.1} aria-hidden="true" />;
    case "summary":
      return <User size={10} strokeWidth={2.1} aria-hidden="true" />;
    case "experience":
      return <Briefcase size={10} strokeWidth={2.1} aria-hidden="true" />;
    case "education":
      return <GraduationCap size={10} strokeWidth={2.1} aria-hidden="true" />;
    case "skills":
      return <Wrench size={10} strokeWidth={2.1} aria-hidden="true" />;
    case "languages":
      return <Languages size={10} strokeWidth={2.1} aria-hidden="true" />;
    case "projects":
      return <FolderKanban size={10} strokeWidth={2.1} aria-hidden="true" />;
  }
}

function CvHeading({
  en,
  km,
  language,
  sectionKey,
  showBadge,
}: {
  en: string;
  km: string;
  language: CvLanguage;
  sectionKey: SectionKey;
  showBadge: boolean;
}) {
  return (
    <h3 className={styles.sectionTitle}>
      {showBadge && (
        <span className={styles.sectionIconBadge}>
          <SectionBadgeIcon sectionKey={sectionKey} />
        </span>
      )}
      <span className={styles.sectionLabel}>
        {language !== "km" && <span lang="en">{en}</span>}
        {language === "bilingual" && (
          <span className={styles.headingSep} aria-hidden="true">
            {" "}
            /{" "}
          </span>
        )}
        {language !== "en" && <span lang="km">{km}</span>}
      </span>
      {showBadge && <span className={styles.sectionRule} aria-hidden="true" />}
    </h3>
  );
}

function CvLines({ value, language }: { value: CvText; language: CvLanguage }) {
  const lines = cvTextLines(value, language);
  return (
    <>
      {lines.map((line) => {
        const bullets = cvListItems(line.text);
        if (!bullets.length) return null;
        return (
          <ul key={line.language} lang={line.language} className={styles.bullets}>
            {bullets.map((text, i) => (
              <li key={i}>{text}</li>
            ))}
          </ul>
        );
      })}
    </>
  );
}

function RatingDots({ score }: { score: number }) {
  const filled = Math.max(1, Math.min(5, Math.round(score / 20)));
  return (
    <span className={styles.dotTrack} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((step) => (
        <span key={step} className={`${styles.dotItem} ${step <= filled ? styles.dotFilled : ""}`} />
      ))}
    </span>
  );
}

function RingGauge({ score }: { score: number }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <svg className={styles.ringSvg} viewBox="0 0 36 36" aria-hidden="true">
      <circle className={styles.ringTrack} cx="18" cy="18" r={r} />
      <circle
        className={styles.ringFill}
        cx="18"
        cy="18"
        r={r}
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 18 18)"
      />
      <text x="18" y="21.5" textAnchor="middle" className={styles.ringText}>
        {score}%
      </text>
    </svg>
  );
}

function CvSkills({
  value,
  language,
  skillStyle = "tags",
}: {
  value: CvText;
  language: CvLanguage;
  skillStyle?: CvSkillStyle;
}) {
  const lines = cvTextLines(value, language);
  return (
    <div className={styles.skillGroups}>
      {lines.map((line) => {
        const items = cvListItems(line.text).map(cvParseSkillItem);
        if (!items.length) return null;
        if (skillStyle === "inline") {
          return (
            <ul key={line.language} lang={line.language} className={styles.skillInlineList}>
              {items.map((item, i) => (
                <li key={i} className={styles.skillInlineItem}>
                  {item.label}
                </li>
              ))}
            </ul>
          );
        }
        const hasScored = skillStyle !== "tags" && items.some((item) => item.score !== null);
        if (!hasScored) {
          return (
            <ul key={line.language} lang={line.language} className={styles.skillList}>
              {items.map((item, i) => (
                <li key={i} className={styles.skillTag}>
                  {item.label}
                  {item.score !== null ? ` · ${item.score}%` : ""}
                </li>
              ))}
            </ul>
          );
        }
        if (skillStyle === "bars") {
          return (
            <ul key={line.language} lang={line.language} className={styles.skillBarRowList}>
              {items.map((item, i) => (
                <li key={i} className={styles.skillBarRow}>
                  <span className={styles.skillBarLabel}>{item.label}</span>
                  {item.score !== null && (
                    <div className={styles.meterTrack} aria-hidden="true">
                      <div className={styles.meterFill} style={{ width: `${item.score}%` }} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <ul key={line.language} lang={line.language} className={styles.skillMeterList}>
            {items.map((item, i) => (
              <li key={i} className={styles.skillMeterItem}>
                <div className={styles.skillMeterHead}>
                  <span className={styles.skillMeterLabel}>{item.label}</span>
                  {item.score !== null && <RatingDots score={item.score} />}
                </div>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

function CvLanguages({
  value,
  language,
  skillStyle = "tags",
  ringLanguages = false,
}: {
  value: CvText;
  language: CvLanguage;
  skillStyle?: CvSkillStyle;
  ringLanguages?: boolean;
}) {
  const lines = cvTextLines(value, language);
  return (
    <div className={styles.langGroups}>
      {lines.map((line) => {
        const items = cvListItems(line.text);
        if (!items.length) return null;
        const parsed = items.map((text) => {
          const item = cvParseLanguageItem(text);
          return { ...item, score: cvLanguageScore(item.level) };
        });
        if (ringLanguages && parsed.some((item) => item.score !== null)) {
          return (
            <ul key={line.language} lang={line.language} className={styles.langRingList}>
              {parsed.map((item, i) => (
                <li key={i} className={styles.langRingItem}>
                  {item.score !== null && <RingGauge score={item.score} />}
                  <span className={styles.langRingLabel}>{item.label}</span>
                  {item.level && <span className={styles.langRingLevel}>{item.level}</span>}
                </li>
              ))}
            </ul>
          );
        }
        if (skillStyle === "inline" || skillStyle === "bars") {
          return (
            <ul key={line.language} lang={line.language} className={styles.langCompactList}>
              {parsed.map((item, i) => (
                <li key={i} className={styles.langCompactItem}>
                  <span className={styles.langCompactDot} aria-hidden="true" />
                  <span className={styles.langName}>{item.label}</span>
                  {item.level && <span className={styles.langCompactSep}>· {item.level}</span>}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <ul key={line.language} lang={line.language} className={styles.langList}>
            {parsed.map((item, i) => (
              <li key={i} className={styles.langItem}>
                <div className={styles.langTop}>
                  <span className={styles.langName}>{item.label}</span>
                  <span className={styles.langRight}>
                    {item.level && <span className={styles.langLevel}>{item.level}</span>}
                    {item.score !== null && skillStyle === "dots" && <RatingDots score={item.score} />}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

type ContactItem = { kind: "email" | "phone" | "location" | "website"; text: string };

function ContactIcon({ kind }: { kind: ContactItem["kind"] }) {
  switch (kind) {
    case "email":
      return <Mail size={10} strokeWidth={1.9} aria-hidden="true" />;
    case "phone":
      return <Phone size={10} strokeWidth={1.9} aria-hidden="true" />;
    case "location":
      return <MapPin size={10} strokeWidth={1.9} aria-hidden="true" />;
    case "website":
      return <Globe size={10} strokeWidth={1.9} aria-hidden="true" />;
  }
}

function CvPreview({ data, template, language }: { data: CvData; template: CvTemplate; language: CvLanguage }) {
  const hasName = cvTextLines(data.name, language).length > 0;
  const hasRole = cvTextLines(data.role, language).length > 0;
  const showBadges = template.heading === "badge" || template.heading === "pillOutline";
  const initials = !data.photo && template.monogram ? cvInitials(data.name) : "";
  const contactItems: ContactItem[] = [
    ...(data.email.trim() ? [{ kind: "email" as const, text: data.email.trim() }] : []),
    ...(data.phone.trim() ? [{ kind: "phone" as const, text: data.phone.trim() }] : []),
    ...cvTextLines(data.location, language).map((line) => ({ kind: "location" as const, text: line.text })),
    ...(data.website.trim() ? [{ kind: "website" as const, text: data.website.trim() }] : []),
  ];

  const renderSection = (sectionKey: SectionKey, en: string, km: string, body: React.ReactNode) => (
    <section className={styles.cvSection} data-section={sectionKey}>
      <CvHeading en={en} km={km} language={language} sectionKey={sectionKey} showBadge={showBadges} />
      <div className={styles.sectionBodyContent}>{body}</div>
    </section>
  );

  const renderEntries = (sectionKey: "experience" | "education", items: Entry[], en: string, km: string) => {
    const visible = items.filter((item) =>
      [item.title, item.organization, item.details].some((text) => cvTextLines(text, language).length),
    );
    if (!visible.length) return null;
    return renderSection(
      sectionKey,
      en,
      km,
      visible.map((item) => {
        const hasOrg = cvTextLines(item.organization, language).length > 0;
        const dateLabel =
          item.from || item.to || item.current
            ? `${cvDate(item.from)}${item.from && (item.to || item.current) ? " — " : ""}${
                item.current
                  ? language === "km"
                    ? "បច្ចុប្បន្ន"
                    : language === "bilingual"
                      ? "Present / បច្ចុប្បន្ន"
                      : "Present"
                  : cvDate(item.to)
              }`
            : "";
        return (
          <div key={item.id} className={styles.cvEntry}>
            <div className={styles.entryHead}>
              <div className={styles.entryIdentity}>
                {cvTextLines(item.title, language).length > 0 && (
                  <h4>
                    <CvPair value={item.title} language={language} />
                  </h4>
                )}
                {hasOrg && (
                  <div className={styles.organization}>
                    <CvPair value={item.organization} language={language} />
                  </div>
                )}
              </div>
              {dateLabel && <span className={styles.cvDate}>{dateLabel}</span>}
            </div>
            <CvLines value={item.details} language={language} />
          </div>
        );
      }),
    );
  };

  const summaryBlock =
    cvTextLines(data.summary, language).length > 0
      ? renderSection(
          "summary",
          "Profile",
          "សេចក្ដីសង្ខេប",
          <div className={styles.summaryText}>
            <CvPair value={data.summary} language={language} />
          </div>,
        )
      : null;

  const education = renderEntries("education", data.education, "Education", "ការអប់រំ");
  const experience = renderEntries("experience", data.experience, "Experience", "បទពិសោធន៍ការងារ");
  const projects = data.projects.filter(
    (item) => cvTextLines(item.title, language).length || cvTextLines(item.details, language).length,
  );
  const projectsBlock =
    projects.length > 0
      ? renderSection(
          "projects",
          "Projects",
          "គម្រោង",
          projects.map((item) => (
            <div className={styles.cvEntry} key={item.id}>
              <div className={styles.entryHead}>
                <div className={styles.entryIdentity}>
                  <h4>
                    <CvPair value={item.title} language={language} />
                  </h4>
                </div>
              </div>
              <CvLines value={item.details} language={language} />
            </div>
          )),
        )
      : null;

  const skillsBlock =
    cvTextLines(data.skills, language).length > 0
      ? renderSection(
          "skills",
          template.id === "ledger" ? "Core competencies" : "Skills",
          "ជំនាញ",
          <CvSkills value={data.skills} language={language} skillStyle={template.skillStyle} />,
        )
      : null;

  const languagesBlock =
    cvTextLines(data.languages, language).length > 0
      ? renderSection(
          "languages",
          "Languages",
          "ភាសា",
          <CvLanguages
            value={data.languages}
            language={language}
            skillStyle={template.skillStyle}
            ringLanguages={template.ringLanguages}
          />,
        )
      : null;

  const contactList = contactItems.length > 0 && (
    <div className={styles.contact}>
      {contactItems.map((item, i) => (
        <span key={`${item.kind}-${i}`} className={styles.contactItem}>
          <span className={styles.contactIcon}>
            <ContactIcon kind={item.kind} />
          </span>
          <span>{item.text}</span>
        </span>
      ))}
    </div>
  );

  const identityBlock = (
    <div className={styles.identity}>
      {template.id === "essential" && hasName && language !== "km" && (
        <span className={styles.eyebrowIntro}>HELLO, I&apos;M</span>
      )}
      <h2 className={styles.name}>
        {hasName ? (
          <CvPair value={data.name} language={language} twoTone={template.twoToneName} />
        ) : (
          <span className={styles.placeholder}>{language === "km" ? "ឈ្មោះរបស់អ្នក" : "Your name"}</span>
        )}
      </h2>
      {hasRole && (
        <div className={styles.role}>
          <CvPair value={data.role} language={language} />
        </div>
      )}
    </div>
  );

  const portrait = data.photo ? (
    // Local file or browser-tab data URL keeps portraits private to this site.
    // eslint-disable-next-line @next/next/no-img-element
    <img className={styles.portrait} src={data.photo} alt="" />
  ) : initials ? (
    <span className={styles.monogramBadge} aria-hidden="true">
      {initials}
    </span>
  ) : null;

  const isLeftRailLayout = LEFT_RAIL_TEMPLATES.has(template.id);
  const isNoelArchRight = template.id === "slate";
  const isOrangeStripeRight = template.id === "atlas";
  const isTwoColSplit = TWO_COL_SPLIT_TEMPLATES.has(template.id);
  const isSplitHeader = SPLIT_HEADER_TEMPLATES.has(template.id);
  const isRightRailSummary = template.id === "balance";

  const rootClasses = [
    styles.paper,
    styles[template.layout],
    styles[template.heading],
    template.serif ? styles.serif : "",
    template.compact ? styles.compact : "",
    isLeftRailLayout ? styles.sidebarRailLayout : "",
    isSplitHeader ? styles.splitHeader : "",
  ]
    .filter(Boolean)
    .join(" ");

  // 1. Left-Rail Clones: Compass (Image 1), Summit (Image 4), Horizon, Momentum, Canopy, Metro, Beacon, Focus, Pathway, Marine, Harbor, Iris
  if (isLeftRailLayout) {
    const railHasSkills =
      template.id === "canopy" ||
      template.id === "metro" ||
      template.id === "momentum" ||
      template.id === "pathway" ||
      template.id === "focus" ||
      template.id === "iris";
    return (
      <article
        data-cv-document
        data-template={template.id}
        className={rootClasses}
        style={{ "--cv-accent": template.accent } as CSSProperties}
        lang={language === "km" ? "km" : "en"}
      >
        <aside className={styles.sideContent}>
          {portrait && <div className={styles.portraitWrap}>{portrait}</div>}
          {contactItems.length > 0 && renderSection("contact", "Contact", "ទំនាក់ទំនង", contactList)}
          {railHasSkills ? (
            <>
              {skillsBlock}
              {languagesBlock}
              {education}
            </>
          ) : (
            <>
              {projectsBlock}
              {education}
            </>
          )}
        </aside>
        <div className={styles.mainContent}>
          <header className={styles.cvHeader}>{identityBlock}</header>
          {summaryBlock}
          {experience}
          {!railHasSkills && (
            <>
              {skillsBlock}
              {languagesBlock}
            </>
          )}
          {railHasSkills && projectsBlock}
        </div>
      </article>
    );
  }

  // 2. Noel Taylor Clone (Image 2): Outer Charcoal Frame + White Arch Portrait + Orange Dome Education/Projects
  if (isNoelArchRight) {
    return (
      <article
        data-cv-document
        data-template={template.id}
        className={rootClasses}
        style={{ "--cv-accent": template.accent } as CSSProperties}
        lang={language === "km" ? "km" : "en"}
      >
        <div className={styles.mainContent}>
          {summaryBlock}
          {experience}
          {skillsBlock}
          {languagesBlock}
        </div>
        <aside className={styles.sideContent}>
          <header className={styles.cvHeader}>{identityBlock}</header>
          <div className={styles.noelDarkArch}>
            {portrait && <div className={styles.portraitWrap}>{portrait}</div>}
            {contactItems.length > 0 && renderSection("contact", "Contact", "ទំនាក់ទំនង", contactList)}
            <div className={styles.noelAccentDome}>
              {education}
              {projectsBlock}
            </div>
          </div>
        </aside>
      </article>
    );
  }

  // 3. Orange Stripe + Right Charcoal Rail Clone (Image 3): Full-Width Orange Profile Band + Top-Right Framed Square Portrait
  if (isOrangeStripeRight) {
    return (
      <article
        data-cv-document
        data-template={template.id}
        className={rootClasses}
        style={{ "--cv-accent": template.accent } as CSSProperties}
        lang={language === "km" ? "km" : "en"}
      >
        <div className={styles.mainContent}>
          <header className={styles.cvHeader}>{identityBlock}</header>
          {summaryBlock && <div className={styles.atlasBand}>{summaryBlock}</div>}
          <div className={styles.atlasMainBody}>
            {experience}
            {skillsBlock}
            {languagesBlock}
          </div>
        </div>
        <aside className={styles.sideContent}>
          {portrait && <div className={styles.portraitWrap}>{portrait}</div>}
          {contactItems.length > 0 && renderSection("contact", "Contact", "ទំនាក់ទំនង", contactList)}
          {education}
          {projectsBlock}
        </aside>
      </article>
    );
  }

  // 4. Asymmetric 2-Column Split Layouts (North, Progress, Outline, Saffron, Apex)
  if (isTwoColSplit) {
    return (
      <article
        data-cv-document
        data-template={template.id}
        className={rootClasses}
        style={{ "--cv-accent": template.accent } as CSSProperties}
        lang={language === "km" ? "km" : "en"}
      >
        <header className={`${styles.cvHeader} ${portrait ? styles.withPhoto : ""}`}>
          {portrait}
          <div className={styles.headerBody}>
            {identityBlock}
            {contactList}
          </div>
        </header>
        {template.id === "progress" ? summaryBlock : null}
        <div className={styles.twoColGrid}>
          {template.id === "outline" || template.id === "saffron" ? (
            <>
              <aside className={styles.twoColRail}>
                {template.id === "saffron" ? summaryBlock : null}
                {education}
                {skillsBlock}
                {languagesBlock}
                {template.id === "outline" ? projectsBlock : null}
              </aside>
              <div className={styles.twoColMain}>
                {template.id === "outline" ? summaryBlock : null}
                {experience}
                {template.id === "saffron" ? projectsBlock : null}
              </div>
            </>
          ) : (
            <>
              <div className={styles.twoColMain}>
                {template.id === "north" ? (
                  <>
                    {education}
                    {experience}
                  </>
                ) : (
                  <>
                    {template.id === "apex" ? summaryBlock : null}
                    {experience}
                  </>
                )}
                {projectsBlock}
              </div>
              <aside className={styles.twoColRail}>
                {template.id === "north" && summaryBlock}
                {(template.id === "progress" || template.id === "apex") && education}
                {skillsBlock}
                {languagesBlock}
              </aside>
            </>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      data-cv-document
      data-template={template.id}
      className={rootClasses}
      style={{ "--cv-accent": template.accent } as CSSProperties}
      lang={language === "km" ? "km" : "en"}
    >
      <header className={`${styles.cvHeader} ${portrait ? styles.withPhoto : ""}`}>
        {portrait}
        <div className={styles.headerBody}>
          {identityBlock}
          {contactList}
        </div>
      </header>
      <div className={styles.cvBody}>
        <div className={styles.mainContent}>
          {!isRightRailSummary && summaryBlock}
          {template.id === "ledger" && skillsBlock}
          {template.educationFirst ? (
            <>
              {education}
              {experience}
            </>
          ) : (
            <>
              {experience}
              {education}
            </>
          )}
          {projectsBlock}
        </div>
        <aside className={styles.sideContent}>
          {isRightRailSummary && summaryBlock}
          {template.id !== "ledger" && skillsBlock}
          {languagesBlock}
        </aside>
      </div>
    </article>
  );
}

function MiniTemplate({ template }: { template: CvTemplate }) {
  const { lang } = useI18n();
  const previewData = template.samplePhoto ? sampleCv : { ...sampleCv, photo: "" };
  return (
    <div aria-hidden="true" className={styles.templateSheet} inert>
      <CvPreview data={previewData} template={template} language={lang === "km" ? "km" : "en"} />
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
  maxLength = 160,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <label htmlFor={id} className={styles.field}>
      <span>{label}</span>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete="off"
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete="off"
        />
      )}
    </label>
  );
}

function PairField({
  id,
  label,
  value,
  onChange,
  multiline = false,
  maxLength = 160,
}: {
  id: string;
  label: string;
  value: CvText;
  onChange: (value: CvText) => void;
  multiline?: boolean;
  maxLength?: number;
}) {
  return (
    <div className={styles.pair}>
      <Field
        id={`${id}-en`}
        label={`${label} · English`}
        value={value.en}
        onChange={(en) => onChange({ ...value, en })}
        multiline={multiline}
        maxLength={maxLength}
      />
      <Field
        id={`${id}-km`}
        label={`${label} · ខ្មែរ`}
        value={value.km}
        onChange={(km) => onChange({ ...value, km })}
        multiline={multiline}
        maxLength={maxLength}
      />
    </div>
  );
}

type TelegramExportState = {
  token: string;
  telegramUrl: string;
  botUsername: string;
  status: "pending" | "delivered" | "expired";
  expiresAtMs: number;
  qrDataUrl: string;
  fileName: string;
};

export function CvBuilder() {
  const { lang } = useI18n();
  const t = (en: string, km: string) => (lang === "km" ? km : en);
  const [data, setData] = useState<CvData>(emptyCv);
  const [templateId, setTemplateId] = useState(CV_TEMPLATES[0].id);
  const [language, setLanguage] = useState<CvLanguage>("bilingual");
  const [printing, setPrinting] = useState(false);
  const [telegramBusy, setTelegramBusy] = useState(false);
  const [telegramExport, setTelegramExport] = useState<TelegramExportState | null>(null);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [telegramNowMs, setTelegramNowMs] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [templateFilter, setTemplateFilter] = useState("all");
  const [paperHeight, setPaperHeight] = useState(1123);
  const [previewScale, setPreviewScale] = useState(0.74);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [desktopEditorOpen, setDesktopEditorOpen] = useState(true);

  const cvSessionId = useRef("");
  const draftHydrated = useRef(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);
  const previewViewport = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLDialogElement>(null);
  const telegramModal = useRef<HTMLDialogElement>(null);
  const templateGrid = useRef<HTMLDivElement>(null);
  const printFrame = useRef<HTMLIFrameElement | null>(null);
  const printTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getTabSessionId = useCallback(() => {
    if (!cvSessionId.current) {
      cvSessionId.current = crypto.randomUUID();
    }
    return cvSessionId.current;
  }, []);

  const template = CV_TEMPLATES.find((item) => item.id === templateId) || CV_TEMPLATES[0];
  const dirty = hasData(data);
  const invalidDates = [...data.experience, ...data.education].some(
    (item) => !item.current && item.from && item.to && item.to < item.from,
  );
  const canExport = cvTextLines(data.name, language).length > 0 && !invalidDates;
  const pageCount = Math.max(1, Math.ceil((paperHeight - 12) / 1123));

  const syncGalleryScale = useCallback(() => {
    const grid = templateGrid.current;
    if (!grid) return;
    const sheet = grid.querySelector<HTMLElement>(`.${styles.templateSheet}`);
    if (!sheet) return;
    const width = sheet.getBoundingClientRect().width;
    if (width > 0) {
      grid.style.setProperty("--cv-thumb-scale", String(width / 794));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      draftHydrated.current = true;
      const restored = readCvDraftFromSession(undefined, VALID_TEMPLATE_IDS);
      if (restored && hasData(restored.data)) {
        setData(restored.data);
        setTemplateId(restored.templateId);
        setLanguage(restored.language);
        setMessage(
          lang === "km"
            ? "បានស្ដារទិន្នន័យ CV ពី session នេះ។"
            : "Restored your unsaved draft from this tab session.",
        );
      }
    }, 0);
    return () => window.clearTimeout(timer);
    // Run once on client mount to restore ephemeral tab session state without SSR hydration mismatch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftHydrated.current) return;
    if (dirty) {
      writeCvDraftToSession({ version: 1, templateId, language, data });
    } else {
      clearCvDraftFromSession();
    }
  }, [data, templateId, language, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(
    () => () => {
      printFrame.current?.remove();
      if (printTimer.current) clearTimeout(printTimer.current);
    },
    [],
  );

  // Close the mobile editor drawer on Escape or viewport resize and lock background scroll while open.
  useEffect(() => {
    if (!mobileEditorOpen) {
      document.body.style.overflow = "";
      return;
    }
    const media = window.matchMedia("(max-width: 1100px)");
    const syncBodyScroll = () => {
      if (!media.matches) {
        document.body.style.overflow = "";
        setMobileEditorOpen(false);
      } else {
        document.body.style.overflow = "hidden";
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileEditorOpen(false);
      }
    };
    syncBodyScroll();
    media.addEventListener("change", syncBodyScroll);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      media.removeEventListener("change", syncBodyScroll);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileEditorOpen]);

  // Measure the live preview container and A4 paper so the preview always stays proportional.
  useEffect(() => {
    const viewport = previewViewport.current;
    const paperHost = preview.current;
    if (!viewport || !paperHost) return;
    const measure = () => {
      const available = viewport.clientWidth;
      if (available > 0) {
        setPreviewScale(Math.min(1, available / 794));
      }
      const article = paperHost.firstElementChild as HTMLElement | null;
      if (article) {
        setPaperHeight(Math.max(1123, article.offsetHeight));
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    if (paperHost.firstElementChild) observer.observe(paperHost.firstElementChild);
    return () => observer.disconnect();
  }, [data, templateId, language, desktopEditorOpen]);

  useEffect(() => {
    const grid = templateGrid.current;
    if (!grid) return;
    syncGalleryScale();
    const observer = new ResizeObserver(syncGalleryScale);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [syncGalleryScale, templateFilter]);

  // Poll ephemeral cache delivery status while the Telegram / QR dialog stays open.
  useEffect(() => {
    if (!telegramModalOpen || !telegramExport || telegramExport.status !== "pending") return;
    const token = telegramExport.token;
    const controller = new AbortController();

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/cv-telegram/sessions/${encodeURIComponent(token)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = (await res.json()) as { status?: "pending" | "delivered" | "expired" };
        if (json.status === "delivered" || json.status === "expired") {
          const nextStatus = json.status;
          setTelegramExport((prev) => (prev && prev.token === token ? { ...prev, status: nextStatus } : prev));
        }
      } catch {
        // Ignore transient poll errors or abort
      }
    };

    const statusTimer = window.setInterval(checkStatus, 2000);
    const countdownTimer = window.setInterval(() => setTelegramNowMs(Date.now()), 1000);
    void checkStatus();

    return () => {
      controller.abort();
      window.clearInterval(statusTimer);
      window.clearInterval(countdownTimer);
    };
  }, [telegramModalOpen, telegramExport]);

  function update(key: "name" | "role" | "location" | "summary" | "skills" | "languages", value: CvText) {
    setData((current) => ({ ...current, [key]: value }));
  }

  function updateEntry(section: "experience" | "education", id: string, changes: Partial<Entry>) {
    setData((current) => ({
      ...current,
      [section]: current[section].map((item) => (item.id === id ? { ...item, ...changes } : item)),
    }));
  }

  function loadExample() {
    if (
      !dirty ||
      window.confirm(
        t(
          "Replace your current draft with the example CV?",
          "ជំនួសសេចក្ដីព្រាងបច្ចុប្បន្នដោយទិន្នន័យគំរូ CV មែនទេ?",
        ),
      )
    ) {
      setData(sampleCv);
      setMessage(
        t(
          "Example CV loaded into this tab. Edit any field or switch templates to compare.",
          "បានបញ្ចូលគំរូ CV ក្នុងទំព័រនេះ។ អ្នកអាចកែអត្ថបទ ឬប្ដូរគំរូមើលបានភ្លាមៗ។",
        ),
      );
      setError(false);
      if (photoInput.current) photoInput.current.value = "";
    }
  }

  function reset() {
    if (
      !dirty ||
      window.confirm(
        t(
          "Clear this temporary CV? Download a PDF first if you want to keep it.",
          "លុប CV បណ្ដោះអាសន្ននេះ? សូមរក្សាទុក PDF ជាមុន បើអ្នកចង់រក្សាវាទុក។",
        ),
      )
    ) {
      if (telegramExport?.token) {
        void fetch(`/api/cv-telegram/sessions/${encodeURIComponent(telegramExport.token)}`, { method: "DELETE" }).catch(() => {});
      }
      cvSessionId.current = crypto.randomUUID();
      clearCvDraftFromSession();
      setTelegramExport(null);
      setData(emptyCv());
      setMessage("");
      setError(false);
      if (photoInput.current) photoInput.current.value = "";
      if (jsonInput.current) jsonInput.current.value = "";
    }
  }

  function exportJsonBackup() {
    const payload = JSON.stringify(
      { version: 1, templateId, language, data },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${cvFileName(data.name.en || data.name.km).replace(/\.pdf$/i, "")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setError(false);
    setMessage(
      t(
        "Saved JSON backup locally. You can import this file anytime to resume editing.",
        "បានទាញយកឯកសារបម្រុង JSON។ អ្នកអាចនាំចូលវិញនៅពេលក្រោយដើម្បីកែបន្ត។",
      ),
    );
  }

  async function importJsonBackup(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError(true);
      setMessage(t("JSON backup file must be under 2 MB.", "ឯកសារ JSON មិនត្រូវលើស 2 MB ឡើយ។"));
      if (jsonInput.current) jsonInput.current.value = "";
      return;
    }
    try {
      const text = await file.text();
      const parsed = sanitizeCvDraft(JSON.parse(text), templateId, VALID_TEMPLATE_IDS);
      if (!parsed) {
        throw new Error("Invalid CV backup structure");
      }
      setData(parsed.data);
      setTemplateId(parsed.templateId);
      setLanguage(parsed.language);
      setError(false);
      setMessage(
        t(
          "Imported CV backup into this tab session.",
          "បាននាំចូលទិន្នន័យ CV ពីឯកសារ JSON រួចរាល់។",
        ),
      );
    } catch {
      setError(true);
      setMessage(
        t(
          "Could not read that CV JSON file. Select a backup exported from this builder.",
          "មិនអាចអានឯកសារ JSON នេះបានទេ។ សូមជ្រើសរើសឯកសារដែលបានរក្សាទុកពីកម្មវិធីនេះ។",
        ),
      );
    } finally {
      if (jsonInput.current) jsonInput.current.value = "";
    }
  }

  async function choosePhoto(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3 * 1024 * 1024) {
      setError(true);
      setMessage(t("Choose a JPG, PNG or WebP image up to 3 MB.", "សូមជ្រើសរើសរូប JPG, PNG ឬ WebP មិនលើស 3 MB។"));
      if (photoInput.current) photoInput.current.value = "";
      return;
    }
    try {
      const photo = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const image = new Image();
      image.src = photo;
      await image.decode();
      setData((current) => ({ ...current, photo }));
      setError(false);
      setMessage("");
    } catch {
      setError(true);
      setMessage(
        t("This image could not be opened. Choose another image.", "មិនអាចបើករូបនេះបានទេ។ សូមជ្រើសរើសរូបផ្សេង។"),
      );
    }
  }

  async function savePdf() {
    if (!canExport || printing || !preview.current?.firstElementChild) return;
    setPrinting(true);
    setMessage("");
    setError(false);
    const frame = document.createElement("iframe");
    frame.title = "CV print document";
    frame.setAttribute("aria-hidden", "true");
    Object.assign(frame.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "210mm",
      height: "297mm",
      border: "0",
    });
    document.body.appendChild(frame);
    printFrame.current = frame;
    const cleanup = () => {
      frame.remove();
      if (printFrame.current === frame) printFrame.current = null;
      if (printTimer.current) {
        clearTimeout(printTimer.current);
        printTimer.current = null;
      }
    };
    try {
      const doc = frame.contentDocument;
      const win = frame.contentWindow;
      if (!doc || !win) throw new Error("Print window unavailable");
      doc.open();
      doc.write(`<!doctype html><html><head><meta charset='utf-8'><base href='${window.location.origin}/'></head><body></body></html>`);
      doc.close();
      doc.documentElement.className = document.documentElement.className.replace(/\bdark\b/g, "") + " light";
      doc.documentElement.lang = language === "km" ? "km" : "en";
      doc.title = cvFileName(data.name.en || data.name.km);
      const loads: Promise<void>[] = [];
      for (const source of document.querySelectorAll('link[rel="stylesheet"], style')) {
        const clone = doc.importNode(source, true);
        if (clone.nodeName === "LINK") {
          loads.push(
            new Promise((resolve, reject) => {
              (clone as HTMLLinkElement).onload = () => resolve();
              (clone as HTMLLinkElement).onerror = () => reject(new Error("Print styles unavailable"));
            }),
          );
        }
        doc.head.appendChild(clone);
      }
      const printStyle = doc.createElement("style");
      printStyle.textContent =
        "@page{size:A4;margin:11mm 12mm}html,body{margin:0;padding:0;background:white!important;color:#1d242b!important}body{display:block!important}*{animation:none!important;transition:none!important}article{box-shadow:none!important}h2,h3,h4{break-after:avoid}p,li,.cvEntry{break-inside:avoid;orphans:3;widows:3}";
      doc.head.appendChild(printStyle);
      doc.body.appendChild(doc.importNode(preview.current.firstElementChild, true));
      await Promise.race([
        Promise.all(loads),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Print styles timed out")), 15000)),
      ]);
      // Font readiness matters for Khmer shaping and selectable PDF text.
      void doc.body.offsetHeight;
      await Promise.race([
        doc.fonts.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Print fonts timed out")), 15000)),
      ]);
      await Promise.race([
        Promise.all(Array.from(doc.images, (image) => image.decode())),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Print image timed out")), 15000)),
      ]);
      win.addEventListener("afterprint", cleanup, { once: true });
      printTimer.current = setTimeout(cleanup, 120000);
      win.focus();
      win.print();
      setMessage(
        t(
          "Choose “Save as PDF” in the print dialog. Use A4 paper and turn off browser headers and footers. Your CV has not been uploaded.",
          "ជ្រើសរើស “Save as PDF” ក្នុងផ្ទាំងបោះពុម្ព។ ប្រើក្រដាស A4 ហើយបិទ headers និង footers របស់ browser។ CV របស់អ្នកមិនត្រូវបានផ្ញើទៅ server ទេ។",
        ),
      );
    } catch {
      cleanup();
      setError(true);
      setMessage(
        t(
          "Could not open the print preview. Try again in an up-to-date browser. Your information is still in this tab.",
          "មិនអាចបើកផ្ទាំងបោះពុម្ពបានទេ។ សូមសាកល្បងម្ដងទៀតក្នុង browser ដែលបានធ្វើបច្ចុប្បន្នភាព។ ព័ត៌មានរបស់អ្នកនៅតែក្នុងទំព័រនេះ។",
        ),
      );
    } finally {
      setPrinting(false);
    }
  }

  async function sendToTelegram() {
    if (!canExport || telegramBusy || !preview.current?.firstElementChild) return;
    setTelegramBusy(true);
    setError(false);
    setMessage("");
    try {
      const articleNode = preview.current.firstElementChild as HTMLElement;
      const pdfBlob = await buildCvPdfBlob(articleNode);
      const fileName = `${cvFileName(data.name.en || data.name.km)}.pdf`;
      const formData = new FormData();
      formData.set("session_id", getTabSessionId());
      formData.set("file_name", fileName);
      formData.set("template_name", template.name);
      formData.set("language", language === "bilingual" ? "EN + KM" : language.toUpperCase());
      formData.set("pdf", pdfBlob, fileName);

      const response = await fetch("/api/cv-telegram/sessions", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json()) as {
        token?: string;
        telegramUrl?: string;
        botUsername?: string;
        expiresInSeconds?: number;
        status?: "pending" | "delivered" | "expired";
        error?: string;
      };

      if (!response.ok || !json.token || !json.telegramUrl || !json.botUsername) {
        throw new Error(json.error || "Telegram session creation failed");
      }

      const qrDataUrl = await QRCode.toDataURL(json.telegramUrl, {
        width: 220,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      });

      const now = Date.now();
      const ttlMs = (json.expiresInSeconds || 900) * 1000;
      setTelegramNowMs(now);
      setTelegramExport({
        token: json.token,
        telegramUrl: json.telegramUrl,
        botUsername: json.botUsername,
        status: json.status || "pending",
        expiresAtMs: now + ttlMs,
        qrDataUrl,
        fileName,
      });

      if (!telegramModal.current?.open) {
        telegramModal.current?.showModal();
      }
      setTelegramModalOpen(true);
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error && err.message
          ? err.message
          : t(
              "Could not prepare the Telegram PDF handoff. Please try again or use Print / save PDF.",
              "មិនអាចរៀបចំឯកសារ PDF សម្រាប់ផ្ញើទៅ Telegram បានទេ។ សូមសាកល្បងម្ដងទៀត ឬប្រើ Print / save PDF។",
            ),
      );
    } finally {
      setTelegramBusy(false);
    }
  }

  async function clearTelegramCache() {
    if (!telegramExport) return;
    const token = telegramExport.token;
    try {
      await fetch(`/api/cv-telegram/sessions/${encodeURIComponent(token)}`, { method: "DELETE" });
    } catch {
      // Ignore network errors during wipe
    }
    setTelegramExport((prev) => (prev && prev.token === token ? { ...prev, status: "expired" } : prev));
  }

  function entryEditor(section: "experience" | "education", title: string) {
    return (
      <details className={styles.section}>
        <summary>{title}</summary>
        <div className={styles.sectionBody}>
          <p className={styles.guidance}>
            {t(
              "Put your most recent entry first. Use specific responsibilities and real achievements, one bullet per line.",
              "ដាក់ព័ត៌មានថ្មីបំផុតនៅខាងលើ។ សរសេរភារកិច្ច និងសមិទ្ធផលពិតប្រាកដ មួយចំណុចក្នុងមួយបន្ទាត់។",
            )}
          </p>
          {data[section].map((item, index) => (
            <div className={styles.entry} key={item.id}>
              <div className={styles.entryTop}>
                <span>
                  {index + 1}. {title}
                </span>
                <button
                  className={styles.remove}
                  type="button"
                  aria-label={`${t("Remove", "លុប")} ${section} ${index + 1}`}
                  onClick={() =>
                    setData((current) => ({
                      ...current,
                      [section]: current[section].filter((row) => row.id !== item.id),
                    }))
                  }
                >
                  <Trash2 size={13} aria-hidden="true" />
                  {t("Remove", "លុប")}
                </button>
              </div>
              <PairField
                id={`${item.id}-title`}
                label={section === "experience" ? t("Job title", "តួនាទី") : t("Qualification", "សញ្ញាបត្រ")}
                value={item.title}
                onChange={(titleValue) => updateEntry(section, item.id, { title: titleValue })}
              />
              <PairField
                id={`${item.id}-organization`}
                label={section === "experience" ? t("Employer", "ក្រុមហ៊ុន") : t("School / university", "សាលា / សាកលវិទ្យាល័យ")}
                value={item.organization}
                onChange={(organization) => updateEntry(section, item.id, { organization })}
              />
              <div className={styles.dates}>
                <Field
                  id={`${item.id}-from`}
                  label={t("From", "ចាប់ពី")}
                  type="month"
                  value={item.from}
                  onChange={(from) => updateEntry(section, item.id, { from })}
                />
                {!item.current && (
                  <Field
                    id={`${item.id}-to`}
                    label={t("To", "ដល់")}
                    type="month"
                    value={item.to}
                    onChange={(to) => updateEntry(section, item.id, { to })}
                  />
                )}
              </div>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={item.current}
                  onChange={(event) => updateEntry(section, item.id, { current: event.target.checked })}
                />
                {t("Currently here", "បច្ចុប្បន្ននៅទីនេះ")}
              </label>
              <PairField
                id={`${item.id}-details`}
                label={t("Details · one point per line", "ព័ត៌មានលម្អិត · មួយចំណុចក្នុងមួយបន្ទាត់")}
                value={item.details}
                onChange={(details) => updateEntry(section, item.id, { details })}
                multiline
                maxLength={2400}
              />
            </div>
          ))}
          <button
            className={styles.button}
            type="button"
            disabled={data[section].length >= 8}
            onClick={() =>
              setData((current) => ({
                ...current,
                [section]: [...current[section], entry(crypto.randomUUID())],
              }))
            }
          >
            <Plus size={15} aria-hidden="true" />
            {t("Add entry", "បន្ថែមព័ត៌មាន")}
          </button>
        </div>
      </details>
    );
  }

  const openPicker = () => {
    picker.current?.showModal();
    requestAnimationFrame(syncGalleryScale);
  };

  return (
    <div className={styles.builder}>
      <CvPrivacySessionNotice />
      <div className={styles.toolbar}>
        <div>
          <h2>{t("Your next opportunity starts here.", "ឱកាសបន្ទាប់របស់អ្នកចាប់ផ្ដើមនៅទីនេះ។")}</h2>
          <p>
            {t(
              "Free standard templates. No account. No watermark. Auto-saved in this open tab only; export PDF or JSON before closing.",
              "គំរូ CV ស្តង់ដារឥតគិតថ្លៃ មិនត្រូវការគណនី និងគ្មាន watermark។ រក្សាទុកបណ្ដោះអាសន្នតែក្នុង Tab នេះ សូមរក្សាទុក PDF ឬ JSON មុនពេលបិទ។",
            )}
          </p>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.mobileToggleBtn}
            type="button"
            onClick={() => setMobileEditorOpen((open) => !open)}
            aria-expanded={mobileEditorOpen}
            aria-controls="cv-editor-sidebar"
          >
            {mobileEditorOpen ? (
              <PanelLeftClose size={16} aria-hidden="true" />
            ) : (
              <PanelLeftOpen size={16} aria-hidden="true" />
            )}
            {mobileEditorOpen ? t("View preview", "មើល CV") : t("Edit profile", "កែប្រែព័ត៌មាន")}
          </button>
          <button className={styles.button} type="button" onClick={loadExample}>
            <Sparkles size={15} aria-hidden="true" />
            {t("Load example CV", "បំពេញគំរូ CV")}
          </button>
          <button className={styles.button} type="button" onClick={openPicker}>
            <LayoutTemplate size={16} aria-hidden="true" />
            {t("30 free templates", "គំរូឥតគិតថ្លៃ ៣០")}
          </button>
          <button
            className={`${styles.button} ${styles.primary}`}
            type="button"
            onClick={savePdf}
            disabled={!canExport || printing}
          >
            <Download size={16} aria-hidden="true" />
            {printing ? t("Preparing…", "កំពុងរៀបចំ…") : t("Print / save PDF", "បោះពុម្ព / រក្សាទុក PDF")}
          </button>
          <button
            className={`${styles.button} ${styles.telegramBtn}`}
            type="button"
            onClick={sendToTelegram}
            disabled={!canExport || telegramBusy}
          >
            <Send size={15} aria-hidden="true" />
            {telegramBusy
              ? t("Preparing PDF…", "កំពុងរៀបចំ PDF…")
              : t("Send to Telegram / QR", "ផ្ញើទៅ Telegram / QR")}
          </button>
        </div>
      </div>
      {message && (
        <p className={`${styles.status} ${error ? styles.error : ""}`} role="status">
          {message}
        </p>
      )}
      {invalidDates && (
        <p className={`${styles.status} ${styles.error}`} role="alert">
          {t(
            "An end date is before its start date. Correct the dates before exporting.",
            "កាលបរិច្ឆេទបញ្ចប់នៅមុនថ្ងៃចាប់ផ្ដើម។ សូមកែតម្រូវមុនរក្សាទុក PDF។",
          )}
        </p>
      )}
      <div className={styles.workspace} data-desktop-collapsed={!desktopEditorOpen}>
        <button
          type="button"
          className={styles.sidebarBackdrop}
          data-open={mobileEditorOpen}
          tabIndex={mobileEditorOpen ? 0 : -1}
          aria-hidden={!mobileEditorOpen}
          aria-label={t("Close editor sidebar", "បិទផ្ទាំងកែប្រែ")}
          onClick={() => setMobileEditorOpen(false)}
        />
        <aside
          id="cv-editor-sidebar"
          className={styles.editor}
          data-open={mobileEditorOpen}
          aria-label={t("CV editor sidebar", "របារកែប្រែព័ត៌មាន CV")}
        >
          <div className={styles.drawerHeader}>
            <div className={styles.drawerTitleGroup}>
              <strong>{t("Edit CV Profile", "កែប្រែព័ត៌មាន CV")}</strong>
              <small>{t("Updates live preview automatically", "កែភ្លាម បង្ហាញលើគំរូភ្លាម")}</small>
            </div>
            <button
              type="button"
              className={styles.drawerCloseBtn}
              onClick={() => setMobileEditorOpen(false)}
              aria-label={t("Close editor and view preview", "បិទរបារកែប្រែ ហើយមើល CV")}
            >
              <PanelLeftClose size={15} aria-hidden="true" />
              {t("Preview", "មើល CV")}
            </button>
          </div>
          <p className={styles.notice}>
            <ShieldCheck size={16} className="mb-2" aria-hidden="true" />
            <strong>{t("Temporary and private.", "បណ្ដោះអាសន្ន និងឯកជន។")}</strong>{" "}
            {t(
              "Drafts stay in this tab’s temporary session memory while open (cleared automatically when closed) and are never saved in a database. Fill both languages yourself; display language does not auto-translate.",
              "ទិន្នន័យស្ថិតតែក្នុង session របស់ Tab នេះប៉ុណ្ណោះ (លុបចោលពេលបិទ Tab) ដោយមិនរក្សាទុកក្នុង Database ឡើយ។ សូមបំពេញភាសាទាំងពីរដោយខ្លួនឯង។",
            )}
          </p>
          <div className={styles.preferences}>
            <label className={styles.field}>
              <span>{t("CV language", "ភាសា CV")}</span>
              <select
                aria-label="CV language"
                value={language}
                onChange={(event) => setLanguage(event.target.value as CvLanguage)}
              >
                <option value="bilingual">English + ខ្មែរ</option>
                <option value="en">English</option>
                <option value="km">ខ្មែរ</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>{t("Selected template", "គំរូដែលបានជ្រើសរើស")}</span>
              <select
                aria-label="CV template"
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
              >
                {CV_TEMPLATES.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} · {item.layout}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.draftBar}>
            <button
              type="button"
              className={styles.draftBtn}
              onClick={exportJsonBackup}
              disabled={!dirty}
            >
              <FileDown size={13} aria-hidden="true" />
              {t("Save JSON", "រក្សាទុក JSON")}
            </button>
            <button
              type="button"
              className={styles.draftBtn}
              onClick={() => jsonInput.current?.click()}
            >
              <FileUp size={13} aria-hidden="true" />
              {t("Load JSON", "នាំចូល JSON")}
            </button>
            <input
              ref={jsonInput}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label={t("Import CV JSON backup", "នាំចូលឯកសារ CV JSON")}
              onChange={(event) => void importJsonBackup(event.target.files?.[0])}
            />
            <button
              type="button"
              className={styles.draftBtn}
              onClick={reset}
              disabled={!dirty}
            >
              <RotateCcw size={13} aria-hidden="true" />
              {t("Clear", "សម្អាត")}
            </button>
          </div>
          <details className={styles.section} open>
            <summary>{t("1. Personal details", "១. ព័ត៌មានផ្ទាល់ខ្លួន")}</summary>
            <div className={styles.sectionBody}>
              <div className={styles.photoField}>
                <label className={styles.field} htmlFor="cv-photo">
                  <span>{t("Portrait photo (optional)", "រូបថតប្រវត្តិរូប (ជាជម្រើស)")}</span>
                  <input
                    ref={photoInput}
                    id="cv-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => void choosePhoto(event.target.files?.[0])}
                  />
                </label>
                <p className={styles.guidance}>
                  {t(
                    "JPG, PNG or WebP · up to 3 MB. Stays in this tab. Include a photo only when appropriate for your application.",
                    "JPG, PNG ឬ WebP · មិនលើស 3 MB។ ស្ថិតក្នុងទំព័រនេះតែប៉ុណ្ណោះ។ ដាក់រូបថតតែពេលសមស្របនឹងការដាក់ពាក្យ។",
                  )}
                </p>
                {data.photo && (
                  <button
                    className={styles.remove}
                    type="button"
                    onClick={() => {
                      setData((current) => ({ ...current, photo: "" }));
                      if (photoInput.current) photoInput.current.value = "";
                    }}
                  >
                    {t("Remove photo", "លុបរូបថត")}
                  </button>
                )}
              </div>
              <PairField
                id="cv-name"
                label={t("Full name", "ឈ្មោះពេញ")}
                value={data.name}
                onChange={(value) => update("name", value)}
              />
              <PairField
                id="cv-role"
                label={t("Professional title", "តួនាទីវិជ្ជាជីវៈ")}
                value={data.role}
                onChange={(value) => update("role", value)}
              />
              <div className={styles.pair}>
                <Field
                  id="cv-email"
                  label={t("Email", "អ៊ីមែល")}
                  type="email"
                  value={data.email}
                  onChange={(email) => setData((current) => ({ ...current, email }))}
                />
                <Field
                  id="cv-phone"
                  label={t("Phone", "លេខទូរស័ព្ទ")}
                  type="tel"
                  value={data.phone}
                  onChange={(phone) => setData((current) => ({ ...current, phone }))}
                />
              </div>
              <PairField
                id="cv-location"
                label={t("City / country", "ក្រុង / ប្រទេស")}
                value={data.location}
                onChange={(value) => update("location", value)}
              />
              <Field
                id="cv-website"
                label={t("Portfolio or professional profile (optional)", "Portfolio ឬប្រវត្តិរូបវិជ្ជាជីវៈ (ជាជម្រើស)")}
                value={data.website}
                maxLength={300}
                onChange={(website) => setData((current) => ({ ...current, website }))}
              />
            </div>
          </details>
          <details className={styles.section}>
            <summary>{t("2. Profile", "២. សេចក្ដីសង្ខេប")}</summary>
            <div className={styles.sectionBody}>
              <p className={styles.guidance}>
                {t(
                  "Write a concise introduction tailored to the role. Describe skills and experience you actually have.",
                  "សរសេរសេចក្ដីណែនាំខ្លីដែលសមនឹងតួនាទី។ រៀបរាប់ជំនាញ និងបទពិសោធន៍ដែលអ្នកមានពិតប្រាកដ។",
                )}
              </p>
              <PairField
                id="cv-summary"
                label={t("Profile", "សេចក្ដីសង្ខេប")}
                value={data.summary}
                onChange={(value) => update("summary", value)}
                multiline
                maxLength={2000}
              />
            </div>
          </details>
          {entryEditor("experience", t("3. Experience", "៣. បទពិសោធន៍ការងារ"))}
          {entryEditor("education", t("4. Education", "៤. ការអប់រំ"))}
          <details className={styles.section}>
            <summary>{t("5. Skills & languages", "៥. ជំនាញ និងភាសា")}</summary>
            <div className={styles.sectionBody}>
              <PairField
                id="cv-skills"
                label={t("Skills · one per line (optional level, e.g. Figma · 90%)", "ជំនាញ · មួយក្នុងមួយបន្ទាត់ (ដាក់កម្រិតបាន ឧ. Figma · 90%)")}
                value={data.skills}
                onChange={(value) => update("skills", value)}
                multiline
                maxLength={1800}
              />
              <PairField
                id="cv-languages"
                label={t("Languages & proficiency (e.g. Khmer · Native)", "ភាសា និងកម្រិត (ឧ. ខ្មែរ · ភាសាកំណើត)")}
                value={data.languages}
                onChange={(value) => update("languages", value)}
                multiline
                maxLength={1000}
              />
            </div>
          </details>
          <details className={styles.section}>
            <summary>{t("6. Projects & achievements", "៦. គម្រោង និងសមិទ្ធផល")}</summary>
            <div className={styles.sectionBody}>
              {data.projects.map((item, index) => (
                <div key={item.id} className={styles.entry}>
                  <div className={styles.entryTop}>
                    <span>
                      {t("Project", "គម្រោង")} {index + 1}
                    </span>
                    <button
                      className={styles.remove}
                      type="button"
                      onClick={() =>
                        setData((current) => ({
                          ...current,
                          projects: current.projects.filter((project) => project.id !== item.id),
                        }))
                      }
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      {t("Remove", "លុប")}
                    </button>
                  </div>
                  <PairField
                    id={`${item.id}-project-title`}
                    label={t("Title", "ចំណងជើង")}
                    value={item.title}
                    onChange={(title) =>
                      setData((current) => ({
                        ...current,
                        projects: current.projects.map((project) =>
                          project.id === item.id ? { ...project, title } : project,
                        ),
                      }))
                    }
                  />
                  <PairField
                    id={`${item.id}-project-details`}
                    label={t("Details", "ព័ត៌មានលម្អិត")}
                    value={item.details}
                    multiline
                    maxLength={2400}
                    onChange={(details) =>
                      setData((current) => ({
                        ...current,
                        projects: current.projects.map((project) =>
                          project.id === item.id ? { ...project, details } : project,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
              <button
                className={styles.button}
                type="button"
                disabled={data.projects.length >= 8}
                onClick={() =>
                  setData((current) => ({
                    ...current,
                    projects: [...current.projects, { id: crypto.randomUUID(), title: pair(), details: pair() }],
                  }))
                }
              >
                <Plus size={15} aria-hidden="true" />
                {t("Add a project", "បន្ថែមគម្រោង")}
              </button>
            </div>
          </details>
          <div className="mt-5">
            <button type="button" className={styles.remove} onClick={reset} disabled={!dirty}>
              <Trash2 size={14} aria-hidden="true" />
              {t("Clear this CV", "លុប CV នេះ")}
            </button>
          </div>
          <p className={styles.guidance}>
            {t(
              "For online ATS applications, start with a single-column design such as Foundation or Essential. Follow the employer’s instructions; no template guarantees acceptance.",
              "សម្រាប់ការដាក់ពាក្យតាមប្រព័ន្ធ ATS អនឡាញ សូមចាប់ផ្ដើមពីរចនាមួយជួរឈរ ដូចជា Foundation ឬ Essential។ អនុវត្តតាមលក្ខខណ្ឌរបស់និយោជក។",
            )}
          </p>
        </aside>

        <div className={styles.previewWrap}>
          <div className={styles.previewTop}>
            <span>{t("Live preview", "មើលលទ្ធផលភ្លាមៗ")}</span>
            <div className={styles.previewTopActions}>
              <small>
                {template.name} · A4 ({pageCount} {pageCount === 1 ? t("page", "ទំព័រ") : t("pages", "ទំព័រ")}) ·{" "}
                {language === "bilingual" ? "EN + ខ្មែរ" : language === "en" ? "English" : "ខ្មែរ"}
              </small>
              <button
                type="button"
                className={styles.sidebarTogglePillDesktop}
                onClick={() => setDesktopEditorOpen((open) => !open)}
                aria-expanded={desktopEditorOpen}
                aria-controls="cv-editor-sidebar"
              >
                {desktopEditorOpen ? (
                  <>
                    <PanelLeftClose size={14} aria-hidden="true" />
                    {t("Hide editor", "លាក់របារ")}
                  </>
                ) : (
                  <>
                    <PanelLeftOpen size={14} aria-hidden="true" />
                    {t("Edit profile", "កែប្រែព័ត៌មាន")}
                  </>
                )}
              </button>
              <button
                type="button"
                className={styles.sidebarTogglePillMobile}
                onClick={() => setMobileEditorOpen((open) => !open)}
                aria-expanded={mobileEditorOpen}
                aria-controls="cv-editor-sidebar"
              >
                <PanelLeftOpen size={14} aria-hidden="true" />
                {t("Edit profile", "កែប្រែព័ត៌មាន")}
              </button>
            </div>
          </div>
          <div className={styles.previewScroll} aria-label={t("CV preview", "មើល CV")} tabIndex={0}>
            <div ref={previewViewport} className={styles.previewViewport}>
              <div
                className={styles.previewStage}
                style={
                  {
                    "--cv-preview-scale": previewScale,
                    "--cv-paper-h": `${paperHeight}px`,
                  } as CSSProperties
                }
              >
                <div ref={preview} className={styles.previewScale}>
                  <CvPreview data={data} template={template} language={language} />
                </div>
                {pageCount > 1 && (
                  <div className={styles.pageBreakGuide} aria-hidden="true">
                    <span>{t("Page 1 ends (A4)", "ចប់ទំព័រទី ១ (A4)")}</span>
                  </div>
                )}
              </div>
              {!dirty && (
                <div className={styles.emptyPreviewHint}>
                  <p>
                    {t(
                      "Open the editor sidebar or enter your details, or load a sample CV to preview every section and layout.",
                      "បើករបារកែប្រែដើម្បីបំពេញព័ត៌មាន ឬចុចបំពេញគំរូ CV ដើម្បីមើលរចនាបទគ្រប់ផ្នែកភ្លាមៗ។",
                    )}
                  </p>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.mobileEmptyEditBtn}
                      onClick={() => setMobileEditorOpen(true)}
                    >
                      <PanelLeftOpen size={14} aria-hidden="true" />
                      {t("Edit profile", "កែប្រែព័ត៌មាន")}
                    </button>
                    <button type="button" className={styles.button} onClick={loadExample}>
                      <Sparkles size={14} aria-hidden="true" />
                      {t("Load example CV", "បំពេញគំរូ CV")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className={styles.previewHelp}>
            {t(
              "Empty sections are omitted. A long CV continues onto additional PDF pages. Add your name to enable export; check the print preview before saving.",
              "ផ្នែកដែលមិនបានបំពេញនឹងមិនបង្ហាញ។ CV វែងនឹងបន្តទៅទំព័រ PDF បន្ទាប់។ បំពេញឈ្មោះដើម្បីរក្សាទុក ហើយពិនិត្យផ្ទាំងបោះពុម្ពជាមុន។",
            )}
          </p>
        </div>
      </div>

      <dialog ref={picker} className={styles.modal} aria-labelledby="cv-template-heading">
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.galleryEyebrow}>{t("THE CV COLLECTION", "បណ្ដុំគំរូ CV ស្តង់ដារ")}</span>
            <h2 id="cv-template-heading">{t("Choose a standard CV template", "ជ្រើសរើសគំរូ CV ស្តង់ដារ")}</h2>
            <p>
              {t(
                "30 free A4 designs across six layouts. Switching templates preserves everything you wrote.",
                "គំរូក្រដាស A4 ឥតគិតថ្លៃ ៣០ ម៉ូដ។ ការប្ដូរគំរូមិនធ្វើឱ្យបាត់បង់ព័ត៌មានរបស់អ្នកទេ។",
              )}
            </p>
          </div>
          <button
            className={styles.button}
            type="button"
            onClick={() => picker.current?.close()}
            aria-label={t("Close templates", "បិទគំរូ")}
          >
            <X size={18} />
          </button>
        </div>
        <div className={styles.templateFilters} aria-label={t("Filter templates", "ត្រងគំរូ")}>
          {["all", "classic", "sidebar", "banner", "split", "timeline", "minimal"].map((filter) => (
            <button
              type="button"
              key={filter}
              aria-pressed={templateFilter === filter}
              onClick={() => setTemplateFilter(filter)}
            >
              {filter === "all" ? t("All 30", "ទាំង ៣០") : filter}
              <span>
                {filter === "all"
                  ? ""
                  : String(CV_TEMPLATES.filter((item) => item.layout === filter).length)}
              </span>
            </button>
          ))}
        </div>
        <div ref={templateGrid} className={styles.templateGrid}>
          {galleryCollection
            .filter((item) => templateFilter === "all" || item.layout === templateFilter)
            .map((item) => (
              <div key={item.id} className={styles.templateCard} data-selected={templateId === item.id}>
                <MiniTemplate template={item} />
                <button
                  type="button"
                  className={styles.cardSelect}
                  aria-pressed={templateId === item.id}
                  onClick={() => {
                    setTemplateId(item.id);
                    picker.current?.close();
                  }}
                >
                  <span className={styles.cardMeta}>
                    <strong>{item.name}</strong>
                    <small>{lang === "km" ? item.subtitle.km : item.subtitle.en}</small>
                  </span>
                  <span className={styles.cardBadge}>
                    {templateId === item.id ? (
                      <>
                        <Check size={14} aria-hidden="true" />
                        {t("Active", "កំពុងប្រើ")}
                      </>
                    ) : (
                      t("Use", "ប្រើ")
                    )}
                  </span>
                </button>
              </div>
            ))}
        </div>
      </dialog>

      <dialog
        ref={telegramModal}
        className={`${styles.modal} ${styles.telegramModal}`}
        aria-labelledby="cv-telegram-heading"
        onClose={() => setTelegramModalOpen(false)}
      >
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.galleryEyebrow}>
              {t("TELEGRAM & QR HANDOFF", "ផ្ញើទៅ TELEGRAM និង QR CODE")}
            </span>
            <h2 id="cv-telegram-heading">
              {t("Send CV PDF to Telegram", "ផ្ញើឯកសារ CV PDF ទៅ Telegram")}
            </h2>
            <p>
              {t(
                "One temporary PDF is cached in RAM for your active session and automatically delivered to your Telegram chat when you press Start.",
                "ឯកសារ PDF តែមួយត្រូវបានរក្សាបណ្ដោះអាសន្នក្នុង cache memory សម្រាប់ session នេះ ហើយផ្ញើចូល Telegram ដោយស្វ័យប្រវត្តិ។",
              )}
            </p>
          </div>
          <button
            className={styles.button}
            type="button"
            onClick={() => {
              telegramModal.current?.close();
              setTelegramModalOpen(false);
            }}
            aria-label={t("Close Telegram export dialog", "បិទផ្ទាំង Telegram")}
          >
            <X size={18} />
          </button>
        </div>

        {telegramExport && (
          <div className={styles.telegramBody}>
            {(() => {
              const remainingSeconds =
                telegramExport.status === "pending" && telegramNowMs > 0
                  ? Math.max(0, Math.ceil((telegramExport.expiresAtMs - telegramNowMs) / 1000))
                  : telegramExport.status === "pending"
                    ? 900
                    : 0;
              const remainingLabel = `${Math.floor(remainingSeconds / 60)}:${String(
                remainingSeconds % 60,
              ).padStart(2, "0")}`;

              return (
                <>
                  <div className={styles.telegramStatus} data-state={telegramExport.status} role="status">
                    <span className={styles.telegramStatusLead}>
                      {telegramExport.status === "delivered" ? (
                        <>
                          <CheckCircle2 size={16} aria-hidden="true" />
                          {t(
                            "Delivered to Telegram! Temporary cache cleared.",
                            "បានផ្ញើទៅ Telegram រួចរាល់! Cache ត្រូវបានលុបហើយ។",
                          )}
                        </>
                      ) : telegramExport.status === "expired" ? (
                        t(
                          "Session expired or cleared from cache.",
                          "Session បានផុតកំណត់ ឬត្រូវបានលុបចេញពី cache។",
                        )
                      ) : (
                        <>
                          <QrCode size={16} aria-hidden="true" />
                          {t("Ready · Waiting for Telegram handoff", "រួចរាល់ · រង់ចាំការបើក Telegram")}
                        </>
                      )}
                    </span>
                    {telegramExport.status === "pending" && <small>{remainingLabel}</small>}
                  </div>

                  {telegramExport.status !== "expired" && (
                    <div className={styles.qrCard}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={telegramExport.qrDataUrl}
                        alt={t("Telegram CV bot QR code", "កូដ QR សម្រាប់ផ្ញើ CV ទៅ Telegram")}
                        className={styles.qrImage}
                        width={210}
                        height={210}
                      />
                      <p className={styles.qrHint}>
                        {t(
                          `Scan with your phone or click Open Telegram, then tap Start in @${telegramExport.botUsername} to receive ${telegramExport.fileName} automatically.`,
                          `ស្កេន QR តាមទូរស័ព្ទ ឬចុច បើក Telegram រួចចុច Start ក្នុង @${telegramExport.botUsername} ដើម្បីទទួល ${telegramExport.fileName} ដោយស្វ័យប្រវត្តិ។`,
                        )}
                      </p>
                      <div className={styles.telegramActions}>
                        {/^https:\/\/t\.me\/[a-zA-Z0-9_]+\?start=cv_[a-zA-Z0-9_-]{16,44}$/.test(
                          telegramExport.telegramUrl,
                        ) && (
                          <a
                            href={telegramExport.telegramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.button} ${styles.telegramBtn}`}
                          >
                            <Send size={15} aria-hidden="true" />
                            {t("Open Telegram", "បើក Telegram")}
                            <ExternalLink size={13} aria-hidden="true" />
                          </a>
                        )}
                        <button
                          type="button"
                          className={styles.button}
                          onClick={sendToTelegram}
                          disabled={telegramBusy}
                        >
                          <RefreshCw size={14} aria-hidden="true" />
                          {telegramBusy ? t("Updating…", "កំពុងធ្វើបច្ចុប្បន្នភាព…") : t("Refresh QR", "បង្កើត QR ថ្មី")}
                        </button>
                      </div>
                    </div>
                  )}

                  {telegramExport.status === "expired" && (
                    <div className={styles.telegramActions}>
                      <button
                        type="button"
                        className={`${styles.button} ${styles.telegramBtn}`}
                        onClick={sendToTelegram}
                        disabled={telegramBusy}
                      >
                        <RefreshCw size={14} aria-hidden="true" />
                        {telegramBusy
                          ? t("Preparing PDF…", "កំពុងរៀបចំ PDF…")
                          : t("Export & create new QR", "បង្កើត PDF & QR ថ្មី")}
                      </button>
                    </div>
                  )}

                  <div className={styles.telegramFooter}>
                    <span>
                      {t(
                        "1-session RAM cache · No database storage",
                        "Cache RAM តែ ១ session · មិនរក្សាក្នុង Database",
                      )}
                    </span>
                    {telegramExport.status === "pending" && (
                      <button type="button" className={styles.remove} onClick={clearTelegramCache}>
                        <Trash2 size={13} aria-hidden="true" />
                        {t("Remove from cache", "លុបពី cache")}
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </dialog>
    </div>
  );
}
