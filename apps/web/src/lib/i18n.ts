"use client";

import React, { createContext, useContext, ReactNode } from "react";

export type Language = "en" | "km";

export const DEFAULT_LANGUAGE: Language = "en";
export const SUPPORTED_LANGUAGES: readonly Language[] = ["en", "km"] as const;

export const LANGUAGE_COOKIE = "dd_lang";
export const LANGUAGE_STORAGE_KEY = "dd_lang";

/**
 * Common bilingual UI translations required across application
 */
export const commonTranslations = {
  home: {
    en: "Home",
    km: "ទំព័រដើម",
  },
  search: {
    en: "Search",
    km: "ស្វែងរក",
  },
  read_more: {
    en: "Read More",
    km: "អានបន្ថែម",
  },
  share: {
    en: "Share",
    km: "ចែករំលែក",
  },
  about: {
    en: "About",
    km: "អំពីយើង",
  },
  contact: {
    en: "Contact",
    km: "ទំនាក់ទំនង",
  },
  latest_news: {
    en: "Latest News",
    km: "ព័ត៌មានចុងក្រោយ",
  },
  trending: {
    en: "Trending",
    km: "កំពុងពេញនិយម",
  },
} as const;

export type CommonTranslationKey = keyof typeof commonTranslations;

/**
 * Full application translation dictionary
 */
