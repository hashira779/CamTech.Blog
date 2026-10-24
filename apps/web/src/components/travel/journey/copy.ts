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
    eyebrow: "Kingdom of Cambodia · Travel Collection",
    heroTitleA: "Cambodia,",
    heroTitleB: "beyond the ordinary.",
    heroLead:
      "From ancient Khmer temples to hidden islands, mist-covered highlands, and vibrant riverside cities. Discover the places, people, and experiences that make Cambodia unforgettable.",
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

    finaleLabel: "Chapter VI · Itineraries",
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

    // ── Travel 2.0 additions ──
    featuredLabel: "Featured provinces",
    featuredOpen: "Open hub",
    featuredPick: (name: string) => `Show ${name}`,
    exploreLabel: "Explore Cambodia",
    exploreTitle: "Where to go",
    exploreLead: (n: number) =>
      `All ${n} provincial hubs in the directory. Filter by region or search by name in English or Khmer, then open a hub or start a plan there.`,
    searchProvinces: "Search provinces",
    searchProvincesPh: "Search by name — e.g. Kampot, កំពត",
    planHere: "Plan a trip here",
    showAll: "Show all",
    showFewer: "Show fewer",
    noSearchMatch: (q: string) => `No province matches “${q}”.`,
    clearSearch: "Clear search",
    region: "Region",

    mapLabel2: "Chapter IV · The map",
    mapTitle: "Cambodia on the map",
    mapLead:
      "A real map (OpenStreetMap). Province hubs and attractions sit at the coordinates recorded for them; choose one to preview it and see what is nearby.",
    mapProvinces: "Province hubs",
    mapAttractions: "Attractions",
    mapReset: "Whole country",
    mapZoomIn: "Zoom in",
    mapZoomOut: "Zoom out",
    mapChoose: "Jump to a province",
    mapChooseNone: "Choose a province…",
    mapPreviewEmpty: "Choose a marker, or pick a province from the list, to preview it here.",
    mapLoading: "Loading the map…",
    mapFailed: "The map could not load. Every province and attraction is still listed and linked on this page.",
    mapAttractionsFailed: "Attraction markers could not be loaded; province hubs are shown.",
    nearby: "Nearby (straight-line distance)",
    nearbyNone: "No other plotted places within 60 km.",
    kmAway: (km: string) => `${km} km`,
    directions: "Directions (Google Maps)",
    openPlace: "Open place page",
    straightLineNote: "Distances are straight-line, not road distance or travel time.",
    allTypes: "All types",
    markerCount: (p: number, a: number) => `${p} hubs · ${a} attractions plotted`,

    searchAttractions: "Search attractions",
    noAttractionMatch: (q: string) => `No attraction matches “${q}” in this category.`,
    searchAttractionsPh: "Search temples, waterfalls, islands…",
    loadMore: "Load more",
    loadingMore: "Loading…",
    showingOf: (n: number, total: number) => `Showing ${n} of ${total}`,
    loadFailed: "More attractions could not be loaded right now.",
    searchFailed: "Search is unavailable right now; showing matches from what is already loaded.",
    retry: "Try again",
    featured: "Featured",
    provincePhoto: "Province photo — not of this place",
    aiUnverified: "AI-generated · not verified",
    addToTrip: "Add to trip",
    inTrip: "In your trip",
    tripSaveFailed: "Could not save — this browser is blocking storage.",
    viewTrip: (n: number) => `Your trip · ${n}`,

    cultureLabel: "Chapter V · Culture",
    cultureTitle: "The living soul of Cambodia",
    cultureLead:
      "Stories behind the places — dance, ceremony, food, craft and the temples themselves. Short editorial introductions, not a substitute for local guides and community voices.",
    cultureNote:
      "Editorial overview. Practices differ between regions, communities and families; where a tradition varies, we say so.",
    weddingTitle: "A Khmer wedding, rite by rite",
    weddingLead:
      "A traditional wedding is a sequence of rites, often spread over one to three days. Families choose, shorten and reorder them; this is a common pattern, not a fixed script.",
    weddingStep: "Rite",
    weddingPrev: "Previous rite",
    weddingNext: "Next rite",
    weddingCta: "Khmer wedding invitations on CamTech",
    photoCredit: "Photograph from the directory",
    illustration: "Illustration",
  },
  km: {
    eyebrow: "ព្រះរាជាណាចក្រកម្ពុជា · បណ្ដុំទេសចរណ៍",
    heroTitleA: "កម្ពុជា",
    heroTitleB: "លើសពីភាពធម្មតា។",
    heroLead:
      "ពីប្រាសាទខ្មែរបុរាណ ដល់កោះលាក់កំបាំង ខ្ពង់រាបពពកអ័ព្ទ និងទីក្រុងមាត់ទន្លេដ៏រស់រវើក។ ស្វែងយល់ពីទីកន្លែង មនុស្ស និងបទពិសោធន៍ ដែលធ្វើឲ្យកម្ពុជាមិនអាចបំភ្លេចបាន។",
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

    finaleLabel: "ជំពូក ៦ · ដំណើរកម្សាន្ត",
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

    // ── Travel 2.0 additions ──
    featuredLabel: "ខេត្តពិសេស",
    featuredOpen: "បើកខេត្ត",
    featuredPick: (name: string) => `បង្ហាញ ${name}`,
    exploreLabel: "ស្វែងរកកម្ពុជា",
    exploreTitle: "ទៅណាល្អ",
    exploreLead: (n: number) =>
      `មជ្ឈមណ្ឌលខេត្តទាំង ${toKhmerDigits(n)} ក្នុងបញ្ជី។ ច្រោះតាមតំបន់ ឬស្វែងរកតាមឈ្មោះជាអង់គ្លេស ឬខ្មែរ បន្ទាប់មកបើកខេត្ត ឬចាប់ផ្តើមផែនការនៅទីនោះ។`,
    searchProvinces: "ស្វែងរកខេត្ត",
    searchProvincesPh: "ស្វែងរកតាមឈ្មោះ — ឧ. កំពត, Kampot",
    planHere: "រៀបចំដំណើរនៅទីនេះ",
    showAll: "បង្ហាញទាំងអស់",
    showFewer: "បង្ហាញតិចជាងនេះ",
    noSearchMatch: (q: string) => `គ្មានខេត្តត្រូវនឹង “${q}” ទេ។`,
    clearSearch: "សម្អាតការស្វែងរក",
    region: "តំបន់",

    mapLabel2: "ជំពូក ៤ · ផែនទី",
    mapTitle: "កម្ពុជាលើផែនទី",
    mapLead:
      "ផែនទីពិត (OpenStreetMap)។ ខេត្ត និងកន្លែងទេសចរណ៍ត្រូវបានដាក់តាមកូអរដោនេដែលបានកត់ត្រា។ ជ្រើសមួយដើម្បីមើលព័ត៌មាន និងកន្លែងនៅជិត។",
    mapProvinces: "មជ្ឈមណ្ឌលខេត្ត",
    mapAttractions: "កន្លែងទេសចរណ៍",
    mapReset: "ប្រទេសទាំងមូល",
    mapZoomIn: "ពង្រីក",
    mapZoomOut: "បង្រួម",
    mapChoose: "ទៅកាន់ខេត្ត",
    mapChooseNone: "ជ្រើសខេត្ត…",
    mapPreviewEmpty: "ជ្រើសសញ្ញា ឬជ្រើសខេត្តពីបញ្ជី ដើម្បីមើលនៅទីនេះ។",
    mapLoading: "កំពុងផ្ទុកផែនទី…",
    mapFailed: "មិនអាចផ្ទុកផែនទីបានទេ។ ខេត្ត និងកន្លែងទេសចរណ៍ទាំងអស់នៅតែមានបញ្ជី និងតំណនៅលើទំព័រនេះ។",
    mapAttractionsFailed: "មិនអាចផ្ទុកសញ្ញាកន្លែងទេសចរណ៍បានទេ បង្ហាញតែខេត្ត។",
    nearby: "នៅជិត (ចម្ងាយបន្ទាត់ត្រង់)",
    nearbyNone: "គ្មានកន្លែងផ្សេងទៀតក្នុងរង្វង់ ៦០ គ.ម.។",
    kmAway: (km: string) => `${toKhmerDigits(km)} គ.ម.`,
    directions: "ផ្លូវទៅ (Google Maps)",
    openPlace: "បើកទំព័រកន្លែង",
    straightLineNote: "ចម្ងាយគឺបន្ទាត់ត្រង់ មិនមែនចម្ងាយផ្លូវ ឬរយៈពេលធ្វើដំណើរទេ។",
    allTypes: "គ្រប់ប្រភេទ",
    markerCount: (p: number, a: number) => `ខេត្ត ${toKhmerDigits(p)} · កន្លែងទេសចរណ៍ ${toKhmerDigits(a)}`,

    searchAttractions: "ស្វែងរកកន្លែងទេសចរណ៍",
    noAttractionMatch: (q: string) => `គ្មានកន្លែងទេសចរណ៍ត្រូវនឹង “${q}” ក្នុងប្រភេទនេះទេ។`,
    searchAttractionsPh: "ស្វែងរកប្រាសាទ ទឹកធ្លាក់ កោះ…",
    loadMore: "ផ្ទុកបន្ថែម",
    loadingMore: "កំពុងផ្ទុក…",
    showingOf: (n: number, total: number) => `បង្ហាញ ${toKhmerDigits(n)} នៃ ${toKhmerDigits(total)}`,
    loadFailed: "មិនអាចផ្ទុកកន្លែងទេសចរណ៍បន្ថែមបានទេពេលនេះ។",
    searchFailed: "ការស្វែងរកមិនដំណើរការពេលនេះ បង្ហាញលទ្ធផលពីអ្វីដែលបានផ្ទុករួច។",
    retry: "ព្យាយាមម្តងទៀត",
    featured: "ពិសេស",
    provincePhoto: "រូបថតខេត្ត — មិនមែនទីកន្លែងនេះ",
    aiUnverified: "បង្កើតដោយ AI · មិនទាន់ផ្ទៀងផ្ទាត់",
    addToTrip: "បន្ថែមទៅដំណើរ",
    inTrip: "មានក្នុងដំណើរ",
    tripSaveFailed: "មិនអាចរក្សាទុកបានទេ — កម្មវិធីរុករកកំពុងបិទការផ្ទុក។",
    viewTrip: (n: number) => `ដំណើររបស់អ្នក · ${toKhmerDigits(n)}`,

    cultureLabel: "ជំពូក ៥ · វប្បធម៌",
    cultureTitle: "ព្រលឹងរស់រវើកនៃកម្ពុជា",
    cultureLead:
      "រឿងរ៉ាវនៅពីក្រោយទីកន្លែង — របាំ ពិធី ម្ហូប សិប្បកម្ម និងប្រាសាទ។ ជាការណែនាំខ្លីៗ មិនមែនជំនួសមគ្គុទ្ទេសក៍ និងសំឡេងសហគមន៍ក្នុងស្រុកទេ។",
    cultureNote:
      "ទិដ្ឋភាពទូទៅ។ ទំនៀមទម្លាប់ខុសគ្នាតាមតំបន់ សហគមន៍ និងគ្រួសារ ហើយយើងបញ្ជាក់នៅពេលវាខុសគ្នា។",
    weddingTitle: "អាពាហ៍ពិពាហ៍ខ្មែរ តាមពិធីនីមួយៗ",
    weddingLead:
      "អាពាហ៍ពិពាហ៍ប្រពៃណីជាបណ្ដុំពិធីជាច្រើន ច្រើនតែធ្វើក្នុងរយៈពេលមួយទៅបីថ្ងៃ។ គ្រួសារនីមួយៗជ្រើសរើស បង្រួម ឬប្ដូរលំដាប់ — នេះជាលំនាំទូទៅ មិនមែនជាច្បាប់ថេរទេ។",
    weddingStep: "ពិធី",
    weddingPrev: "ពិធីមុន",
    weddingNext: "ពិធីបន្ទាប់",
    weddingCta: "លិខិតអញ្ជើញអាពាហ៍ពិពាហ៍ខ្មែរ នៅ CamTech",
    photoCredit: "រូបថតពីបញ្ជី",
    illustration: "គំនូរ",
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
