import { FlowerType } from "@/components/wedding/WeddingFlowers";

export interface WeddingTemplateThemeStyles {
  // Page background outside the card
  pageBg: string;
  // Main card paper background
  cardBg: string;
  // Border color around the card
  borderColor: string;
  // Inner hairline border color
  innerBorderColor: string;
  // Accent gradient text (e.g. for "សិរីសួស្តី អាពាហ៍ពិពាហ៍")
  headerGradientText: string;
  // Subtitle text color
  subtitleColor: string;
  // Kbach and flower color
  flowerColor: string;
  // Arch photo frame border & background
  archBorder: string;
  archBg: string;
  // Date banner background & border
  dateBannerBg: string;
  dateBannerBorder: string;
  dateTextColor: string;
  // Countdown pill box
  countdownBoxBg: string;
  countdownBoxBorder: string;
  countdownTextColor: string;
  // Envelope background
  envelopeBg: string;
  envelopeBorder: string;
  // Envelope wax seal
  waxSealBg: string;
  waxSealRing: string;
  waxSealTextColor: string;
  // Primary CTA buttons (Open map, Send blessing)
  primaryButtonBg: string;
  // Secondary buttons (Copy address, QR button)
  secondaryButtonBg: string;
  // Section background bands
  sectionBandBg: string;
}

export interface WeddingTemplateDefinition {
  id: string;
  nameKm: string;
  nameEn: string;
  taglineKm: string;
  taglineEn: string;
  flowerType: FlowerType;
  accentColor: string;
  badgeTextKm: string;
  isPopular?: boolean;
  isNationalFlower?: boolean;
  thumbnailUrl: string;
  defaultCoverImage: string;
  defaultGallery: string[];
  styles: WeddingTemplateThemeStyles;
}

