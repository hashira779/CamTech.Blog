"use client";

import { useI18n, type Language } from "@/lib/i18n";

/**
 * Every string the travel journey prints, in both languages.
 *
 * Kept beside the scenes rather than in the global dictionary: these lines only exist on
 * /travel, and the global `translate()` falls back to the raw key, which would print
 * "travel.hero.title" on screen the day one entry is missed. A typed table cannot miss one.
 */
const COPY = {
  en: {
    eyebrow: "Kingdom of Cambodia · Travel",
    heroTitleA: "Discover Cambodia.",
    heroTitleB: "Beyond the Ordinary.",
    heroLead:
      "Sunrise over sandstone, islands in the Gulf, misty highlands and the Mekong's slow bend — one country, many worlds, all in one directory.",
    ctaExplore: "Explore Cambodia",
    ctaPlan: "Plan Your Journey",
    scrollCue: "Scroll to begin the journey",
    heroArtLabel: "Illustration: the five towers of Angkor Wat at sunrise, mirrored in the reflection pond",
    toolsLabel: "Travel tools",
    tools: {
      planner: "Trip planner",
      transport: "Buses & routes",
      nearby: "Near me",
      suggest: "Suggest a place",
    },

    discoveryLabel: "Chapter I · The route",
    discoveryTitle: "One kingdom, traced stop by stop",
    discoveryLead:
      "Follow a route through the provinces as you scroll. Each marker is a provincial hub in the directory.",
    mapNote:
      "Stylised map. Markers are plotted from each province's recorded coordinates; the land shape is decorative and not for navigation.",
    stop: "Stop",
    of: "of",
    bestTime: "Best time",
    exploreHub: "Explore hub",
    mapLabel: "Stylised map of Cambodia's provincial hubs",

    worldsLabel: "Chapter II · Different worlds",
    worldsTitle: "Five worlds inside one country",
    worldsLead: "Each with its own light, pace and air.",
    worldsHint: "Keep scrolling — the worlds move sideways",
    visit: "Visit",

    attractionsLabel: "Chapter III · Landmarks",
    attractionsTitle: "Must-visit attractions",
    attractionsLead:
      "Temples, waterfalls, islands and protected landscapes in the directory. Tiles marked as unverified simply have no photograph we can attribute to the place yet.",
    allAttractions: "All attractions",
    filterAttractions: "Filter attractions by type",
    nothingVerified: "Nothing in this category has been verified yet.",
    addressMissing: "Address not recorded",
    view: "View",
    photoMissing: "Photo not verified yet",

    provincesLabel: "Chapter IV · Directory",
    provincesTitle: "Explore Cambodia by province",
    provincesLead: (n: number) =>
      `${n} provincial hubs. Filter by region, pick a marker or a card, then open a hub for its places, map and routes.`,
    filterProvinces: "Filter provinces by region",
    noProvince: "No province is listed under this region yet.",
    bestTimeMissing: "Best time not recorded",
    provinceMapLabel: "Province markers — choose one to open its hub",
    inRegion: (n: number) => `${n} in view`,

    practicalLabel: "Practical",
    transportLabel: "Getting around",
    transportTitle: "Buses, vans and schedules",
    transportLead: (n: number) =>
      `${n} recorded options between Phnom Penh and Siem Reap. Fares and departure times change often, so reconfirm with the operator before you travel.`,
    allRoutes: "All routes",
    guidesLabel: "Field guides",
    guidesTitle: "Practical travel knowledge",
    guidesLead: "Logistics, dress codes, dawn timings and temple etiquette.",
    eventsLabel: "Cultural calendar",
    eventsTitle: "Festivals and gatherings",
    eventsLead: (n: number) => `${n} upcoming events in the directory.`,

    finaleLabel: "Chapter V · Itineraries",
    finaleTitle: "Routes already drawn for you",
    finaleLead: "Multi-day plans assembled from the places listed for each province.",
    buildPlan: "Build a custom plan",
    days: (n: number) => `${n} day${n === 1 ? "" : "s"}`,
    budget: "budget",
    scheduledDays: (n: number) => `${n} scheduled day${n === 1 ? "" : "s"}`,
    noSchedule: "Day-by-day schedule not published yet",
    viewItinerary: "View itinerary",
    day: "Day",
    closingTitle: "Your Cambodia Story Starts Here.",
    closingLead:
      "Choose your dates and travel style, and the planner assembles a day-by-day route from the directory — with places that have no photograph or hours recorded shown as such.",
    startPlanning: "Start planning",
    suggestPlace: "Suggest a place",
  },
  km: {
    eyebrow: "ព្រះរាជាណាចក្រកម្ពុជា · ទេសចរណ៍",
    heroTitleA: "ស្វែងយល់ពីកម្ពុជា។",
    heroTitleB: "លើសពីភាពធម្មតា។",
    heroLead:
      "ថ្ងៃរះលើប្រាសាទថ្មភក់ កោះនៅឈូងសមុទ្រ ខ្ពង់រាបពពកស្រទាប់ និងខ្សែទន្លេមេគង្គ — ប្រទេសតែមួយ ពិភពច្រើន នៅក្នុងបញ្ជីតែមួយ។",
    ctaExplore: "ស្វែងរកកម្ពុជា",
    ctaPlan: "រៀបចំដំណើររបស់អ្នក",
    scrollCue: "រំកិលចុះដើម្បីចាប់ផ្តើមដំណើរ",
    heroArtLabel: "គំនូរ៖ កំពូលទាំងប្រាំនៃប្រាសាទអង្គរវត្តពេលថ្ងៃរះ ឆ្លុះលើស្រះទឹក",
    toolsLabel: "ឧបករណ៍ទេសចរណ៍",
    tools: {
      planner: "កម្មវិធីរៀបចំដំណើរ",
      transport: "ឡានក្រុង និងផ្លូវ",
      nearby: "ជិតខ្ញុំ",
      suggest: "ស្នើទីកន្លែង",
    },

    discoveryLabel: "ជំពូក ១ · ផ្លូវធ្វើដំណើរ",
    discoveryTitle: "ព្រះរាជាណាចក្រមួយ តាមដានម្តងមួយចំណត",
    discoveryLead:
      "រំកិលដើម្បីដើរតាមផ្លូវកាត់តាមខេត្តនានា។ សញ្ញានីមួយៗគឺជាមជ្ឈមណ្ឌលខេត្តក្នុងបញ្ជី។",
    mapNote:
      "ផែនទីរចនា។ សញ្ញាត្រូវបានដាក់តាមកូអរដោនេដែលបានកត់ត្រារបស់ខេត្តនីមួយៗ រូបរាងដីគ្រាន់តែជាការតុបតែង មិនមែនសម្រាប់ការធ្វើដំណើរទេ។",
    stop: "ចំណត",
    of: "នៃ",
    bestTime: "ពេលល្អបំផុត",
    exploreHub: "ស្វែងរកខេត្ត",
    mapLabel: "ផែនទីរចនានៃមជ្ឈមណ្ឌលខេត្តនៃកម្ពុជា",

    worldsLabel: "ជំពូក ២ · ពិភពផ្សេងៗ",
    worldsTitle: "ពិភពប្រាំ នៅក្នុងប្រទេសតែមួយ",
    worldsLead: "ពិភពនីមួយៗមានពន្លឺ ចង្វាក់ និងខ្យល់ផ្ទាល់ខ្លួន។",
    worldsHint: "បន្តរំកិល — ពិភពនានានឹងរំកិលទៅចំហៀង",
    visit: "ទស្សនា",

    attractionsLabel: "ជំពូក ៣ · កន្លែងល្បី",
    attractionsTitle: "កន្លែងទេសចរណ៍ដែលត្រូវតែទៅ",
    attractionsLead:
      "ប្រាសាទ ទឹកធ្លាក់ កោះ និងតំបន់ការពារក្នុងបញ្ជី។ ប្រអប់ដែលសម្គាល់ថាមិនទាន់ផ្ទៀងផ្ទាត់ គ្រាន់តែមិនទាន់មានរូបថតដែលយើងអាចបញ្ជាក់ប្រភពបាន។",
    allAttractions: "កន្លែងទាំងអស់",
    filterAttractions: "ច្រោះកន្លែងទេសចរណ៍តាមប្រភេទ",
    nothingVerified: "មិនទាន់មានអ្វីក្នុងប្រភេទនេះត្រូវបានផ្ទៀងផ្ទាត់នៅឡើយទេ។",
    addressMissing: "មិនទាន់កត់ត្រាអាសយដ្ឋាន",
    view: "មើល",
    photoMissing: "រូបថតមិនទាន់ផ្ទៀងផ្ទាត់",

    provincesLabel: "ជំពូក ៤ · បញ្ជីខេត្ត",
    provincesTitle: "ស្វែងរកកម្ពុជាតាមខេត្ត",
    provincesLead: (n: number) =>
      `មជ្ឈមណ្ឌលខេត្តចំនួន ${toKhmerDigits(n)}។ ច្រោះតាមតំបន់ ជ្រើសសញ្ញា ឬកាត បន្ទាប់មកបើកខេត្តដើម្បីមើលទីកន្លែង ផែនទី និងផ្លូវ។`,
    filterProvinces: "ច្រោះខេត្តតាមតំបន់",
    noProvince: "មិនទាន់មានខេត្តក្នុងតំបន់នេះទេ។",
    bestTimeMissing: "មិនទាន់កត់ត្រាពេលល្អបំផុត",
    provinceMapLabel: "សញ្ញាខេត្ត — ជ្រើសមួយដើម្បីបើក",
    inRegion: (n: number) => `${toKhmerDigits(n)} កំពុងបង្ហាញ`,

    practicalLabel: "ព័ត៌មានជាក់ស្តែង",
    transportLabel: "ការធ្វើដំណើរ",
    transportTitle: "ឡានក្រុង ឡានតូច និងកាលវិភាគ",
    transportLead: (n: number) =>
      `ជម្រើសដែលបានកត់ត្រាចំនួន ${toKhmerDigits(n)} រវាងភ្នំពេញ និងសៀមរាប។ តម្លៃ និងម៉ោងចេញដំណើរប្រែប្រួលញឹកញាប់ សូមបញ្ជាក់ជាមួយក្រុមហ៊ុនមុនពេលធ្វើដំណើរ។`,
    allRoutes: "ផ្លូវទាំងអស់",
    guidesLabel: "មគ្គុទ្ទេសក៍",
    guidesTitle: "ចំណេះដឹងធ្វើដំណើរជាក់ស្តែង",
    guidesLead: "ការរៀបចំ សម្លៀកបំពាក់ ម៉ោងព្រលឹម និងសុជីវធម៌នៅប្រាសាទ។",
    eventsLabel: "ប្រតិទិនវប្បធម៌",
    eventsTitle: "ពិធីបុណ្យ និងការជួបជុំ",
    eventsLead: (n: number) => `ព្រឹត្តិការណ៍ខាងមុខចំនួន ${toKhmerDigits(n)} ក្នុងបញ្ជី។`,

    finaleLabel: "ជំពូក ៥ · ដំណើរកម្សាន្ត",
    finaleTitle: "ផ្លូវដែលបានគូររួចសម្រាប់អ្នក",
    finaleLead: "ផែនការច្រើនថ្ងៃ ដែលរៀបចំពីទីកន្លែងក្នុងខេត្តនីមួយៗ។",
    buildPlan: "បង្កើតផែនការផ្ទាល់ខ្លួន",
    days: (n: number) => `${toKhmerDigits(n)} ថ្ងៃ`,
    budget: "ថវិកា",
    scheduledDays: (n: number) => `កាលវិភាគ ${toKhmerDigits(n)} ថ្ងៃ`,
    noSchedule: "មិនទាន់ផ្សព្វផ្សាយកាលវិភាគប្រចាំថ្ងៃ",
    viewItinerary: "មើលដំណើរកម្សាន្ត",
    day: "ថ្ងៃទី",
    closingTitle: "រឿងរ៉ាវកម្ពុជារបស់អ្នក ចាប់ផ្តើមនៅទីនេះ។",
    closingLead:
      "ជ្រើសកាលបរិច្ឆេទ និងរបៀបធ្វើដំណើរ ហើយកម្មវិធីនឹងរៀបចំផ្លូវប្រចាំថ្ងៃពីបញ្ជី — ទីកន្លែងដែលគ្មានរូបថត ឬម៉ោងបើក ត្រូវបានបង្ហាញយ៉ាងដូច្នោះ។",
    startPlanning: "ចាប់ផ្តើមរៀបចំ",
    suggestPlace: "ស្នើទីកន្លែង",
  },
} satisfies Record<Language, unknown>;

