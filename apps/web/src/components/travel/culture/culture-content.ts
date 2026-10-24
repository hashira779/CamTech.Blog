/**
 * Editorial copy for the culture chapter, in both languages.
 *
 * Kept deliberately general and checkable: UNESCO inscriptions and years, widely documented
 * forms and terms. Anything that varies — the order of wedding rites, festival dates, regional
 * dishes — is described as varying. Photographs are only the directory's own, and each says what
 * it shows.
 */

export interface CultureTopic {
  id: string;
  title: { en: string; km: string };
  body: { en: string; km: string };
  /** A directory photograph, or none — topics without one stay typographic. */
  photo?: { src: string; caption: { en: string; km: string } };
  link?: { href: string; label: { en: string; km: string } };
}

export const CULTURE_TOPICS: CultureTopic[] = [
  {
    id: "architecture",
    title: { en: "Temple architecture", km: "ស្ថាបត្យកម្មប្រាសាទ" },
    body: {
      en: "From pre-Angkorian Sambor Prei Kuk (7th century) to Angkor, built between the 9th and 15th centuries, Khmer temples model the cosmic mountain Meru in sandstone, laterite and brick. Angkor (1992), Preah Vihear (2008), Sambor Prei Kuk (2017) and Koh Ker (2023) are UNESCO World Heritage sites.",
      km: "ចាប់ពីសំបូរព្រៃគុកសម័យមុនអង្គរ (សតវត្សទី៧) រហូតដល់អង្គរ ដែលសាងសង់ចន្លោះសតវត្សទី៩ ដល់ទី១៥ ប្រាសាទខ្មែរតំណាងភ្នំព្រះសុមេរុ ដោយថ្មភក់ ថ្មបាយក្រៀម និងឥដ្ឋ។ អង្គរ (១៩៩២) ព្រះវិហារ (២០០៨) សំបូរព្រៃគុក (២០១៧) និងកោះកេរ (២០២៣) ជាសម្បត្តិបេតិកភណ្ឌពិភពលោករបស់ UNESCO។",
    },
    photo: {
      src: "/images/places/banteay-srei.jpg",
      caption: { en: "Banteay Srei, Siem Reap", km: "បន្ទាយស្រី សៀមរាប" },
    },
    link: { href: "/travel/siem-reap", label: { en: "Siem Reap hub", km: "ខេត្តសៀមរាប" } },
  },
  {
    id: "dance",
    title: { en: "Classical dance", km: "របាំបុរាណ" },
    body: {
      en: "The Royal Ballet of Cambodia — dancers in gilded costume, hands curved into gestures that each carry meaning — was proclaimed by UNESCO in 2003 and inscribed on its Intangible Cultural Heritage list in 2008. The apsaras carved across Angkor's walls are its oldest record.",
      km: "របាំព្រះរាជទ្រព្យ — អ្នករបាំក្នុងសម្លៀកបំពាក់មាស និងកាយវិការដៃដែលមានអត្ថន័យនីមួយៗ — ត្រូវបាន UNESCO ប្រកាសនៅឆ្នាំ២០០៣ និងចុះក្នុងបញ្ជីបេតិកភណ្ឌវប្បធម៌អរូបីនៅឆ្នាំ២០០៨។ រូបអប្សរាដែលឆ្លាក់លើជញ្ជាំងអង្គរ ជាកំណត់ត្រាចាស់បំផុតរបស់វា។",
    },
  },
  {
    id: "music",
    title: { en: "Traditional music", km: "តន្ត្រីប្រពៃណី" },
    body: {
      en: "The pinpeat ensemble of gongs, xylophones, oboe and drums accompanies court dance and religious ceremony; the mahori ensemble plays for celebrations. Chapei dang veng, sung storytelling to a long-necked lute, was inscribed by UNESCO in 2016 as heritage in need of urgent safeguarding.",
      km: "វង់ភ្លេងពិណពាទ្យ ដែលមានគង រនាត ស្រឡៃ និងស្គរ អមរបាំព្រះរាជទ្រព្យ និងពិធីសាសនា ចំណែកវង់ភ្លេងមហោរីលេងក្នុងពិធីបុណ្យ។ ចាប៉ីដងវែង ការច្រៀងនិទានរឿងអមដោយចាប៉ី ត្រូវបាន UNESCO ចុះបញ្ជីនៅឆ្នាំ២០១៦ ជាបេតិកភណ្ឌដែលត្រូវការការពារជាបន្ទាន់។",
    },
  },
  {
    id: "food",
    title: { en: "Food & markets", km: "ម្ហូប និងផ្សារ" },
    body: {
      en: "Rice and freshwater fish from the Tonlé Sap and Mekong are the base. Kroeung — a pounded paste of lemongrass, galangal, turmeric and kaffir lime — and prahok, fermented fish, give Khmer cooking its depth. Recipes shift between provinces and households; markets are where to taste the differences.",
      km: "បាយ និងត្រីទឹកសាបពីទន្លេសាប និងទន្លេមេគង្គ ជាមូលដ្ឋាន។ គ្រឿង — ស្លឹកគ្រៃ រំដេង រមៀត និងស្លឹកក្រូចសើចបុកចូលគ្នា — និងប្រហុក ផ្តល់រសជាតិជ្រាលជ្រៅដល់ម្ហូបខ្មែរ។ រូបមន្តប្រែប្រួលតាមខេត្ត និងគ្រួសារ ហើយផ្សារគឺជាកន្លែងល្អបំផុតដើម្បីភ្លក់ភាពខុសគ្នា។",
    },
    photo: {
      src: "/images/places/siem-reap-old-market.jpg",
      caption: { en: "Old Market (Phsar Chas), Siem Reap", km: "ផ្សារចាស់ សៀមរាប" },
    },
  },
  {
    id: "silk",
    title: { en: "Silk & craft", km: "សូត្រ និងសិប្បកម្ម" },
    body: {
      en: "Hol, silk woven from tie-dyed threads so the pattern forms on the loom, and the smooth phamuong are made in weaving villages along the Mekong, such as Koh Dach near Phnom Penh. Stone and wood carving, silverwork and pottery — Kampong Chhnang means “port of clay pots” — carry the same patience.",
      km: "សូត្រហូល ត្បាញពីអំបោះចងជ្រលក់ពណ៌ ដើម្បីឲ្យក្បាច់កើតឡើងលើកី និងសូត្រផាមួង ផលិតនៅភូមិត្បាញតាមដងទន្លេមេគង្គ ដូចជាកោះដាច់ ក្បែរភ្នំពេញ។ ការឆ្លាក់ថ្ម និងឈើ គ្រឿងប្រាក់ និងគ្រឿងស្មូន — ឈ្មោះខេត្តកំពង់ឆ្នាំង ខ្លួនឯងសំដៅលើកំពង់នៃឆ្នាំងដី — ទាមទារការអត់ធ្មត់ដូចគ្នា។",
    },
    link: { href: "/travel/kampong-chhnang", label: { en: "Kampong Chhnang hub", km: "ខេត្តកំពង់ឆ្នាំង" } },
  },
  {
    id: "festivals",
    title: { en: "Festivals", km: "ពិធីបុណ្យ" },
    body: {
      en: "Khmer New Year falls in mid-April; Pchum Ben, when families honour their ancestors at the pagoda, comes in September or October; the Water Festival, Bon Om Touk, fills the riverfronts with boat races in October or November. Most dates follow the lunar calendar and move every year.",
      km: "ចូលឆ្នាំខ្មែរ ធ្លាក់នៅពាក់កណ្ដាលខែមេសា។ ភ្ជុំបិណ្ឌ ពេលគ្រួសារឧទ្ទិសដល់ដូនតានៅវត្ត ធ្លាក់ក្នុងខែកញ្ញា ឬតុលា។ បុណ្យអុំទូក បណ្ដែតប្រទីប និងសំពះព្រះខែ ធ្វើឡើងក្នុងខែតុលា ឬវិច្ឆិកា។ កាលបរិច្ឆេទភាគច្រើនតាមចន្ទគតិ ហើយផ្លាស់ប្ដូររៀងរាល់ឆ្នាំ។",
    },
    link: { href: "#tv-events", label: { en: "Cultural calendar", km: "ប្រតិទិនវប្បធម៌" } },
  },
];

