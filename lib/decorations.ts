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

import type { CeremonySection, PhotoItem } from "@/lib/types";

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
    {
      src: "/botanicals/daisy-cream.png",
      x: 0,
      y: 21,
      w: 160,
      rot: -12
    },
    {
      src: "/textures/paper-newsprint.png",
      x: 106,
      y: 93,
      w: 174,
      rot: 18
    },
    {
      src: "/botanicals/paper-newsprint.png",
      x: 107,
      y: 97,
      w: 220,
      rot: 0
    }
  ],
  "היכרות": [
    {
      src: "/botanicals/fern-sprig.png",
      x: 12,
      y: 77,
      w: 434,
      rot: -106
    },
    {
      src: "/botanicals/daisy-cream.png",
      x: 20,
      y: 94,
      w: 111,
      rot: -12
    }
  ],
  "העמקה": [
    {
      src: "/botanicals/spiky-leaf.png",
      x: 9,
      y: 76,
      w: 220,
      rot: 0
    },
    {
      src: "/botanicals/pink-dry-flower.png",
      x: 21,
      y: 89,
      w: 220,
      rot: -180
    }
  ],
  "מסורת וחתונה": [
    {
      src: "/botanicals/flower-yellow.png",
      x: 8,
      y: 6,
      w: 133,
      rot: 0
    },
    {
      src: "/botanicals/thorns.png",
      x: 19,
      y: 83,
      w: 640,
      rot: -106
    }
  ],
  "דמיינו את הטקס": [
    {
      src: "/botanicals/purple-twig.png",
      x: 10,
      y: 88,
      w: 439,
      rot: -95
    },
    {
      src: "/botanicals/chill-leaves.png",
      x: 25,
      y: 97,
      w: 220,
      rot: 0
    }
  ],
  "כתיבת טקסטים": [
    {
      src: "/botanicals/chill-leaves.png",
      x: 14,
      y: 2,
      w: 206,
      rot: 92
    },
    {
      src: "/botanicals/daisy-pink.png",
      x: 17,
      y: 11,
      w: 184,
      rot: 0
    }
  ],
  "ספרון · שער": [
    {
      src: "/botanicals/daisy-cream.png",
      x: 74,
      y: 36,
      w: 101,
      rot: -12
    },
    {
      src: "/botanicals/fern-frond.png",
      x: 75,
      y: 18,
      w: 230,
      rot: 6
    },
    {
      src: "/botanicals/daisy-red.png",
      x: 52,
      y: 36,
      w: 132,
      rot: 0
    },
    {
      src: "/textures/paper-handwriting.png",
      x: -8,
      y: 45,
      w: 465,
      rot: -105
    },
    {
      src: "/textures/paper-cream-torn.png",
      x: 110,
      y: 99,
      w: 220,
      rot: 0
    },
    {
      src: "/textures/paper-blush-torn.png",
      x: 12,
      y: -2,
      w: 284,
      rot: -180
    }
  ],
  "ספרון · עמוס בפרחים א": [
    {
      src: "/botanicals/flower-cream.png",
      x: 12,
      y: 11,
      w: 97,
      rot: -30
    }
  ],
  "ספרון · עמוס בפרחים ב": [
    {
      src: "/botanicals/sprig-pink.png",
      x: 72,
      y: 73,
      w: 640,
      rot: -115
    },
    {
      src: "/botanicals/daisy-red.png",
      x: 9,
      y: 11,
      w: 111,
      rot: 0
    }
  ],
  "ספרון · עמוס בפרחים ג": [
    {
      src: "/botanicals/sprig-pink.png",
      x: 72,
      y: 73,
      w: 640,
      rot: -115
    },
    {
      src: "/botanicals/daisy-red.png",
      x: 50,
      y: 50,
      w: 111,
      rot: 0
    }
  ],
  "ספרון · מעט פרחים א": [
    {
      src: "/botanicals/fern-frond.png",
      x: 3,
      y: 87,
      w: 215,
      rot: -35
    }
  ],
  "ספרון · מעט פרחים ב": [
    {
      src: "/botanicals/flower-cream.png",
      x: 88,
      y: 89,
      w: 97,
      rot: -30
    }
  ],
  "ספרון · מעט פרחים ג": [],
  "ספרון · בלי פרחים כמעט א": [],
  "ספרון · בלי פרחים כמעט ב": [],
  "רקע ספרון": [
    {
      src: "/textures/very-texured-page.png",
      x: 50,
      y: 50,
      w: 220,
      rot: 0
    }
  ],
  "סיכום": [
    {
      src: "/botanicals/sprig-pink.png",
      x: 25,
      y: 84,
      w: 562,
      rot: -75
    }
  ]
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
  "סיכום",
] as const;

/** עיצוב השער של הספרון — קבוע (תמיד אותו עיצוב, ועם תמונה אם הזוג העלתה אחת). */
export const BOOKLET_COVER = "ספרון · שער";

/** תבניות העיצוב לעמודי התוכן בספרון לפי דחיסות (מעט תוכן = עמוס בפרחים) */
export const BOOKLET_TEMPLATES = {
  highDecor: [
    "ספרון · עמוס בפרחים א", 
    "ספרון · עמוס בפרחים ב", 
    "ספרון · עמוס בפרחים ג",
    "היכרות",
    "העמקה",
    "מסורת וחתונה"
  ],
  mediumDecor: [
    "ספרון · מעט פרחים א", 
    "ספרון · מעט פרחים ב", 
    "ספרון · מעט פרחים ג",
    "דמיינו את הטקס",
    "כתיבת טקסטים",
    "סיכום"
  ],
  lowDecor: [
    "ספרון · בלי פרחים כמעט א", 
    "ספרון · בלי פרחים כמעט ב"
  ]
};

/**
 * בחירת תבנית לפי מספר עמוד וצפיפות התוכן (טקסט ותמונה)
 */
export function bookletVariant(pageIndex: number, section?: CeremonySection, photo?: PhotoItem): string {
  if (pageIndex <= 0) return BOOKLET_COVER;
  
  // Calculate Density
  let score = section ? section.body.length : 0;
  if (photo) score += 300; // Photos take up significant space
  
  let density: keyof typeof BOOKLET_TEMPLATES = "highDecor"; // Default to high decor (sparse text)
  if (score > 350) density = "lowDecor";
  else if (score > 150) density = "mediumDecor";

  // Pick pseudo-randomly but deterministically based on page index
  const templates = BOOKLET_TEMPLATES[density];
  return templates[(pageIndex - 1) % templates.length];
}

/** מפתח ה-localStorage לפריסה שהמשתמשת שמרה */
export const DECOR_STORAGE_KEY = "brideside:decor";
