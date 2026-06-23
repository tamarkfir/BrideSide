/* ============================================================================
 *  פריסת הפרחים (קישוטים) לכל קבוצת עמודים.
 *
 *  אפשר לסדר ויזואלית באפליקציה: היכנסי ל-/session?decor=1 (או לחצי על כפתור
 *  "🌿 פרחים" בפינה במצב פיתוח), גררי / שני גודל / סובבי, ואז "העתק פריסה".
 *  הדביקי לי את ה-JSON ואני אקבע אותו כאן כברירת מחדל לכולן.
 *
 *  x,y — מיקום מרכז הפרח באחוזים מתוך העמוד (0–100; אפשר מעט שלילי/מעל 100
 *        כדי ש"ייגלוש" מעבר לקצה). w — רוחב בפיקסלים. rot — סיבוב במעלות.
 * ========================================================================== */

export type Deco = { src: string; x: number; y: number; w: number; rot: number };
export type DecoLayout = Record<string, Deco[]>;

/** כל הפרחים הזמינים — לבורר ה"הוספה" בעורך */
export const BOTANICALS = [
  "/botanicals/daisy-cream.png",
  "/botanicals/daisy-red.png",
  "/botanicals/fern-sprig.png",
  "/botanicals/fern-frond.png",
  "/botanicals/flower-yellow.png",
  "/botanicals/flower-cream.png",
  "/botanicals/bouquet-purple.png",
  "/botanicals/sprig-pink.png",
  "/botanicals/hydrangea-ochre.png",
  "/botanicals/petal-pink.png",
  "/textures/paper-blush-torn.png",
  "/textures/paper-cream-torn.png",
  "/textures/paper-newsprint.png",
  "/textures/paper-handwriting.png",
];

export const DEFAULT_DECOR: DecoLayout = {
  Landing: [
    { src: "/botanicals/daisy-cream.png", x: -8, y: 8, w: 160, rot: -12 },
    { src: "/botanicals/fern-sprig.png", x: 108, y: 85, w: 180, rot: 6 },
  ],
  היכרות: [
    { src: "/botanicals/daisy-cream.png", x: 8, y: 6, w: 270, rot: -12 },
    { src: "/botanicals/fern-sprig.png", x: 92, y: 96, w: 300, rot: 6 },
  ],
  העמקה: [
    { src: "/botanicals/petal-pink.png", x: 8, y: 6, w: 210, rot: 6 },
    { src: "/botanicals/fern-frond.png", x: 92, y: 96, w: 320, rot: -6 },
  ],
  "מסורת וחתונה": [
    { src: "/botanicals/daisy-red.png", x: 8, y: 6, w: 250, rot: -6 },
    { src: "/botanicals/hydrangea-ochre.png", x: 92, y: 96, w: 320, rot: 3 },
  ],
  "דמיינו את הטקס": [
    { src: "/botanicals/flower-yellow.png", x: 8, y: 6, w: 230, rot: -12 },
    { src: "/botanicals/bouquet-purple.png", x: 92, y: 96, w: 320, rot: -3 },
  ],
  "כתיבת טקסטים": [
    { src: "/botanicals/flower-cream.png", x: 8, y: 6, w: 240, rot: 6 },
    { src: "/botanicals/sprig-pink.png", x: 92, y: 96, w: 330, rot: 6 },
  ],

  // --- הספרון (השלב השני) ---
  // עמוד השער — עיצוב קבוע (וכן תמונה אם הזוג העלתה לפחות אחת). פרחים קטנים יותר
  // כדי לא להתחרות בתמונה ובכותרת.
  "ספרון · שער": [
    { src: "/botanicals/daisy-cream.png", x: 8, y: 8, w: 175, rot: -12 },
    { src: "/botanicals/fern-frond.png", x: 92, y: 93, w: 230, rot: 6 },
  ],
  // תבניות העיצוב לעמודי התוכן — נפרשות שווה-בשווה על פני הספרון.
  "ספרון · א": [
    { src: "/botanicals/daisy-cream.png", x: 8, y: 6, w: 270, rot: -12 },
    { src: "/botanicals/fern-sprig.png", x: 92, y: 96, w: 300, rot: 6 },
  ],
  "ספרון · ב": [
    { src: "/botanicals/petal-pink.png", x: 8, y: 6, w: 210, rot: 6 },
    { src: "/botanicals/fern-frond.png", x: 92, y: 96, w: 320, rot: -6 },
  ],
  "ספרון · ג": [
    { src: "/botanicals/daisy-red.png", x: 8, y: 6, w: 250, rot: -6 },
    { src: "/botanicals/hydrangea-ochre.png", x: 92, y: 96, w: 320, rot: 3 },
  ],
};

/**
 * קבוצות הסגנון של עמודי השאלון — אלו ה"עיצובים" שמהם הספרון בוחר אקראית
 * (כל עמוד בספרון מקבל את אחד הסגנונות האלה, יציב לפי מספר העמוד).
 */
export const GROUP_VARIANTS = [
  "היכרות",
  "העמקה",
  "מסורת וחתונה",
  "דמיינו את הטקס",
  "כתיבת טקסטים",
] as const;

/** עיצוב השער של הספרון — קבוע (תמיד אותו עיצוב, ועם תמונה אם הזוג העלתה אחת). */
export const BOOKLET_COVER = "ספרון · שער";

/** תבניות העיצוב לעמודי התוכן בספרון — מה שמסדרים פעם אחת נפרש שווה-בשווה. */
export const BOOKLET_TEMPLATES = ["ספרון · א", "ספרון · ב", "ספרון · ג"];

/**
 * הסגנון לעמוד ספרון לפי מספרו:
 * עמוד 0 = השער (עיצוב קבוע); שאר העמודים מחזוריים שווה-בשווה על התבניות,
 * כך שכל תבנית מופיעה באותה תדירות ואין שני עמודים סמוכים זהים.
 */
export function bookletVariant(pageIndex: number): string {
  if (pageIndex <= 0) return BOOKLET_COVER;
  return BOOKLET_TEMPLATES[(pageIndex - 1) % BOOKLET_TEMPLATES.length];
}

/** מפתח ה-localStorage לפריסה שהמשתמשת שמרה */
export const DECOR_STORAGE_KEY = "brideside:decor";