export const translations = {
  en: {
    // Common terms
    home: "Home",
    search: "Search",
    read_more: "Read More",
    share: "Share",
    about: "About",
    contact: "Contact",
    latest_news: "Latest News",
    trending: "Trending",

    // Scoped common keys
    "common.home": "Home",
    "common.search": "Search",
    "common.read_more": "Read More",
    "common.share": "Share",
    "common.about": "About",
    "common.contact": "Contact",
    "common.latest_news": "Latest News",
    "common.trending": "Trending",

    // Navigation
    "nav.home": "Home",
    "nav.cambodia": "Cambodia",
    "nav.world": "World",
    "nav.discover": "Discover",
    "nav.travel": "Travel & Trips",
    "nav.quiz": "Daily Quiz",
    "nav.tools": "Useful Tools",
    "nav.trending": "Trending",
    "nav.wedding": "Wedding",
    "nav.saved": "Saved",
    "nav.admin": "CMS Admin",
    "nav.search_placeholder": "Search news, discoveries, quizzes, tools...",
    "brand.tagline": "Technology & Science",

    // Homepage sections
    "home.happening_today": "What's Happening Today",
    "home.trending_in_cambodia": "Trending in Cambodia",
    "home.trending_worldwide": "Trending Worldwide",
    "home.editor_picks": "Editor's Picks",
    "home.todays_discovery": "Today's Discovery",
    "home.discovery_subtitle": "Visual explanations of science, technology, and how the world works.",
    "home.daily_quiz_title": "Daily Knowledge Challenge",
    "home.daily_quiz_subtitle": "Can you answer these 5 verified questions? Test your mind today.",
    "home.popular_tools": "Useful Everyday Tools",
    "home.popular_tools_subtitle": "Fast, private, and 100% functional calculators and developer utilities.",
    "home.latest_cambodia": "Latest Cambodia News",
    "home.latest_world": "Latest World News",
    "home.read_full": "Read Analysis",
    "home.view_all": "View All",

    // Article detail
    "article.what_happened": "What Happened?",
    "article.key_points": "Key Points",
    "article.why_it_matters": "Why It Matters",
    "article.timeline": "Timeline & Chronology",
    "article.source_attribution": "Source Attribution & Transparency",
    "article.original_reporting_by": "Original Reporting By",
    "article.view_original_source": "View Original Publication",
    "article.share_article": "Share This Story",
    "article.related_stories": "Related Coverage",
    "article.related_discoveries": "Related Visual Discoveries",
    "article.related_tools": "Useful Related Tools",

    // Quiz
    "quiz.start": "Start Challenge",
    "quiz.question": "Question",
    "quiz.of": "of",
    "quiz.score": "Your Score",
    "quiz.complete": "Challenge Complete!",
    "quiz.source_ref": "Verified Source",
    "quiz.try_again": "Play Again",

    // Tools
    "tool.calculate": "Calculate",
    "tool.format": "Format",
    "tool.copy": "Copy Output",
    "tool.copied": "Copied!",
    "tool.reset": "Reset",
    "tool.popular": "Popular Tool",

    // Footer & Policies
    "footer.tagline": "A modern discovery, news, and utility platform built for long-term daily curiosity.",
    "footer.about": "About Us",
    "footer.editorial_policy": "Editorial Policy",
    "footer.corrections": "Corrections Policy",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.cookies": "Cookie Policy",
    "footer.advertising": "Advertising & Transparency",
    "footer.contact": "Contact Newsroom",
    "footer.copyright": "CamTech.Blog. All verified citations and original editorial analyses reserved.",
  },
  km: {
    // Common terms
    home: "ទំព័រដើម",
    search: "ស្វែងរក",
    read_more: "អានបន្ថែម",
    share: "ចែករំលែក",
    about: "អំពីយើង",
    contact: "ទំនាក់ទំនង",
    latest_news: "ព័ត៌មានចុងក្រោយ",
    trending: "កំពុងពេញនិយម",

    // Scoped common keys
    "common.home": "ទំព័រដើម",
    "common.search": "ស្វែងរក",
    "common.read_more": "អានបន្ថែម",
    "common.share": "ចែករំលែក",
    "common.about": "អំពីយើង",
    "common.contact": "ទំនាក់ទំនង",
    "common.latest_news": "ព័ត៌មានចុងក្រោយ",
    "common.trending": "កំពុងពេញនិយម",

    // Navigation
    "nav.home": "ទំព័រដើម",
    "nav.cambodia": "កម្ពុជា",
    "nav.world": "ពិភពលោក",
    "nav.discover": "ស្វែងយល់",
    "nav.travel": "ទេសចរណ៍ & ដំណើរកម្សាន្ត",
    "nav.quiz": "កម្រងសំណួរ",
    "nav.tools": "ឧបករណ៍មានប្រយោជន៍",
    "nav.trending": "ពេញនិយម",
    "nav.wedding": "អាពាហ៍ពិពាហ៍",
    "nav.saved": "បានរក្សាទុក",
    "nav.admin": "គ្រប់គ្រង CMS",
    "nav.search_placeholder": "ស្វែងរកព័ត៌មាន ចំណេះដឹង កម្រងសំណួរ ឧបករណ៍...",
    "brand.tagline": "បច្ចេកវិទ្យា និងវិទ្យាសាស្ត្រ",

    // Homepage sections
    "home.happening_today": "ព្រឹត្តិការណ៍សំខាន់ថ្ងៃនេះ",
    "home.trending_in_cambodia": "ពេញនិយមនៅកម្ពុជា",
    "home.trending_worldwide": "ពេញនិយមទូទាំងពិភពលោក",
    "home.editor_picks": "ជម្រើសនិពន្ធនាយក",
    "home.todays_discovery": "ការស្វែងយល់ថ្ងៃនេះ",
    "home.discovery_subtitle": "ការពន្យល់បែបវិទ្យាសាស្ត្រ បច្ចេកវិទ្យា និងរបៀបដំណើរការនៃពិភពលោក។",
    "home.daily_quiz_title": "សំណួរចំណេះដឹងប្រចាំថ្ងៃ",
    "home.daily_quiz_subtitle": "តើអ្នកអាចឆ្លើយសំណួរទាំង ៥ នេះបានទេ? សាកល្បងចំណេះដឹងរបស់អ្នកថ្ងៃនេះ។",
    "home.popular_tools": "ឧបករណ៍ប្រើប្រាស់ប្រចាំថ្ងៃ",
    "home.popular_tools_subtitle": "ម៉ាស៊ីនគិតលេខ និងឧបករណ៍អភិវឌ្ឍន៍រហ័ស ឯកជន និងដំណើរការ ១០០%។",
    "home.latest_cambodia": "ព័ត៌មានកម្ពុជាចុងក្រោយ",
    "home.latest_world": "ព័ត៌មានពិភពលោកចុងក្រោយ",
    "home.read_full": "អានការវិភាគ",
    "home.view_all": "មើលទាំងអស់",

    // Article detail
    "article.what_happened": "តើមានអ្វីកើតឡើង?",
    "article.key_points": "ចំណុចសំខាន់ៗ",
    "article.why_it_matters": "ហេតុអ្វីបានជារឿងនេះសំខាន់?",
    "article.timeline": "កាលប្បវត្តិព្រឹត្តិការណ៍",
    "article.source_attribution": "ប្រភពព័ត៌មាន និងតម្លាភាព",
    "article.original_reporting_by": "រាយការណ៍ដើមដោយ",
    "article.view_original_source": "មើលការចេញផ្សាយដើម",
    "article.share_article": "ចែករំលែកអត្ថបទនេះ",
    "article.related_stories": "ព័ត៌មានពាក់ព័ន្ធ",
    "article.related_discoveries": "ចំណេះដឹងពាក់ព័ន្ធ",
    "article.related_tools": "ឧបករណ៍ពាក់ព័ន្ធ",

    // Quiz
    "quiz.start": "ចាប់ផ្តើមការប្រកួត",
    "quiz.question": "សំណួរ",
    "quiz.of": "នៃ",
    "quiz.score": "ពិន្ទុរបស់អ្នក",
    "quiz.complete": "បានបញ្ចប់ការប្រកួត!",
    "quiz.source_ref": "ប្រភពផ្ទៀងផ្ទាត់",
    "quiz.try_again": "លេងម្តងទៀត",

    // Tools
    "tool.calculate": "គណនា",
    "tool.format": "រៀបចំទម្រង់",
    "tool.copy": "ចម្លងលទ្ធផល",
    "tool.copied": "បានចម្លង!",
    "tool.reset": "កំណត់ឡើងវិញ",
    "tool.popular": "ឧបករណ៍ពេញនិយម",

    // Footer & Policies
    "footer.tagline": "វេទិកាព័ត៌មាន ចំណេះដឹង និងឧបករណ៍ទំនើបដែលបង្កើតឡើងសម្រាប់ការរៀនសូត្រប្រចាំថ្ងៃ។",
    "footer.about": "អំពីយើង",
    "footer.editorial_policy": "គោលការណ៍និពន្ធ",
    "footer.corrections": "គោលការណ៍កែតម្រូវ",
    "footer.privacy": "គោលការណ៍ឯកជនភាព",
    "footer.terms": "លក្ខខណ្ឌប្រើប្រាស់",
    "footer.cookies": "គោលការណ៍ខូគី",
    "footer.advertising": "ការផ្សាយពាណិជ្ជកម្ម និងតម្លាភាព",
    "footer.contact": "ទំនាក់ទំនងការិយាល័យនិពន្ធ",
    "footer.copyright": "CamTech.Blog រក្សាសិទ្ធិគ្រប់យ៉ាង។",
  },
};

