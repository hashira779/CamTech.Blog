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

    // Header topline
    "header.topline_tagline": "CAMBODIA / LIFE / TECHNOLOGY",
    "header.topline_corner": "A useful corner of the internet",

    // Navigation
    "nav.home": "Home",
    "nav.cv_builder": "CV Builder",
    "nav.free_badge": "Free",
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
    "nav.search_placeholder": "Search news, discoveries, travel and tools...",
    "brand.tagline": "Cambodia, life & technology",

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

    // Homepage extended
    "home.hero_eyebrow": "A little local. A little limitless.",
    "home.hero_title": "Good places. Useful things. Fresh perspectives.",
    "home.hero_title_1": "Good places.",
    "home.hero_title_2": "Useful things.",
    "home.hero_title_3": "Fresh perspectives.",
    "home.hero_deck": "Discover Cambodia, simplify your everyday, and find something worth knowing. Welcome to your curious corner of the internet.",
    "home.explore_cambodia": "Explore Cambodia",
    "home.find_tool": "Find a useful tool",
    "home.start_exploring": "A good place to start",
    "home.hero_visual_tag": "Ratanakiri, Cambodia",
    "home.hero_visual_collection": "The Cambodia collection",
    "home.hero_visual_heading": "There’s more out there.",
    "home.hero_planner_tag": "Less planning. More exploring.",
    "home.hero_planner_sub": "Build your own itinerary",
    "home.hero_visual_sub": "A different kind of everyday discovery.",
    "home.pathway_sub": "Explore your way",
    "home.pathway_1_title": "Go somewhere good",
    "home.pathway_1_note": "Find a place. Make a plan. Take the trip.",
    "home.pathway_2_title": "Make life a little easier",
    "home.pathway_2_note": "Small tools for the things you do every day.",
    "home.pathway_3_title": "Follow your curiosity",
    "home.pathway_3_note": "Understand the ideas shaping our world.",
    "home.places_eyebrow": "Out of the ordinary",
    "home.places_title": "Your next “let’s go.”",
    "home.places_desc": "From familiar favourites to somewhere new. Start with a place.",
    "home.explore_all_destinations": "Explore all destinations",
    "home.dest_siemreap_name": "Siem Reap",
    "home.dest_siemreap_note": "Ancient temples. New perspectives.",
    "home.dest_siemreap_label": "Culture & heritage",
    "home.dest_kampot_name": "Kampot",
    "home.dest_kampot_note": "Take the scenic route.",
    "home.dest_kampot_label": "Riverside escapes",
    "home.dest_ratanakiri_name": "Ratanakiri",
    "home.dest_ratanakiri_note": "A little further off the beaten path.",
    "home.dest_ratanakiri_label": "Nature & adventure",
    "home.tools_eyebrow": "A little everyday help",
    "home.tools_title": "Small tools. Real time saved.",
    "home.tools_desc": "Convert, create, calculate. Get on with the rest of your day.",
    "home.open_toolbox": "Open the toolbox",
    "home.tools_footnote": "No account needed for these tools.",
    "home.tools_find_right": "Find the right tool for your task",
    "home.curiosity_eyebrow": "A few things worth understanding",
    "home.curiosity_title": "Stay a little curious.",
    "home.curiosity_desc": "Science, technology, and the stories behind how things work.",
    "home.follow_curiosity": "Follow your curiosity",
    "home.read_explainer": "Read the explainer",
    "home.planner_eyebrow": "Make it your kind of trip",
    "home.planner_title": "A good trip starts with a little idea.",
    "home.planner_desc": "Bring places together in a day-by-day itinerary. Move things around. Make room for a detour.",
    "home.planner_button": "Plan something good",
    "home.journal_eyebrow": "From the journal",
    "home.journal_title": "A wider perspective.",
    "home.browse_journal": "Browse the journal",
    "home.values_title": "Worth your time. Made to be useful.",
    "home.values_desc": "A place for practical discovery, clear explanations, and a closer look at Cambodia.",
    "home.meet_camtech": "Meet CamTech",

    // News Section Fronts
    "section.stories_count": "stories in this section",
    "section.how_we_attribute": "How we attribute",
    "section.in_this_issue": "In this issue",
    "section.latest": "Latest",
    "section.most_read": "Most read",
    "section.opened_most_often": "Opened most often",
    "section.attribution": "Attribution",
    "section.source_registry": "Source registry",
    "section.reading_figures": "Reading figures appear once stories have been opened.",

    // Cambodia Section
    "cambodia.eyebrow": "Cambodia",
    "cambodia.title": "Cambodia & regional",
    "cambodia.description": "Reporting from Phnom Penh and the provinces. Each story is summarised here and credited to the publisher it came from, with a link back to the original.",
    "cambodia.secondary_title": "More from Cambodia",
    "cambodia.latest_title": "Lately from the provinces",
    "cambodia.attribution": "Cambodia stories are gathered from named publishers and link out to the original report. The feeds we draw on are listed in the source registry.",

    // World Section
    "world.eyebrow": "World",
    "world.title": "World News",
    "world.description": "International reporting on geopolitics, markets and the events beyond Cambodia. Every story is credited to the publisher that reported it.",
    "world.secondary_title": "More across the region and beyond",
    "world.latest_title": "Recently filed",
    "world.attribution": "World stories are summarised from the publisher’s own feed and credit the original report. The feeds we draw on are listed in the source registry.",

    // Article detail
    "article.what_happened": "What Happened?",
    "article.key_points": "Key Points",
    "article.why_it_matters": "Why It Matters",
    "article.timeline": "Timeline & Chronology",
    "article.source_attribution": "Source Attribution & Transparency",
    "article.attribution_statement": "This desk summarises and adds context. The reporting belongs to the publisher below, and we link it so you can read it in full.",
    "article.original_reporting_by": "Original Reporting By",
    "article.view_original_source": "View Original Publication",
    "article.share_article": "Share This Story",
    "article.min_left": "min left",
    "article.copied": "Link copied",
    "article.copy_link": "Copy link",
    "article.save": "Save",
    "article.saved": "Saved",
    "article.share_fb": "Share on Facebook",
    "article.share_tg": "Share on Telegram",
    "article.share_x": "Share on X",
    "article.explainer_promo_title": "Explainers that show the mechanism",
    "article.tools_promo_title": "Calculators that work without an account",
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
    "footer.tagline": "Good places, useful things, and fresh perspectives. A curious corner of the internet, rooted in Cambodia.",
    "footer.col_sections": "Sections",
    "footer.col_travel": "Travel",
    "footer.col_editorial": "Editorial",
    "footer.col_company": "Company",
    "footer.col_legal": "Legal",
    "footer.guides": "Guides",
    "footer.trip_planner": "Trip Planner",
    "footer.content_standards": "Content Standards",
    "footer.sources": "Our Sources",
    "footer.all_sources": "All sources",
    "footer.about": "About Us",
    "footer.editorial_policy": "Editorial Policy",
    "footer.corrections": "Corrections Policy",
    "footer.privacy": "Privacy Policy",
    "footer.terms": "Terms of Service",
    "footer.cookies": "Cookie Policy",
    "footer.advertising": "Advertising & Transparency",
    "footer.contact": "Contact Newsroom",
    "footer.copyright": "CamTech.Blog. All verified citations and original editorial analyses reserved.",

    // Homepage CV Builder Feature & Page
    "home.cv_cta_hero": "Free CV Builder",
    "home.cv_eyebrow": "Featured Studio · 100% Free & Private",
    "home.cv_title": "Build a Khmer & English CV that stands out.",
    "home.cv_desc": "Design studio-crafted or ATS-ready A4 résumés in English, Khmer, or both side-by-side. Zero sign-up, zero watermarks — download a clean PDF immediately or send it to your phone via Telegram QR.",
    "home.cv_feat_1": "30+ Studio & ATS A4 Templates",
    "home.cv_feat_2": "Khmer, English & Bilingual Switch",
    "home.cv_feat_3": "Instant PDF + Telegram Bot QR",
    "home.cv_button": "Build Your CV Free",
    "home.cv_secondary_link": "Open CV Studio directly",
    "home.cv_preview_badge": "Studio Preview · A4 PDF",
    "home.cv_preview_name": "Sokha Dara",
    "home.cv_preview_role": "Senior Software Engineer · Phnom Penh",
    "home.cv_preview_chip": "Instant PDF or Scan QR → Telegram",
    "cv.page_eyebrow": "Featured Studio · 100% Free & Private",
    "cv.page_title": "Free Khmer & English CV Builder",
    "cv.page_desc": "Create crisp, recruiter-ready A4 résumés in English, Khmer, or bilingual format across 30+ templates. Download PDF immediately or deliver to your phone with Telegram QR — zero account stored.",
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

    // Header topline
    "header.topline_tagline": "កម្ពុជា / ជីវិត / បច្ចេកវិទ្យា",
    "header.topline_corner": "ជ្រុងមានប្រយោជន៍នៃអ៊ីនធឺណិត",

    // Navigation
    "nav.home": "ទំព័រដើម",
    "nav.cv_builder": "កម្មវិធីបង្កើត CV",
    "nav.free_badge": "ឥតគិតថ្លៃ",
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

    // Homepage extended (Khmer)
    "home.hero_eyebrow": "ក្នុងស្រុក និងគ្មានដែនកំណត់។",
    "home.hero_title": "ទីកន្លែងល្អៗ។ ឧបករណ៍មានប្រយោជន៍។ ទស្សនវិស័យថ្មី។",
    "home.hero_title_1": "ទីកន្លែងល្អៗ។",
    "home.hero_title_2": "ឧបករណ៍មានប្រយោជន៍។",
    "home.hero_title_3": "ទស្សនវិស័យថ្មី។",
    "home.hero_deck": "ស្វែងយល់ពីកម្ពុជា សម្រួលជីវិតប្រចាំថ្ងៃ និងស្វែងរកចំណេះដឹងថ្មីៗ។ សូមស្វាគមន៍មកកាន់ជ្រុងដ៏គួរឱ្យចាប់អារម្មណ៍នៃអ៊ីនធឺណិត។",
    "home.explore_cambodia": "រុករកកម្ពុជា",
    "home.find_tool": "ស្វែងរកឧបករណ៍មានប្រយោជន៍",
    "home.start_exploring": "កន្លែងចាប់ផ្តើមដ៏ល្អ",
    "home.hero_visual_tag": "រតនគិរី កម្ពុជា",
    "home.hero_visual_collection": "បណ្តុំព័ត៌មានកម្ពុជា",
    "home.hero_visual_heading": "មានអ្វីៗជាច្រើនទៀត\nនៅខាងក្រៅ។",
    "home.hero_planner_tag": "រៀបចំតិច ដើរកម្សាន្តបានច្រើន។",
    "home.hero_planner_sub": "បង្កើតគម្រោងដំណើរកម្សាន្តផ្ទាល់ខ្លួន",
    "home.hero_visual_sub": "ការស្វែងយល់ប្រចាំថ្ងៃបែបថ្មី។",
    "home.pathway_sub": "រុករកតាមរបៀបរបស់អ្នក",
    "home.pathway_1_title": "ទៅកាន់ទីកន្លែងល្អៗ",
    "home.pathway_1_note": "ស្វែងរកទីកន្លែង រៀបចំគម្រោង ចេញដំណើរកម្សាន្ត។",
    "home.pathway_2_title": "ធ្វើឱ្យជីវិតកាន់តែងាយស្រួល",
    "home.pathway_2_note": "ឧបករណ៍តូចៗសម្រាប់កិច្ចការប្រចាំថ្ងៃរបស់អ្នក។",
    "home.pathway_3_title": "ដើរតាមការចង់ដឹងរបស់អ្នក",
    "home.pathway_3_note": "ស្វែងយល់ពីគំនិតដែលកំពុងផ្លាស់ប្តូរពិភពលោក។",
    "home.places_eyebrow": "លើសពីភាពសាមញ្ញ",
    "home.places_title": "ដំណើរផ្សងព្រេងបន្ទាប់របស់អ្នក",
    "home.places_desc": "ពីកន្លែងដែលអ្នកធ្លាប់ស្គាល់ ទៅកាន់កន្លែងថ្មីៗ។ ចាប់ផ្តើមពីរុករកទីកន្លែង។",
    "home.explore_all_destinations": "រុករកគោលដៅទាំងអស់",
    "home.dest_siemreap_name": "សៀមរាប",
    "home.dest_siemreap_note": "ប្រាសាទបុរាណ ទស្សនវិស័យថ្មី។",
    "home.dest_siemreap_label": "វប្បធម៌ & បេតិកភណ្ឌ",
    "home.dest_kampot_name": "កំពត",
    "home.dest_kampot_note": "ជ្រើសរើសផ្លូវទេសភាពដ៏ស្រស់ស្អាត។",
    "home.dest_kampot_label": "លំហែកាយមាត់ព្រែក",
    "home.dest_ratanakiri_name": "រតនគិរី",
    "home.dest_ratanakiri_note": "ដំណើរផ្សងព្រេងទៅកាន់ធម្មជាតិស្រស់បំព្រង។",
    "home.dest_ratanakiri_label": "ធម្មជាតិ & ដំណើរផ្សងព្រេង",
    "home.tools_eyebrow": "ជំនួយប្រចាំថ្ងៃបន្តិចបន្តួច",
    "home.tools_title": "ឧបករណ៍តូចៗ ចំណេញពេលវេលាពិតប្រាកដ។",
    "home.tools_desc": "បម្លែង បង្កើត គណនា។ ជួយឱ្យកិច្ចការអ្នកលឿនរហ័ស។",
    "home.open_toolbox": "បើកប្រអប់ឧបករណ៍",
    "home.tools_footnote": "មិនចាំបាច់បង្កើតគណនីដើម្បីប្រើប្រាស់ឧបករណ៍ទាំងនេះទេ។",
    "home.tools_find_right": "ស្វែងរកឧបករណ៍ត្រឹមត្រូវសម្រាប់កិច្ចការអ្នក",
    "home.curiosity_eyebrow": "ចំណេះដឹងគួរស្វែងយល់",
    "home.curiosity_title": "រក្សាការចង់ដឹងចង់ឃើញជានិច្ច។",
    "home.curiosity_desc": "វិទ្យាសាស្ត្រ បច្ចេកវិទ្យា និងដំណើររឿងនៅពីក្រោយរបៀបដែលអ្វីៗដំណើរការ។",
    "home.follow_curiosity": "ស្វែងយល់បន្ថែម",
    "home.read_explainer": "អានការពន្យល់",
    "home.planner_eyebrow": "ធ្វើឱ្យវាក្លាយជាដំណើរកម្សាន្តផ្ទាល់ខ្លួន",
    "home.planner_title": "ដំណើរកម្សាន្តដ៏ល្អចាប់ផ្តើមពីគំនិតតូចមួយ។",
    "home.planner_desc": "ប្រមូលផ្តុំទីកន្លែងជាកាលវិភាគប្រចាំថ្ងៃ រៀបចំទីតាំង និងទុកពេលសម្រាប់ការឈប់សម្រាក។",
    "home.planner_button": "រៀបចំគម្រោងដំណើរកម្សាន្ត",
    "home.journal_eyebrow": "ពីសារព័ត៌មាន",
    "home.journal_title": "ទស្សនវិស័យកាន់តែទូលំទូលាយ។",
    "home.browse_journal": "អានព័ត៌មានទាំងអស់",
    "home.values_title": "ស័ក្តិសមនឹងពេលវេលារបស់អ្នក។ បង្កើតឡើងដើម្បីផ្តល់ប្រយោជន៍។",
    "home.values_desc": "កន្លែងសម្រាប់ការស្វែងយល់ជាក់ស្តែង ការពន្យល់ច្បាស់លាស់ និងការក្រឡេកមើលកម្ពុជាឱ្យកាន់តែជិតស្និទ្ធ។",
    "home.meet_camtech": "ស្វែងយល់ពី CamTech",

    // News Section Fronts (Khmer)
    "section.stories_count": "អត្ថបទក្នុងផ្នែកនេះ",
    "section.how_we_attribute": "របៀបដែលយើងបញ្ជាក់ប្រភព",
    "section.in_this_issue": "នៅក្នុងលេខនេះ",
    "section.latest": "ចុងក្រោយបង្អស់",
    "section.most_read": "អានច្រើនជាងគេ",
    "section.opened_most_often": "បើកអានញឹកញាប់បំផុត",
    "section.attribution": "ការបញ្ជាក់ប្រភព",
    "section.source_registry": "បញ្ជីប្រភពព័ត៌មាន",
    "section.reading_figures": "ស្ថិតិនឹងបង្ហាញនៅពេលមានអ្នកបើកអាន។",

    // Cambodia Section (Khmer)
    "cambodia.eyebrow": "កម្ពុជា",
    "cambodia.title": "កម្ពុជា និងតំបន់",
    "cambodia.description": "របាយការណ៍ពីរាជធានីភ្នំពេញ និងបណ្តាខេត្ត។ រាល់អត្ថបទត្រូវបានសង្ខេប និងបញ្ជាក់ប្រភពដើមយ៉ាងច្បាស់លាស់ ជាមួយតំណភ្ជាប់ទៅកាន់ការចុះផ្សាយដើម។",
    "cambodia.secondary_title": "ព័ត៌មានបន្ថែមពីកម្ពុជា",
    "cambodia.latest_title": "ព័ត៌មានថ្មីៗពីបណ្តាខេត្ត",
    "cambodia.attribution": "អត្ថបទព័ត៌មានកម្ពុជាត្រូវបានប្រមូលផ្តុំពីបណ្តាស្ថាប័នសារព័ត៌មានផ្លូវការ និងភ្ជាប់តំណទៅកាន់របាយការណ៍ដើម។",

    // World Section (Khmer)
    "world.eyebrow": "ពិភពលោក",
    "world.title": "ព័ត៌មានពិភពលោក",
    "world.description": "របាយការណ៍អន្តរជាតិស្តីពីភូមិសាស្ត្រនយោបាយ ទីផ្សារ និងព្រឹត្តិការណ៍សំខាន់ៗជុំវិញពិភពលោក។",
    "world.secondary_title": "ព័ត៌មានបន្ថែមក្នុងតំបន់ និងសកលលោក",
    "world.latest_title": "ទើបទទួលបានថ្មីៗ",
    "world.attribution": "ព័ត៌មានពិភពលោកត្រូវបានសង្ខេបពីប្រភពផ្ទាល់របស់ស្ថាប័ននីមួយៗ និងបញ្ជាក់ប្រភពដើមត្រឹមត្រូវ។",

    // Article detail
    "article.what_happened": "តើមានអ្វីកើតឡើង?",
    "article.key_points": "ចំណុចសំខាន់ៗ",
    "article.why_it_matters": "ហេតុអ្វីបានជារឿងនេះសំខាន់?",
    "article.timeline": "កាលប្បវត្តិព្រឹត្តិការណ៍",
    "article.source_attribution": "ប្រភពព័ត៌មាន និងតម្លាភាព",
    "article.attribution_statement": "ការិយាល័យនិពន្ធរបស់យើងធ្វើការសង្ខេប និងបន្ថែមបរិបទស៊ីជម្រៅ។ របាយការណ៍ដើមជារបស់ស្ថាប័នខាងក្រោម ហើយយើងផ្តល់តំណភ្ជាប់ដើម្បីឱ្យអ្នកអាចអានពេញលេញ។",
    "article.original_reporting_by": "រាយការណ៍ដើមដោយ",
    "article.view_original_source": "មើលការចេញផ្សាយដើម",
    "article.share_article": "ចែករំលែកអត្ថបទនេះ",
    "article.min_left": "នាទីទៀត",
    "article.copied": "បានចម្លងតំណ",
    "article.copy_link": "ចម្លងតំណ",
    "article.save": "រក្សាទុក",
    "article.saved": "បានរក្សាទុក",
    "article.share_fb": "ចែករំលែកលើ Facebook",
    "article.share_tg": "ចែករំលែកលើ Telegram",
    "article.share_x": "ចែករំលែកលើ X",
    "article.explainer_promo_title": "ការពន្យល់ស៊ីជម្រៅពីរបៀបដែលអ្វីៗដំណើរការ",
    "article.tools_promo_title": "ឧបករណ៍គណនាដែលដំណើរការដោយមិនបាច់មានគណនី",
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
    "footer.col_sections": "ផ្នែកព័ត៌មាន",
    "footer.col_travel": "ទេសចរណ៍",
    "footer.col_editorial": "ការិយាល័យនិពន្ធ",
    "footer.col_company": "ស្ថាប័ន",
    "footer.col_legal": "ផ្លូវច្បាប់",
    "footer.guides": "មគ្គុទ្ទេសក៍",
    "footer.trip_planner": "គម្រោងដំណើរកម្សាន្ត",
    "footer.content_standards": "ស្តង់ដាខ្លឹមសារ",
    "footer.sources": "ប្រភពព័ត៌មានយើង",
    "footer.all_sources": "ប្រភពទាំងអស់",
    "footer.about": "អំពីយើង",
    "footer.editorial_policy": "គោលការណ៍និពន្ធ",
    "footer.corrections": "គោលការណ៍កែតម្រូវ",
    "footer.privacy": "គោលការណ៍ឯកជនភាព",
    "footer.terms": "លក្ខខណ្ឌប្រើប្រាស់",
    "footer.cookies": "គោលការណ៍ខូគី",
    "footer.advertising": "ការផ្សាយពាណិជ្ជកម្ម និងតម្លាភាព",
    "footer.contact": "ទំនាក់ទំនងការិយាល័យនិពន្ធ",
    "footer.copyright": "CamTech.Blog រក្សាសិទ្ធិគ្រប់យ៉ាង។",

    // Homepage CV Builder Feature & Page
    "home.cv_cta_hero": "បង្កើត CV ឥតគិតថ្លៃ",
    "home.cv_eyebrow": "មុខងារពិសេស · ឥតគិតថ្លៃ ១០០%",
    "home.cv_title": "បង្កើត CV ភាសាខ្មែរ និងអង់គ្លេសដ៏ទាក់ទាញ។",
    "home.cv_desc": "រចនា CV កម្រិតស្តង់ដា A4 ជាភាសាខ្មែរ អង់គ្លេស ឬពីរភាសាព្រមគ្នា ដោយមិនចាំបាច់ចុះឈ្មោះ ឬបង់ប្រាក់។ ទាញយកជា PDF ភ្លាមៗ ឬផ្ញើចូលទូរស័ព្ទតាម Telegram QR។",
    "home.cv_feat_1": "គំរូ CV ស្តង់ដា A4 ជាង ៣០ ម៉ូដ",
    "home.cv_feat_2": "គាំទ្រខ្មែរ អង់គ្លេស និងពីរភាសា",
    "home.cv_feat_3": "ទាញយក PDF + ផ្ញើតាម Telegram QR",
    "home.cv_button": "ចាប់ផ្តើមបង្កើត CV ឥតគិតថ្លៃ",
    "home.cv_secondary_link": "មើលគំរូទាំង ៣០+ ម៉ូដ",
    "home.cv_preview_badge": "គំរូទំព័រ A4",
    "home.cv_preview_name": "សុខា តារា",
    "home.cv_preview_role": "ប្រធានក្រុមវិស្វករសូហ្វវែរ · ភ្នំពេញ",
    "home.cv_preview_chip": "ទាញយក PDF ឬស្កេន QR → Telegram",
    "cv.page_eyebrow": "មុខងារសំខាន់ · ឥតគិតថ្លៃ និងឯកជនភាព",
    "cv.page_title": "កម្មវិធីបង្កើត CV ខ្មែរ និងអង់គ្លេសឥតគិតថ្លៃ",
    "cv.page_desc": "ជ្រើសរើសគំរូ CV ស្អាតៗជាង ៣០ ម៉ូដជាភាសាខ្មែរ អង់គ្លេស ឬពីរភាសា។ នាំចេញជា PDF ច្បាស់ល្អ ឬផ្ញើចូលទូរស័ព្ទភ្លាមៗតាម Telegram QR ដោយមិនរក្សាទុកទិន្នន័យផ្ទាល់ខ្លួន។",
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