export type JourneyCopy = (typeof COPY)["en"];

const KHMER_DIGITS = ["០", "១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩"];

export function toKhmerDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => KHMER_DIGITS[Number(d)]);
}

/** The copy table plus a numeral formatter that writes Khmer digits in Khmer mode. */
export function useJourneyCopy() {
  const { lang } = useI18n();
  const copy = COPY[lang] as JourneyCopy;
  const num = (value: number | string) => (lang === "km" ? toKhmerDigits(value) : String(value));
  return { lang, copy, num };
}

/** Region filter labels from `region_categories.json`, translated where the id is known. */
export const REGION_LABEL_KM: Record<string, string> = {
  ALL: "ខេត្តទាំងអស់",
  HERITAGE: "បេតិកភណ្ឌ និងប្រាសាទ",
  COASTAL: "ឆ្នេរ និងកោះ",
  HIGHLANDS: "ខ្ពង់រាប និងធម្មជាតិ",
  MEKONG: "មេគង្គ និងកណ្តាល",
};

/** Attraction filter labels from `travel_config.json`, translated where the id is known. */
export const ATTRACTION_TAB_KM: Record<string, string> = {
  ALL: "កន្លែងទាំងអស់",
  TEMPLE: "ប្រាសាទបុរាណ",
  NATURE: "ទឹកធ្លាក់ និងធម្មជាតិ",
  BEACH: "ឆ្នេរ និងតំបន់ឆ្នេរ",
};

/** Place-type labels for the attraction cards. */
export const PLACE_TYPE_KM: Record<string, string> = {
  ATTRACTION: "កន្លែងទេសចរណ៍",
  TEMPLE: "ប្រាសាទ",
  WATERFALL: "ទឹកធ្លាក់",
  BEACH: "ឆ្នេរ",
  NATIONAL_PARK: "ឧទ្យានជាតិ",
  LAKE: "បឹង",
  RESORT: "រមណីយដ្ឋាន",
  MUSEUM: "សារមន្ទីរ",
  MARKET: "ផ្សារ",
  ACTIVITY: "សកម្មភាព",
  HIDDEN_GEM: "កន្លែងលាក់កំបាំង",
};