export type TranslationKey = keyof typeof translations.en;

/**
 * Parse language from cookie string
 */
export function getLanguageFromCookie(cookieHeaderOrString?: string): Language | null {
  const cookieSource =
    cookieHeaderOrString ??
    (typeof document !== "undefined" ? document.cookie : "");

  if (!cookieSource) return null;

  const match = cookieSource.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE}=([^;]*)`));
  if (match && (match[1] === "en" || match[1] === "km")) {
    return match[1] as Language;
  }
  return null;
}

/**
 * Save language to cookie
 */
export function setLanguageCookie(lang: Language): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LANGUAGE_COOKIE}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * Get language from localStorage
 */
export function getLanguageFromStorage(): Language | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (val === "en" || val === "km") {
      return val as Language;
    }
  } catch {
    // localStorage might be unavailable
  }
  return null;
}

/**
 * Save language to localStorage
 */
export function setLanguageStorage(lang: Language): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // localStorage might be unavailable
  }
}

/**
 * Detect language from cookie, storage, or browser
 */
export function detectLanguage(cookieHeaderOrString?: string): Language {
  // 1. Check cookie
  const cookieLang = getLanguageFromCookie(cookieHeaderOrString);
  if (cookieLang) return cookieLang;

  // 2. Check localStorage
  const storageLang = getLanguageFromStorage();
  if (storageLang) return storageLang;

  // 3. Browser language. Only the first recognisable preference decides: a reader
  //    whose browser lists `en-US, km` wants English, not Khmer. Testing the whole
  //    list for any Khmer entry flipped the entire site to Khmer for exactly that
  //    reader, which is how an English article ended up with a Khmer headline.
  const preferred = typeof navigator !== "undefined"
    ? [...(navigator.languages || []), navigator.language || ""]
    : [];
  for (const raw of preferred) {
    const l = String(raw || "").toLowerCase();
    if (!l) continue;
    if (l.startsWith("km") || l.includes("khmer")) return "km";
    if (l.startsWith("en")) return "en";
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Toggle language between en and km
 */
export function toggleLanguage(currentLang: Language): Language {
  return currentLang === "en" ? "km" : "en";
}

/**
 * Translate a translation key into a string
 */
export function translate(
  key: TranslationKey | string,
  lang: Language = DEFAULT_LANGUAGE
): string {
  const dictionary = translations[lang] || translations[DEFAULT_LANGUAGE];
  return (
    (dictionary as Record<string, string>)[key] ||
    translations[DEFAULT_LANGUAGE][key as TranslationKey] ||
    key
  );
}

export interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: TranslationKey | string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  toggleLang: () => {},
  t: (k) => String(k),
});

const listeners = new Set<() => void>();

function emitLanguageChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === LANGUAGE_STORAGE_KEY) {
      callback();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }
  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getSnapshot(): Language {
  return detectLanguage();
}

function getServerSnapshot(): Language {
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLang = React.useCallback((newLang: Language) => {
    setLanguageStorage(newLang);
    setLanguageCookie(newLang);
    emitLanguageChange();
  }, []);

  const toggleLang = React.useCallback(() => {
    const current = getSnapshot();
    setLang(toggleLanguage(current));
  }, [setLang]);

  const t = React.useCallback(
    (key: TranslationKey | string): string => {
      return translate(key, lang);
    },
    [lang]
  );

  return React.createElement(
    I18nContext.Provider,
    { value: { lang, setLang, toggleLang, t } },
    children
  );
}

export function useI18n(): I18nContextType {
  return useContext(I18nContext);
}