export interface WeddingRite {
  km: string;
  en: string;
  romanized: string;
  body: { en: string; km: string };
}

/** A common sequence. Families keep, merge, drop and reorder rites; the copy says so. */
export const WEDDING_RITES: WeddingRite[] = [
  {
    km: "ពិធីសូត្រមន្ត",
    romanized: "Soat Mon",
    en: "Blessing by monks",
    body: {
      en: "Monks chant blessings for the couple and their families, often early on the first morning, and receive offerings of food.",
      km: "ព្រះសង្ឃសូត្រមន្តប្រសិទ្ធិពរដល់គូស្វាមីភរិយា និងគ្រួសារ ជាញឹកញាប់នៅព្រឹកព្រលឹមថ្ងៃដំបូង ហើយទទួលចង្ហាន់។",
    },
  },
  {
    km: "ពិធីហែជំនូន",
    romanized: "Hai Chumnoun",
    en: "The groom's procession",
    body: {
      en: "The groom's family walks to the bride's home carrying trays of fruit, sweets and gifts, announced by music. The number and contents of the trays differ from family to family.",
      km: "ក្រុមគ្រួសារកូនកំលោះដើរហែទៅផ្ទះកូនក្រមុំ ដោយកាន់ថាសផ្លែឈើ នំចំណី និងជំនូន អមដោយតន្ត្រី។ ចំនួន និងរបស់ក្នុងថាស ខុសគ្នាតាមគ្រួសារ។",
    },
  },
  {
    km: "ពិធីកាត់សក់",
    romanized: "Kat Sak",
    en: "Hair-cutting",
    body: {
      en: "A symbolic trim, often performed with song and humour, cleanses the couple and prepares them for married life. Relatives may each take a turn.",
      km: "ការកាត់សក់ជានិមិត្តរូប ច្រើនតែអមដោយចម្រៀង និងការលេងសើច ដើម្បីសម្អាតគូស្វាមីភរិយា និងរៀបចំពួកគេសម្រាប់ជីវិតរួម។ សាច់ញាតិអាចឆ្លាស់វេនគ្នាកាត់។",
    },
  },
  {
    km: "ពិធីបង្វិលពពិល",
    romanized: "Bangvel Popil",
    en: "Passing the popil",
    body: {
      en: "Married relatives sit in a circle around the couple and pass the popil — a candle on a leaf-shaped holder — hand to hand, wafting its smoke toward the couple as a blessing.",
      km: "សាច់ញាតិដែលរៀបការហើយ អង្គុយជារង្វង់ជុំវិញគូស្វាមីភរិយា ហើយបង្វិលពពិល — ទៀនលើជើងទម្រង់ស្លឹក — ពីដៃមួយទៅដៃមួយ ហើយបក់ផ្សែងទៅរកគូស្វាមីភរិយា ជាការប្រសិទ្ធិពរ។",
    },
  },
  {
    km: "ពិធីចងដៃ",
    romanized: "Sampeah Chong Dai",
    en: "Tying the wrists",
    body: {
      en: "Elders and guests tie blessed threads around the couple's wrists, each with a spoken wish. It is often the central moment, and the one guests most often join.",
      km: "ចាស់ទុំ និងភ្ញៀវចងអំបោះឆ្វាក់លើកដៃគូស្វាមីភរិយា ព្រមទាំងជូនពរ។ វាជាពេលសំខាន់បំផុត និងជាពិធីដែលភ្ញៀវចូលរួមច្រើនជាងគេ។",
    },
  },
  {
    km: "ពិធីព្រះថោងតោងស្បៃនាងនាគ",
    romanized: "Preah Thong Tong Sbai Neang Neak",
    en: "Preah Thong holds Neang Neak's sash",
    body: {
      en: "The groom holds the end of the bride's sash as they enter the room together, recalling the legend of Prince Preah Thong and the naga princess Neang Neak, told as an origin of the Khmer people.",
      km: "កូនកំលោះកាន់ចុងស្បៃកូនក្រមុំ ពេលពួកគេចូលបន្ទប់ជាមួយគ្នា រំលឹកដល់រឿងព្រេងព្រះថោង និងនាងនាគ ដែលនិទានថាជាប្រភពនៃជនជាតិខ្មែរ។",
    },
  },
];
