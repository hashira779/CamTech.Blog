export type CvLayout = "classic" | "sidebar" | "banner" | "split" | "timeline" | "minimal";
export type CvLanguage = "en" | "km" | "bilingual";
export type CvText = { en: string; km: string };
export type CvTemplate = {
  id: string; name: string; layout: CvLayout; accent: string;
  serif?: boolean; compact?: boolean; educationFirst?: boolean;
  heading: "line" | "caps" | "plain" | "bar";
};

// Six structural layouts, each with four type/section treatments. No paid templates.
export const CV_TEMPLATES: CvTemplate[] = [
  { id: "foundation", name: "Foundation", layout: "classic", accent: "#25394d", heading: "line" },
  { id: "ledger", name: "Ledger", layout: "classic", accent: "#292929", serif: true, heading: "caps", compact: true },
  { id: "scholar", name: "Scholar", layout: "classic", accent: "#4b395e", serif: true, heading: "plain", educationFirst: true },
  { id: "summit", name: "Summit", layout: "classic", accent: "#285247", heading: "bar" },
  { id: "canopy", name: "Canopy", layout: "sidebar", accent: "#285247", heading: "caps" },
  { id: "metro", name: "Metro", layout: "sidebar", accent: "#25394d", heading: "line", compact: true },
  { id: "studio", name: "Studio", layout: "sidebar", accent: "#674633", serif: true, heading: "plain" },
  { id: "compass", name: "Compass", layout: "sidebar", accent: "#4b395e", heading: "bar", educationFirst: true },
  { id: "horizon", name: "Horizon", layout: "banner", accent: "#25394d", heading: "line" },
  { id: "beacon", name: "Beacon", layout: "banner", accent: "#285247", heading: "caps", compact: true },
  { id: "atlas", name: "Atlas", layout: "banner", accent: "#674633", serif: true, heading: "plain" },
  { id: "north", name: "North", layout: "banner", accent: "#4b395e", heading: "bar", educationFirst: true },
  { id: "balance", name: "Balance", layout: "split", accent: "#25394d", heading: "caps" },
  { id: "bridge", name: "Bridge", layout: "split", accent: "#285247", heading: "line", compact: true },
  { id: "slate", name: "Slate", layout: "split", accent: "#363c43", serif: true, heading: "plain" },
  { id: "focus", name: "Focus", layout: "split", accent: "#674633", heading: "bar", educationFirst: true },
  { id: "journey", name: "Journey", layout: "timeline", accent: "#285247", heading: "line" },
  { id: "momentum", name: "Momentum", layout: "timeline", accent: "#25394d", heading: "caps", compact: true },
  { id: "progress", name: "Progress", layout: "timeline", accent: "#674633", serif: true, heading: "plain" },
  { id: "pathway", name: "Pathway", layout: "timeline", accent: "#4b395e", heading: "bar", educationFirst: true },
  { id: "essential", name: "Essential", layout: "minimal", accent: "#292929", heading: "plain" },
  { id: "clarity", name: "Clarity", layout: "minimal", accent: "#25394d", heading: "line", compact: true },
  { id: "pure", name: "Pure", layout: "minimal", accent: "#285247", serif: true, heading: "caps" },
  { id: "outline", name: "Outline", layout: "minimal", accent: "#4b395e", heading: "bar", educationFirst: true },
];

export function cvTextLines(text: CvText, language: CvLanguage): { language: "en" | "km"; text: string }[] {
  const languages: ("en" | "km")[] = language === "bilingual" ? ["en", "km"] : [language];
  return languages.map((language) => ({ language, text: text[language].trim() })).filter((line) => line.text);
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
