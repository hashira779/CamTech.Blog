/* Places in the wedding-hall scene where a couple can put their own kbach
   ornament image instead of the scene's drawing. Mirrors ORNAMENT_SLOTS in
   apps/wedding-service/schemas.py. A transparent PNG (or WebP) works best:
   whatever is see-through shows the hall behind it. */

export const ORNAMENT_SLOTS = [
  "stage_arch",
  "stage_center",
  "wall_panel",
  "post_strip",
  "border",
  "pendant",
  "gable",
  "naga",
  "wall_pattern",
  "flower",
] as const;

export type OrnamentSlot = (typeof ORNAMENT_SLOTS)[number];

/** Uploaded image link per place; a place left out keeps the drawing */
export type WeddingOrnaments = Partial<Record<OrnamentSlot, string>>;

export interface OrnamentSlotInfo {
  slot: OrnamentSlot;
  km: string;
  en: string;
  hintKm: string;
  hintEn: string;
  /** Preview box shape in the editor */
  shape: "wide" | "tall" | "square";
  /** Repeated (tiled) rather than placed once */
  tiles?: boolean;
}

export const ORNAMENT_SLOT_INFO: OrnamentSlotInfo[] = [
  {
    slot: "stage_arch", km: "ក្លោងទ្វារឆាក", en: "Stage arch", shape: "wide",
    hintKm: "ក្លោងទ្វារធំនៅពីក្រោយកូនកម្លោះកូនក្រមុំ។ PNG ទទឹង មានកណ្តាលថ្លា ល្អបំផុត។",
    hintEn: "The big gilded arch behind the couple. A wide PNG with a see-through centre works best.",
  },
  {
    slot: "stage_center", km: "ក្បាច់កណ្តាលឆាក", en: "Stage centrepiece", shape: "square",
    hintKm: "កណ្តាលផ្ទាំងឆាក (ពេលមិនទាន់មានរូបគូស្វាមីភរិយា)។ PNG ការ៉េ។",
    hintEn: "Centre of the stage backdrop, shown when there's no couple photo. Square PNG.",
  },
  {
    slot: "wall_panel", km: "ក្បាច់ផ្ទាំងជញ្ជាំង", en: "Wall panels", shape: "tall",
    hintKm: "លើផ្ទាំងមាសតាមជញ្ជាំងទាំងសងខាង និងលើក្បាលសសរទ្វារ។ PNG បញ្ឈរ (រាងស្លឹកពោធិ៍ល្អ)។",
    hintEn: "On the gold panels along both walls and atop the gate posts. Tall PNG; teardrop shapes suit it.",
  },
  {
    slot: "post_strip", km: "ក្បាច់សសរទ្វារ", en: "Gate posts", shape: "tall", tiles: true,
    hintKm: "រត់ចុះតាមសសរទ្វារទាំងពីរ ហើយបន្តដដែលៗ។ PNG បញ្ឈរតូចចង្អៀត។",
    hintEn: "Runs down both gate posts, repeating. Tall, narrow PNG.",
  },
  {
    slot: "border", km: "ក្បាច់ស៊ុម", en: "Border", shape: "wide", tiles: true,
    hintKm: "បន្ទះតាមធ្នឹមទ្វារ ធ្នឹមសាល ឆាក និងជញ្ជាំង បន្តដដែលៗតាមទទឹង។ PNG ជាបន្ទះវែង។",
    hintEn: "The band along the gate lintel, beams, stage and walls, repeating sideways. Wide strip PNG.",
  },
  {
    slot: "pendant", km: "ក្បាច់ព្យួរ", en: "Hanging pendant", shape: "tall",
    hintKm: "ព្យួរជាជួរក្រោមធ្នឹមទ្វារ និងធ្នឹមសាល។ PNG បញ្ឈរ ផ្នែកខាងលើជាកន្លែងព្យួរ។",
    hintEn: "Hangs in a row under the lintel and beams. Tall PNG; its top edge is where it hangs.",
  },
  {
    slot: "gable", km: "ក្បាច់ហោជាង", en: "Gable ornament", shape: "square",
    hintKm: "នៅកណ្តាលហោជាងដំបូលសាល និងលើទ្វារធំ។ PNG ការ៉េ។",
    hintEn: "In the hall's roof gable and over the gate. Square PNG.",
  },
  {
    slot: "naga", km: "ក្បាលនាគ", en: "Naga head", shape: "square",
    hintKm: "នៅជើងហោជាងដំបូល។ ក្បាលបែរទៅឆ្វេង (ខាងស្តាំនឹងបង្វិលដោយស្វ័យប្រវត្តិ)។",
    hintEn: "At the feet of the roof gable. Facing left; the right one is mirrored for you.",
  },
  {
    slot: "wall_pattern", km: "ក្បាច់ផ្ទាំងក្រោយឆាក", en: "Back wall pattern", shape: "square", tiles: true,
    hintKm: "បន្តដដែលៗពេញជញ្ជាំងនៅពីក្រោយឆាក។ PNG ការ៉េ ដែលភ្ជាប់គ្នាបានរលូន។",
    hintEn: "Tiles across the wall behind the stage. A square tile that repeats seamlessly.",
  },
  {
    slot: "flower", km: "ផ្កាចន្ទ", en: "Small flower", shape: "square",
    hintKm: "នៅលើពិដាន ផ្លូវដើរ សសរ និងជញ្ជាំង។ PNG ការ៉េតូច។",
    hintEn: "On the ceiling, aisle, columns and walls. Small square PNG.",
  },
];
