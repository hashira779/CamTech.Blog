export type CvLayout = "classic" | "sidebar" | "banner" | "split" | "timeline" | "minimal";
export type CvLanguage = "en" | "km" | "bilingual";
export type CvText = { en: string; km: string };
export type CvHeadingStyle = "line" | "caps" | "plain" | "bar" | "pill" | "badge" | "ribbon" | "pillOutline";
export type CvSkillStyle = "tags" | "bars" | "dots" | "inline";

export type CvTemplate = {
  id: string;
  name: string;
  layout: CvLayout;
  accent: string;
  subtitle: CvText;
  serif?: boolean;
  compact?: boolean;
  educationFirst?: boolean;
  twoToneName?: boolean;
  monogram?: boolean;
  samplePhoto?: boolean;
  ringLanguages?: boolean;
  heading: CvHeadingStyle;
  skillStyle?: CvSkillStyle;
};

// Six structural layouts, each with five typographic, palette, and section treatments. All 30 are free.
export const CV_TEMPLATES: CvTemplate[] = [
  {
    id: "foundation",
    name: "Foundation",
    layout: "classic",
    accent: "#1d3557",
    heading: "line",
    skillStyle: "inline",
    subtitle: { en: "Harvard Standard · ATS", km: "ស្តង់ដារ Harvard · ATS" },
  },
  {
    id: "ledger",
    name: "Ledger",
    layout: "classic",
    accent: "#1f2428",
    serif: true,
    heading: "caps",
    compact: true,
    skillStyle: "inline",
    subtitle: { en: "Executive Matrix · Serif", km: "បែបប្រតិបត្តិ Serif" },
  },
  {
    id: "scholar",
    name: "Scholar",
    layout: "classic",
    accent: "#452c63",
    serif: true,
    heading: "plain",
    educationFirst: true,
    skillStyle: "inline",
    subtitle: { en: "Academic · Education First", km: "សិក្សា · អប់រំជាមុន" },
  },
  {
    id: "summit",
    name: "Summit",
    layout: "classic",
    accent: "#f5a623",
    heading: "pillOutline",
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Gold Pill Outline · Spine", km: "ស៊ុមមាស · ខ្សែបន្ទាត់" },
  },
  {
    id: "saffron",
    name: "Saffron",
    layout: "classic",
    accent: "#f59e0b",
    heading: "bar",
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Amber Border · Executive Grid", km: "ស៊ុមមាស · តារាងប្រតិបត្តិ" },
  },
  {
    id: "canopy",
    name: "Canopy",
    layout: "sidebar",
    accent: "#0d9488",
    heading: "badge",
    twoToneName: true,
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Teal Frame · Mint Rail", km: "ស៊ុមបៃតង · របារស្រាល" },
  },
  {
    id: "metro",
    name: "Metro",
    layout: "sidebar",
    accent: "#f97316",
    heading: "pill",
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Geometric Orange · Dark Rail", km: "មុំទឹកក្រូច · របារងងឹត" },
  },
  {
    id: "studio",
    name: "Studio",
    layout: "sidebar",
    accent: "#d97706",
    heading: "ribbon",
    samplePhoto: true,
    ringLanguages: true,
    skillStyle: "bars",
    subtitle: { en: "Amber Ribbon · Portrait Band", km: "ស្លាកបូមាស · រូបថតលើ" },
  },
  {
    id: "compass",
    name: "Compass",
    layout: "sidebar",
    accent: "#f5a623",
    heading: "badge",
    twoToneName: true,
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Charcoal + Gold Diagonal", km: "ធ្យូង និងមាស · ខ្សែបន្ទាត់" },
  },
  {
    id: "horizon",
    name: "Horizon",
    layout: "banner",
    accent: "#0ea5e9",
    heading: "badge",
    twoToneName: true,
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Navy + Cyan Diagonal", km: "ខៀវចាស់ និងផ្ទៃមេឃ" },
  },
  {
    id: "beacon",
    name: "Beacon",
    layout: "banner",
    accent: "#f97316",
    heading: "badge",
    twoToneName: true,
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Amber Frame + Dark Rail", km: "ស៊ុមទឹកក្រូច · របារងងឹត" },
  },
  {
    id: "atlas",
    name: "Atlas",
    layout: "banner",
    accent: "#f97316",
    heading: "badge",
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Orange Stripe + Dark Rail", km: "ឆ្នូតទឹកក្រូច · របារស្ដាំ" },
  },
  {
    id: "north",
    name: "North",
    layout: "banner",
    accent: "#f59e0b",
    heading: "bar",
    educationFirst: true,
    samplePhoto: true,
    skillStyle: "tags",
    subtitle: { en: "Amber Wave · 2-Col Split", km: "ក្បាលកោងមាស · ២ ជួរ" },
  },
  {
    id: "balance",
    name: "Balance",
    layout: "split",
    accent: "#2563eb",
    heading: "pill",
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Bento Cards · Modular", km: "កាត Bento ២ ជួរឈរ" },
  },
  {
    id: "bridge",
    name: "Bridge",
    layout: "split",
    accent: "#165b46",
    heading: "line",
    compact: true,
    monogram: true,
    ringLanguages: true,
    skillStyle: "tags",
    subtitle: { en: "Split Header + Ring Gauges", km: "ក្បាលបំបែក និងរង្វង់ភាសា" },
  },
  {
    id: "slate",
    name: "Slate",
    layout: "split",
    accent: "#f97316",
    heading: "badge",
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Noel Arch · Framed Rail", km: "ស៊ុមមូល · របារទឹកក្រូច" },
  },
  {
    id: "focus",
    name: "Focus",
    layout: "split",
    accent: "#eab308",
    heading: "badge",
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Charcoal + Yellow Panel", km: "ធ្យូង និងផ្ទៃលឿង" },
  },
  {
    id: "journey",
    name: "Journey",
    layout: "timeline",
    accent: "#1b5e46",
    heading: "badge",
    twoToneName: true,
    skillStyle: "tags",
    subtitle: { en: "Chronological Spine", km: "ខ្សែបន្ទាត់ពេលវេលា" },
  },
  {
    id: "momentum",
    name: "Momentum",
    layout: "timeline",
    accent: "#facc15",
    heading: "pill",
    compact: true,
    twoToneName: true,
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Charcoal + Yellow Pills", km: "ធ្យូង និងស្លាកលឿង" },
  },
  {
    id: "progress",
    name: "Progress",
    layout: "timeline",
    accent: "#5c3d2e",
    serif: true,
    heading: "line",
    skillStyle: "tags",
    subtitle: { en: "Editorial 2-Col Timeline", km: "ក្បាលបំបែក · ២ ជួរឈរ" },
  },
  {
    id: "pathway",
    name: "Pathway",
    layout: "timeline",
    accent: "#7c3aed",
    heading: "badge",
    twoToneName: true,
    educationFirst: true,
    samplePhoto: true,
    skillStyle: "dots",
    subtitle: { en: "Violet Curve · 2-Col Spine", km: "របារស្វាយ · ពេលវេលា" },
  },
  {
    id: "essential",
    name: "Essential",
    layout: "minimal",
    accent: "#1d4ed8",
    heading: "badge",
    monogram: true,
    ringLanguages: true,
    skillStyle: "bars",
    subtitle: { en: "Monogram + 2-Col Swiss", km: "អក្សរកាត់ និង ២ ជួរឈរ" },
  },
  {
    id: "clarity",
    name: "Clarity",
    layout: "minimal",
    accent: "#1d4ed8",
    heading: "line",
    compact: true,
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Swiss Grid · Bars", km: "តារាង Swiss · របារជំនាញ" },
  },
  {
    id: "pure",
    name: "Pure",
    layout: "minimal",
    accent: "#1b4d3e",
    serif: true,
    heading: "caps",
    skillStyle: "inline",
    subtitle: { en: "Centered Editorial Serif", km: "អក្សរ Serif កណ្ដាល" },
  },
  {
    id: "outline",
    name: "Outline",
    layout: "minimal",
    accent: "#4c1d95",
    heading: "bar",
    educationFirst: true,
    monogram: true,
    skillStyle: "tags",
    subtitle: { en: "Framed 2-Col Atelier", km: "ស៊ុមក្បាល ២ ជួរឈរ" },
  },
  {
    id: "marine",
    name: "Marine",
    layout: "sidebar",
    accent: "#eab308",
    heading: "pillOutline",
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Slate Navy · Gold Arch", km: "ខៀវចាស់ · កោងមាស" },
  },
  {
    id: "apex",
    name: "Apex",
    layout: "banner",
    accent: "#ea580c",
    heading: "badge",
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Angled Dark · Orange Band", km: "មុំងងឹត · ក្បាលទឹកក្រូច" },
  },
  {
    id: "harbor",
    name: "Harbor",
    layout: "split",
    accent: "#f97316",
    heading: "pill",
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Deep Navy Shell · White Sheet", km: "ស៊ុមខៀវចាស់ · ទំព័រស" },
  },
  {
    id: "iris",
    name: "Iris",
    layout: "timeline",
    accent: "#4f46e5",
    heading: "bar",
    twoToneName: true,
    samplePhoto: true,
    skillStyle: "bars",
    subtitle: { en: "Indigo Edge · Modern Spine", km: "របារស្វាយ · ខ្សែបន្ទាត់" },
  },
  {
    id: "breeze",
    name: "Breeze",
    layout: "minimal",
    accent: "#0284c7",
    heading: "line",
    samplePhoto: true,
    skillStyle: "inline",
    subtitle: { en: "Sky Swiss · Clean Editorial", km: "ស្វីសផ្ទៃមេឃ · សាមញ្ញស្អាត" },
  },
];