export const WEDDING_TEMPLATES: WeddingTemplateDefinition[] = [
  // 1. Romduol Golden Bloom (Cambodia's National Flower)
  {
    id: "romduol_golden",
    nameKm: "ផ្ការំដួលមាស (ផ្កាតំណាងជាតិ)",
    nameEn: "Romduol Golden Bloom",
    taglineKm: "ផ្កាតំណាងជាតិខ្មែរ រចនាបថមាសរាជវាំង ប្រណីតទន់ភ្លន់",
    taglineEn: "Cambodia's national flower with regal gold & warm ivory silk",
    flowerType: "romduol",
    accentColor: "#c59b27",
    badgeTextKm: "ផ្កាតំណាងជាតិ",
    isNationalFlower: true,
    isPopular: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
    defaultCoverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    defaultGallery: [
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80"
    ],
    styles: {
      pageBg: "bg-[#fbf7f0]",
      cardBg: "bg-[#fffefb]",
      borderColor: "border-[#d4af37]/45",
      innerBorderColor: "border-[#d4af37]/35",
      headerGradientText: "bg-gradient-to-r from-[#996515] via-[#d4af37] to-[#804e0a] bg-clip-text text-transparent",
      subtitleColor: "text-amber-900/90",
      flowerColor: "text-[#c59b27]",
      archBorder: "border-[#d4af37]/60",
      archBg: "bg-gradient-to-b from-[#f5ebd7] via-[#faf6ef] to-[#ebd8a7]",
      dateBannerBg: "bg-gradient-to-r from-[#faf4e8] via-[#f5ebd7] to-[#faf4e8]",
      dateBannerBorder: "border-[#d4af37]/50",
      dateTextColor: "text-amber-950",
      countdownBoxBg: "bg-white",
      countdownBoxBorder: "border-[#d4af37]/40",
      countdownTextColor: "text-amber-950",
      envelopeBg: "bg-gradient-to-b from-[#8f1d2c] via-[#751421] to-[#540d16]",
      envelopeBorder: "border-[#e6c268]/70",
      waxSealBg: "bg-gradient-to-br from-[#f7dc89] via-[#d4af37] to-[#8c5f11]",
      waxSealRing: "border-[#fff3cf]",
      waxSealTextColor: "text-amber-950",
      primaryButtonBg: "bg-gradient-to-r from-[#b37a1e] via-[#c59b27] to-[#996515] hover:brightness-105 text-white",
      secondaryButtonBg: "bg-gradient-to-r from-[#8f1d2c] via-[#751421] to-[#540d16] text-[#fae5a7]",
      sectionBandBg: "bg-[#faf5ec]/50",
    }
  },

  // 2. Royal Crimson Silk
  {
    id: "royal_crimson",
    nameKm: "សូត្រក្រហមរាជវាំង (Royal Crimson)",
    nameEn: "Royal Crimson Silk",
    taglineKm: "ពណ៌ក្រហមសិរីមង្គលរាជវាំង រំលេចក្បាច់ភ្ញីមាសបុរាណខ្មែរ",
    taglineEn: "Auspicious royal crimson with intricate golden filigree",
    flowerType: "kbach",
    accentColor: "#9e1927",
    badgeTextKm: "រាជវាំងបុរាណ",
    isPopular: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80",
    defaultCoverImage: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
    defaultGallery: [
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=800&q=80"
    ],
    styles: {
      pageBg: "bg-[#faf0f1]",
      cardBg: "bg-[#fffefc]",
      borderColor: "border-[#b92b3a]/40",
      innerBorderColor: "border-[#d4af37]/40",
      headerGradientText: "bg-gradient-to-r from-[#8a1320] via-[#c52b3b] to-[#730f1b] bg-clip-text text-transparent",
      subtitleColor: "text-rose-900/90",
      flowerColor: "text-[#b92b3a]",
      archBorder: "border-[#d4af37]/70",
      archBg: "bg-gradient-to-b from-[#fbe3e6] via-[#fff5f6] to-[#f4ccd1]",
      dateBannerBg: "bg-gradient-to-r from-[#fff0f2] via-[#fde2e6] to-[#fff0f2]",
      dateBannerBorder: "border-[#e07584]/60",
      dateTextColor: "text-rose-950",
      countdownBoxBg: "bg-white",
      countdownBoxBorder: "border-[#b92b3a]/30",
      countdownTextColor: "text-rose-950",
      envelopeBg: "bg-gradient-to-b from-[#8f1725] via-[#6e0f1b] to-[#45070f]",
      envelopeBorder: "border-[#f3ce70]/70",
      waxSealBg: "bg-gradient-to-br from-[#f5d57f] via-[#c59b27] to-[#7d5b0d]",
      waxSealRing: "border-[#fff5d6]",
      waxSealTextColor: "text-amber-950",
      primaryButtonBg: "bg-gradient-to-r from-[#9e1927] via-[#ba2a3a] to-[#7f111e] hover:brightness-105 text-white",
      secondaryButtonBg: "bg-gradient-to-r from-[#b37a1e] to-[#996515] text-white",
      sectionBandBg: "bg-[#fdf2f4]/60",
    }
  },

  // 3. Sacred Lotus Blessing
  {
    id: "lotus_blessing",
    nameKm: "បុប្ផាផ្កាឈូកមង្គល (Lotus Blessing)",
    nameEn: "Sacred Lotus Pink & Gold",
    taglineKm: "ផ្កាឈូកបរិសុទ្ធ និមិត្តរូបនៃសេចក្តីស្រឡាញ់ដ៏ស្មោះត្រង់ និងសុភមង្គល",
    taglineEn: "Pure blooming lotus petals symbolizing eternal devotion",
    flowerType: "lotus",
    accentColor: "#d94e6b",
    badgeTextKm: "ផ្កាឈូកមង្គល",
    isPopular: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80",
    defaultCoverImage: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80",
    defaultGallery: [
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80"
    ],
    styles: {
      pageBg: "bg-[#fbf4f6]",
      cardBg: "bg-[#fffdfd]",
      borderColor: "border-[#d94e6b]/35",
      innerBorderColor: "border-[#d4af37]/30",
      headerGradientText: "bg-gradient-to-r from-[#b32b4b] via-[#e65c7d] to-[#991d39] bg-clip-text text-transparent",
      subtitleColor: "text-rose-800/90",
      flowerColor: "text-[#d94e6b]",
      archBorder: "border-[#f4a0b2]/70",
      archBg: "bg-gradient-to-b from-[#fde8ed] via-[#fff4f6] to-[#fcd1dc]",
      dateBannerBg: "bg-gradient-to-r from-[#fff3f5] via-[#fde4e9] to-[#fff3f5]",
      dateBannerBorder: "border-[#f49bb0]/50",
      dateTextColor: "text-rose-950",
      countdownBoxBg: "bg-white",
      countdownBoxBorder: "border-[#f49bb0]/40",
      countdownTextColor: "text-rose-950",
      envelopeBg: "bg-gradient-to-b from-[#8f2840] via-[#751b31] to-[#4d0f1e]",
      envelopeBorder: "border-[#f9c5d1]/60",
      waxSealBg: "bg-gradient-to-br from-[#fbcfe8] via-[#e11d48] to-[#9f1239]",
      waxSealRing: "border-[#ffe4e6]",
      waxSealTextColor: "text-white",
      primaryButtonBg: "bg-gradient-to-r from-[#d94e6b] via-[#e65c7d] to-[#b32b4b] hover:brightness-105 text-white",
      secondaryButtonBg: "bg-gradient-to-r from-[#8f2840] to-[#540d16] text-[#fce7f3]",
      sectionBandBg: "bg-[#fff1f4]/60",
    }
  },

  // 4. Angkor Emerald & Gold
  {
    id: "emerald_angkor",
    nameKm: "ត្បូងមរកតអង្គរ (Angkor Emerald)",
    nameEn: "Angkor Emerald & Gold",
    taglineKm: "ពណ៌ត្បូងមរកតរាជវាំងអង្គរ រំលេចមាសទឹកដប់ ថ្លៃថ្នូរ និងអមតៈ",
    taglineEn: "Imperial emerald jade with heritage Khmer gold leaf",
    flowerType: "kbach",
    accentColor: "#1b6b52",
    badgeTextKm: "ត្បូងមរកតអង្គរ",
    thumbnailUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80",
    defaultCoverImage: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80",
    defaultGallery: [
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80"
    ],
    styles: {
      pageBg: "bg-[#f2f7f4]",
      cardBg: "bg-[#fdfefe]",
      borderColor: "border-[#1b6b52]/40",
      innerBorderColor: "border-[#d4af37]/35",
      headerGradientText: "bg-gradient-to-r from-[#124d3b] via-[#1b6b52] to-[#0c392b] bg-clip-text text-transparent",
      subtitleColor: "text-emerald-900/90",
      flowerColor: "text-[#1b6b52]",
      archBorder: "border-[#d4af37]/65",
      archBg: "bg-gradient-to-b from-[#d8ebe3] via-[#f2f8f5] to-[#c2dfd3]",
      dateBannerBg: "bg-gradient-to-r from-[#edf6f2] via-[#ddede5] to-[#edf6f2]",
      dateBannerBorder: "border-[#1b6b52]/35",
      dateTextColor: "text-emerald-950",
      countdownBoxBg: "bg-white",
      countdownBoxBorder: "border-[#1b6b52]/30",
      countdownTextColor: "text-emerald-950",
      envelopeBg: "bg-gradient-to-b from-[#134939] via-[#0d3429] to-[#062018]",
      envelopeBorder: "border-[#e0c477]/70",
      waxSealBg: "bg-gradient-to-br from-[#f3dc91] via-[#c59b27] to-[#7f5d0d]",
      waxSealRing: "border-[#fff8e1]",
      waxSealTextColor: "text-amber-950",
      primaryButtonBg: "bg-gradient-to-r from-[#1b6b52] via-[#228566] to-[#124d3b] hover:brightness-105 text-white",
      secondaryButtonBg: "bg-gradient-to-r from-[#b37a1e] to-[#804e0a] text-white",
      sectionBandBg: "bg-[#eaf4ef]/60",
    }
  },

  // 5. Champagne Pearl Luxury
  {
    id: "champagne_pearl",
    nameKm: "គុជខ្យងសំពៅមាស (Champagne Pearl)",
    nameEn: "Champagne Pearl Luxury",
    taglineKm: "រចនាបថទំនើបបែប Minimalist គុជខ្យង និងក្បូរក្បាច់មាស hairline",
    taglineEn: "Modern minimalist ivory pearl with delicate champagne filigree",
    flowerType: "jasmine",
    accentColor: "#a38234",
    badgeTextKm: "ទំនើប Luxury",
    thumbnailUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=600&q=80",
    defaultCoverImage: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80",
    defaultGallery: [
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80"
    ],
    styles: {
      pageBg: "bg-[#f8f6f0]",
      cardBg: "bg-[#fffdf8]",
      borderColor: "border-[#c4a65c]/40",
      innerBorderColor: "border-[#c4a65c]/30",
      headerGradientText: "bg-gradient-to-r from-[#876a24] via-[#bfa054] to-[#735719] bg-clip-text text-transparent",
      subtitleColor: "text-stone-800",
      flowerColor: "text-[#bfa054]",
      archBorder: "border-[#d8be7c]/60",
      archBg: "bg-gradient-to-b from-[#f7f0df] via-[#fffcf5] to-[#ece1c5]",
      dateBannerBg: "bg-gradient-to-r from-[#faf6eb] via-[#f4ecd8] to-[#faf6eb]",
      dateBannerBorder: "border-[#c4a65c]/40",
      dateTextColor: "text-stone-900",
      countdownBoxBg: "bg-white",
      countdownBoxBorder: "border-[#c4a65c]/35",
      countdownTextColor: "text-stone-900",
      envelopeBg: "bg-gradient-to-b from-[#4a3f35] via-[#382f27] to-[#261f19]",
      envelopeBorder: "border-[#d8be7c]/70",
      waxSealBg: "bg-gradient-to-br from-[#edd89f] via-[#c4a65c] to-[#806526]",
      waxSealRing: "border-[#fff5db]",
      waxSealTextColor: "text-amber-950",
      primaryButtonBg: "bg-gradient-to-r from-[#876a24] via-[#bfa054] to-[#735719] hover:brightness-105 text-white",
      secondaryButtonBg: "bg-gradient-to-r from-[#382f27] to-[#211b16] text-[#f7f0df]",
      sectionBandBg: "bg-[#f7f3e8]/50",
    }
  },

  // 6. Sweet Jasmine Garland
  {
    id: "jasmine_garland",
    nameKm: "ផ្កាម្លិះសួស្តី (Sweet Jasmine)",
    nameEn: "Sweet Jasmine White & Gold",
    taglineKm: "ផ្កាម្លិះក្រអូបសោភា និមិត្តរូបនៃកម្រងផ្កាចងដៃ និងពរជ័យមេបា",
    taglineEn: "Auspicious wedding jasmine garlands with white & gentle gold",
    flowerType: "jasmine",
    accentColor: "#bfa134",
    badgeTextKm: "ផ្កាម្លិះពរជ័យ",
    thumbnailUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=600&q=80",
    defaultCoverImage: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=1200&q=80",
    defaultGallery: [
      "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80"
    ],
    styles: {
      pageBg: "bg-[#fbfbf6]",
      cardBg: "bg-[#ffffff]",
      borderColor: "border-[#cfb655]/40",
      innerBorderColor: "border-[#e3ce7d]/35",
      headerGradientText: "bg-gradient-to-r from-[#947817] via-[#cfb655] to-[#78600d] bg-clip-text text-transparent",
      subtitleColor: "text-stone-800",
      flowerColor: "text-[#d1b958]",
      archBorder: "border-[#e0cc7e]/70",
      archBg: "bg-gradient-to-b from-[#fbf8ea] via-[#ffffff] to-[#f4ecd2]",
      dateBannerBg: "bg-gradient-to-r from-[#faf7ed] via-[#f3edd5] to-[#faf7ed]",
      dateBannerBorder: "border-[#d8c36b]/40",
      dateTextColor: "text-stone-900",
      countdownBoxBg: "bg-white",
      countdownBoxBorder: "border-[#d8c36b]/35",
      countdownTextColor: "text-stone-900",
      envelopeBg: "bg-gradient-to-b from-[#6b5820] via-[#544414] to-[#3b2f0a]",
      envelopeBorder: "border-[#fae99d]/70",
      waxSealBg: "bg-gradient-to-br from-[#fff2b0] via-[#d4af37] to-[#8c7118]",
      waxSealRing: "border-[#fffde6]",
      waxSealTextColor: "text-amber-950",
      primaryButtonBg: "bg-gradient-to-r from-[#947817] via-[#bfa134] to-[#78600d] hover:brightness-105 text-white",
      secondaryButtonBg: "bg-gradient-to-r from-[#544414] to-[#2e2406] text-[#faf7ed]",
      sectionBandBg: "bg-[#faf8f0]/60",
    }
  },

  // 7. Divine Apsara Romance
  {
    id: "apsara_divine",
    nameKm: "ទេពអប្សរាសិរី (Divine Apsara)",
    nameEn: "Divine Apsara Romance",
    taglineKm: "សម្រស់ទេពអប្សរាសួគ៌ាលម្អដោយក្បាច់ឆ្លាក់បុរាណ និងទឹកមាសរលោង",
    taglineEn: "Angkorian celestial grace with antique copper & gold luster",
    flowerType: "romduol",
    accentColor: "#b45309",
    badgeTextKm: "ក្បាច់ទេពអប្សរា",
    thumbnailUrl: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=600&q=80",
    defaultCoverImage: "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=80",
    defaultGallery: [
      "https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80"
    ],
    styles: {
      pageBg: "bg-[#fcf8f2]",
      cardBg: "bg-[#fffdfa]",
      borderColor: "border-[#b45309]/35",
      innerBorderColor: "border-[#d97706]/35",
      headerGradientText: "bg-gradient-to-r from-[#92400e] via-[#d97706] to-[#78350f] bg-clip-text text-transparent",
      subtitleColor: "text-amber-950/90",
      flowerColor: "text-[#b45309]",
      archBorder: "border-[#d97706]/65",
      archBg: "bg-gradient-to-b from-[#fde6cd] via-[#fff5eb] to-[#f7cfab]",
      dateBannerBg: "bg-gradient-to-r from-[#fef3e7] via-[#fae4ce] to-[#fef3e7]",
      dateBannerBorder: "border-[#d97706]/40",
      dateTextColor: "text-amber-950",
      countdownBoxBg: "bg-white",
      countdownBoxBorder: "border-[#b45309]/30",
      countdownTextColor: "text-amber-950",
      envelopeBg: "bg-gradient-to-b from-[#7c2d12] via-[#5b1f0c] to-[#3a1306]",
      envelopeBorder: "border-[#fcd34d]/70",
      waxSealBg: "bg-gradient-to-br from-[#fde68a] via-[#d97706] to-[#92400e]",
      waxSealRing: "border-[#fef3c7]",
      waxSealTextColor: "text-stone-950",
      primaryButtonBg: "bg-gradient-to-r from-[#92400e] via-[#b45309] to-[#78350f] hover:brightness-105 text-white",
      secondaryButtonBg: "bg-gradient-to-r from-[#5b1f0c] to-[#2c0e05] text-[#fef3e7]",
      sectionBandBg: "bg-[#fef5ec]/60",
    }
  },

  // 8. Sunset Terracotta Romance
  {
    id: "sunset_terracotta",
    nameKm: "សូរិយាលម្អ (Sunset Terracotta)",
    nameEn: "Sunset Terracotta Romance",
    taglineKm: "ពន្លឺថ្ងៃរៀបលិចដ៏រ៉ូមែនទិក ពណ៌ដីឥដ្ឋខ្មែរ និងពន្លឺមាសកក់ក្តៅ",
    taglineEn: "Warm earthy terracotta with golden sunset glow",
    flowerType: "lotus",
    accentColor: "#c2410c",
    badgeTextKm: "សូរិយារ៉ូមែនទិក",
    thumbnailUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80",
    defaultCoverImage: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80",
    defaultGallery: [
      "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80"
    ],
    styles: {
      pageBg: "bg-[#faf4ef]",
      cardBg: "bg-[#fffdfb]",
      borderColor: "border-[#c2410c]/35",
      innerBorderColor: "border-[#ea580c]/30",
      headerGradientText: "bg-gradient-to-r from-[#9a3412] via-[#ea580c] to-[#7c2d12] bg-clip-text text-transparent",
      subtitleColor: "text-orange-950/90",
      flowerColor: "text-[#ea580c]",
      archBorder: "border-[#ea580c]/60",
      archBg: "bg-gradient-to-b from-[#fed7aa] via-[#fff7ed] to-[#fdba74]",
      dateBannerBg: "bg-gradient-to-r from-[#ffedd5] via-[#fed7aa]/70 to-[#ffedd5]",
      dateBannerBorder: "border-[#ea580c]/35",
      dateTextColor: "text-orange-950",
      countdownBoxBg: "bg-white",
      countdownBoxBorder: "border-[#ea580c]/30",
      countdownTextColor: "text-orange-950",
      envelopeBg: "bg-gradient-to-b from-[#831843] via-[#701a75] to-[#4a044e]",
      envelopeBorder: "border-[#fed7aa]/70",
      waxSealBg: "bg-gradient-to-br from-[#ffedd5] via-[#ea580c] to-[#9a3412]",
      waxSealRing: "border-[#ffedd5]",
      waxSealTextColor: "text-white",
      primaryButtonBg: "bg-gradient-to-r from-[#9a3412] via-[#c2410c] to-[#7c2d12] hover:brightness-105 text-white",
      secondaryButtonBg: "bg-gradient-to-r from-[#701a75] to-[#4a044e] text-[#ffedd5]",
      sectionBandBg: "bg-[#fff7ed]/60",
    }
  },

  // 9. Midnight Starlight Navy
  {
    id: "midnight_starlight",
    nameKm: "រាត្រីតារារះ (Midnight Starlight)",
    nameEn: "Midnight Starlight Navy",
    taglineKm: "រាត្រីជប់លៀងដ៏ឧត្តុង្គឧត្តម ពណ៌ខៀវទឹកប៊ិចរាត្រីរំលេចពន្លឺតារាមាស",
    taglineEn: "Deep twilight sapphire gala banquet with glittering gold starlight",
    flowerType: "jasmine",
    accentColor: "#1e3a8a",
    badgeTextKm: "រាត្រីជប់លៀង",
    thumbnailUrl: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=600&q=80",
    defaultCoverImage: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80",
    defaultGallery: [
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80"
    ],
    styles: {
      pageBg: "bg-[#f0f4f9]",
      cardBg: "bg-[#ffffff]",
      borderColor: "border-[#1e3a8a]/35",
      innerBorderColor: "border-[#d4af37]/40",
      headerGradientText: "bg-gradient-to-r from-[#172554] via-[#1e40af] to-[#0f172a] bg-clip-text text-transparent",
      subtitleColor: "text-blue-950/90",
      flowerColor: "text-[#1e40af]",
      archBorder: "border-[#d4af37]/65",
      archBg: "bg-gradient-to-b from-[#dbeafe] via-[#f0f7ff] to-[#bfdbfe]",
      dateBannerBg: "bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-[#eff6ff]",
      dateBannerBorder: "border-[#1e40af]/30",
      dateTextColor: "text-blue-950",
      countdownBoxBg: "bg-white",
      countdownBoxBorder: "border-[#1e40af]/30",
      countdownTextColor: "text-blue-950",
      envelopeBg: "bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#020617]",
      envelopeBorder: "border-[#fde047]/70",
      waxSealBg: "bg-gradient-to-br from-[#fef08a] via-[#ca8a04] to-[#713f12]",
      waxSealRing: "border-[#fef9c3]",
      waxSealTextColor: "text-slate-950",
      primaryButtonBg: "bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#0f172a] hover:brightness-110 text-white",
      secondaryButtonBg: "bg-gradient-to-r from-[#b37a1e] to-[#804e0a] text-white",
      sectionBandBg: "bg-[#f0f7ff]/60",
    }
  },

  // 10. Royal Orchid Lavender
  {
    id: "orchid_elegance",
    nameKm: "ផ្កាអ័រគីដេវាំង (Royal Orchid)",
    nameEn: "Royal Orchid Elegance",
    taglineKm: "ផ្កាអ័រគីដេព្រៃខ្មែរពណ៌ស្វាយផ្អែមល្ហែម និងមាសស្រាលលំដាប់ Luxury",
    taglineEn: "Wild royal orchid lavender mist with platinum gold",
    flowerType: "orchid",
    accentColor: "#7e22ce",
    badgeTextKm: "អ័រគីដេវាំង",
    thumbnailUrl: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=600&q=80",
    defaultCoverImage: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80",
    defaultGallery: [
      "https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80"
    ],
    styles: {
      pageBg: "bg-[#f8f5fc]",
      cardBg: "bg-[#fffefe]",
      borderColor: "border-[#7e22ce]/30",
      innerBorderColor: "border-[#d4af37]/35",
      headerGradientText: "bg-gradient-to-r from-[#581c87] via-[#7e22ce] to-[#3b0764] bg-clip-text text-transparent",
      subtitleColor: "text-purple-950/90",
      flowerColor: "text-[#7e22ce]",
      archBorder: "border-[#c084fc]/65",
      archBg: "bg-gradient-to-b from-[#f3e8ff] via-[#faf5ff] to-[#e9d5ff]",
      dateBannerBg: "bg-gradient-to-r from-[#faf5ff] via-[#f3e8ff] to-[#faf5ff]",
      dateBannerBorder: "border-[#a855f7]/35",
      dateTextColor: "text-purple-950",
      countdownBoxBg: "bg-white",
      countdownBoxBorder: "border-[#a855f7]/30",
      countdownTextColor: "text-purple-950",
      envelopeBg: "bg-gradient-to-b from-[#4c1d95] via-[#3b0764] to-[#2e1065]",
      envelopeBorder: "border-[#e9d5ff]/60",
      waxSealBg: "bg-gradient-to-br from-[#f3e8ff] via-[#9333ea] to-[#581c87]",
      waxSealRing: "border-[#fae8ff]",
      waxSealTextColor: "text-white",
      primaryButtonBg: "bg-gradient-to-r from-[#581c87] via-[#7e22ce] to-[#3b0764] hover:brightness-105 text-white",
      secondaryButtonBg: "bg-gradient-to-r from-[#b37a1e] to-[#804e0a] text-white",
      sectionBandBg: "bg-[#faf5ff]/60",
    }
  }
];

export function getTemplateById(id?: string): WeddingTemplateDefinition {
  if (!id) return WEDDING_TEMPLATES[0];
  const found = WEDDING_TEMPLATES.find((t) => t.id === id);
  return found || WEDDING_TEMPLATES[0];
}
