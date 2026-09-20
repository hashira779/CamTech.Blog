"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "km";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.cambodia": "Cambodia",
    "nav.world": "World",
    "nav.discover": "Discover",
    "nav.travel": "Travel & Trips",
    "nav.quiz": "Daily Quiz",
    "nav.tools": "Useful Tools",
    "nav.trending": "Trending",
    "nav.saved": "Saved",
    "nav.admin": "CMS Admin",
    "nav.search_placeholder": "Search news, discoveries, quizzes, tools...",

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
    "footer.copyright": "Daily Discovery. All verified citations and original editorial analyses reserved."
  },
  km: {
    // Navigation
    "nav.home": "ទំព័រដើម",
    "nav.cambodia": "កម្ពុជា",
    "nav.world": "ពិភពលោក",
    "nav.discover": "ស្វែងយល់",
    "nav.travel": "ទេសចរណ៍ & ដំណើរកម្សាន្ត",
    "nav.quiz": "កម្រងសំណួរ",
    "nav.tools": "ឧបករណ៍មានប្រយោជន៍",
    "nav.trending": "ពេញនិយម",
    "nav.saved": "បានរក្សាទុក",
    "nav.admin": "គ្រប់គ្រង CMS",
    "nav.search_placeholder": "ស្វែងរកព័ត៌មាន ចំណេះដឹង កម្រងសំណួរ ឧបករណ៍...",

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
    "footer.copyright": "Daily Discovery រក្សាសិទ្ធិគ្រប់យ៉ាង។"
  }
};

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("dd_lang") as Language;
    if (saved === "en" || saved === "km") {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("dd_lang", newLang);
  };

  const t = (key: string): string => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