export function cvTextLines(text: CvText, language: CvLanguage): { language: "en" | "km"; text: string }[] {
  const languages: ("en" | "km")[] = language === "bilingual" ? ["en", "km"] : [language];
  return languages.map((language) => ({ language, text: text[language].trim() })).filter((line) => line.text);
}

export function cvListItems(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export function cvParseLanguageItem(line: string): { label: string; level: string } {
  const clean = line.trim();
  const match = clean.match(/^(.+?)\s*(?:·|:|—|–|\s-\s)\s*(.+)$/);
  if (!match) return { label: clean, level: "" };
  return { label: match[1].trim(), level: match[2].trim() };
}

export function cvParseSkillItem(line: string): { label: string; score: number | null } {
  const clean = line.trim();
  const match = clean.match(/^(.+?)\s*(?:·|:|—|–|\s-\s)\s*(\d{1,3})\s*(%|\/\s*5|\/\s*10)?$/);
  if (!match) return { label: clean, score: null };
  const raw = Number(match[2]);
  const unit = (match[3] || "").replace(/\s+/g, "");
  let score: number;
  if (unit === "/5") {
    score = Math.min(100, Math.max(0, Math.round((raw / 5) * 100)));
  } else if (unit === "/10") {
    score = Math.min(100, Math.max(0, Math.round((raw / 10) * 100)));
  } else {
    score = Math.min(100, Math.max(0, raw));
  }
  return { label: match[1].trim(), score };
}

export function cvLanguageScore(level: string): number | null {
  const clean = level.trim().toLowerCase();
  if (!clean) return null;
  const pct = clean.match(/(\d{1,3})\s*%/);
  if (pct) return Math.min(100, Math.max(0, Number(pct[1])));
  if (/native|mother|c2|fluent|ស្ទាត់|កំណើត/.test(clean)) return 95;
  if (/professional|advanced|c1|b2|ប្រើក្នុងការងារ|ល្អ/.test(clean)) return 80;
  if (/intermediate|conversational|b1|មធ្យម/.test(clean)) return 60;
  if (/basic|beginner|elementary|a1|a2|មូលដ្ឋាន|តិចតួច/.test(clean)) return 35;
  return null;
}

export function cvSplitDisplayName(name: string): { head: string; tail: string } {
  const clean = name.trim();
  const idx = clean.lastIndexOf(" ");
  if (idx <= 0) return { head: clean, tail: "" };
  return { head: clean.slice(0, idx), tail: clean.slice(idx + 1) };
}

export function cvInitials(name: CvText): string {
  const words = name.en.trim().match(/[A-Za-z0-9]+/g);
  if (!words || !words.length) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function cvDate(value: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return value.trim();
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}-01T00:00:00Z`));
}

export function cvFileName(name: string): string {
  const clean = name.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").replace(/\s+/g, " ").slice(0, 90);
  return clean ? `${clean} - CV` : "My CV";
}
