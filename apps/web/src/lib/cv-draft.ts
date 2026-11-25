import type { CvLanguage, CvText } from "./cv-templates";

export const CV_DRAFT_SESSION_KEY = "camtech.cv.draft.v1";

export interface CvSessionEntry {
  id: string;
  title: CvText;
  organization: CvText;
  details: CvText;
  from: string;
  to: string;
  current: boolean;
}

export interface CvSessionProject {
  id: string;
  title: CvText;
  details: CvText;
}

export interface CvSessionData {
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
  experience: CvSessionEntry[];
  education: CvSessionEntry[];
  projects: CvSessionProject[];
}

export interface CvSessionDraft {
  version: 1;
  templateId: string;
  language: CvLanguage;
  data: CvSessionData;
}

export interface DraftStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

const VALID_LANGUAGES = new Set<CvLanguage>(["bilingual", "en", "km"]);

function asCleanString(value: unknown, maxLen: number): string {
  return typeof value === "string" ? value.slice(0, maxLen) : "";
}

function asPair(value: unknown, maxLen: number): CvText {
  if (!value || typeof value !== "object") return { en: "", km: "" };
  const record = value as Record<string, unknown>;
  return {
    en: asCleanString(record.en, maxLen),
    km: asCleanString(record.km, maxLen),
  };
}

function asSafePhoto(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "/images/cv-sample-portrait.jpg") return trimmed;
  if (/^data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed) && trimmed.length <= 2_500_000) {
    return trimmed;
  }
  return "";
}

function asEntries(value: unknown, fallbackIdPrefix: string): CvSessionEntry[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [
      {
        id: `${fallbackIdPrefix}-1`,
        title: { en: "", km: "" },
        organization: { en: "", km: "" },
        details: { en: "", km: "" },
        from: "",
        to: "",
        current: false,
      },
    ];
  }
  return value.slice(0, 8).map((item, idx) => {
    const rec = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      id: asCleanString(rec.id, 60) || `${fallbackIdPrefix}-${idx + 1}`,
      title: asPair(rec.title, 180),
      organization: asPair(rec.organization, 180),
      details: asPair(rec.details, 2400),
      from: asCleanString(rec.from, 20),
      to: asCleanString(rec.to, 20),
      current: Boolean(rec.current),
    };
  });
}

function asProjects(value: unknown): CvSessionProject[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).map((item, idx) => {
    const rec = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      id: asCleanString(rec.id, 60) || `project-${idx + 1}`,
      title: asPair(rec.title, 180),
      details: asPair(rec.details, 1800),
    };
  });
}

export function sanitizeCvDraft(
  raw: unknown,
  fallbackTemplateId = "foundation",
  validTemplateIds?: ReadonlySet<string>,
): CvSessionDraft | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const dataObj = (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)
    ? obj.data
    : obj) as Record<string, unknown>;

  const hasShape =
    "name" in dataObj ||
    "role" in dataObj ||
    "summary" in dataObj ||
    "experience" in dataObj;
  if (!hasShape) return null;

  const rawTemplate = typeof obj.templateId === "string" ? obj.templateId.trim() : "";
  const templateId =
    rawTemplate && (!validTemplateIds || validTemplateIds.has(rawTemplate))
      ? rawTemplate
      : fallbackTemplateId;
  const rawLang = typeof obj.language === "string" ? (obj.language as CvLanguage) : "bilingual";
  const language: CvLanguage = VALID_LANGUAGES.has(rawLang) ? rawLang : "bilingual";

  return {
    version: 1,
    templateId,
    language,
    data: {
      name: asPair(dataObj.name, 140),
      role: asPair(dataObj.role, 160),
      location: asPair(dataObj.location, 140),
      email: asCleanString(dataObj.email, 140),
      phone: asCleanString(dataObj.phone, 60),
      website: asCleanString(dataObj.website, 180),
      photo: asSafePhoto(dataObj.photo),
      summary: asPair(dataObj.summary, 1800),
      skills: asPair(dataObj.skills, 1000),
      languages: asPair(dataObj.languages, 600),
      experience: asEntries(dataObj.experience, "experience"),
      education: asEntries(dataObj.education, "education"),
      projects: asProjects(dataObj.projects),
    },
  };
}

function resolveSessionStorage(customStorage?: DraftStorageLike | null): DraftStorageLike | null {
  if (customStorage !== undefined) return customStorage;
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readCvDraftFromSession(
  customStorage?: DraftStorageLike | null,
  validTemplateIds?: ReadonlySet<string>,
): CvSessionDraft | null {
  const storage = resolveSessionStorage(customStorage);
  if (!storage) return null;
  try {
    const raw = storage.getItem(CV_DRAFT_SESSION_KEY);
    if (!raw) return null;
    return sanitizeCvDraft(JSON.parse(raw), "foundation", validTemplateIds);
  } catch {
    return null;
  }
}

export function writeCvDraftToSession(
  draft: CvSessionDraft,
  customStorage?: DraftStorageLike | null,
): boolean {
  const storage = resolveSessionStorage(customStorage);
  if (!storage) return false;
  try {
    storage.setItem(CV_DRAFT_SESSION_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearCvDraftFromSession(customStorage?: DraftStorageLike | null): boolean {
  const storage = resolveSessionStorage(customStorage);
  if (!storage) return false;
  try {
    if (typeof storage.removeItem === "function") {
      storage.removeItem(CV_DRAFT_SESSION_KEY);
    } else {
      storage.setItem(CV_DRAFT_SESSION_KEY, "");
    }
    return true;
  } catch {
    return false;
  }
}
