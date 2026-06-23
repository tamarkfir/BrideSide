/* ============================================================================
 *  BrideSide — מערך בדיקה של זוגות לדוגמה
 * ============================================================================
 *
 *  שלושה זוגות מנוגדים בכוונה, כדי לוודא שה-AI מייצר ספרון שונה ורלוונטי
 *  לכל זוג — שמתואם לתשובות שלהן. כל זוג כולל:
 *    answers — תשובות מלאות לשאלון (לפי מזהי השדות ב-questionnaire.ts)
 *    checks  — מילים שחייבות / אסור שיופיעו בספרון, ומילים "רכות" (אינדיקציה)
 *
 *  להריץ: npx tsx scripts/test-couples.mts   (דורש GEMINI_API_KEY ב-.env.local)
 *  התוצרים נשמרים ב-test-output/ להשוואה חוזרת בעתיד.
 *
 *  להוסיף זוג: הוסיפי אובייקט ל-TEST_COUPLES באותו מבנה.
 * ========================================================================== */

import { QUESTIONNAIRE } from "./questionnaire";
import { initialState } from "./state";
import type { Answer, SessionState } from "./types";

export type CoupleSpec = {
  id: string;
  nameA: string;
  nameB: string;
  /** תיאור קצר של הפרופיל — לקריאות בדוח */
  profile: string;
  /** תשובות לפי מזהה שדה. מנהגים: המפתח הוא `traditions__<מנהג>` */
  answers: Record<string, Answer>;
  checks: {
    /** חייב להופיע בספרון (בדיקה קשה) */
    include: string[];
    /** אסור שיופיע בספרון (בדיקה קשה) */
    exclude: string[];
    /** אינדיקציה לקורלציה — מדווח אך לא מפיל את הבדיקה */
    soft: string[];
  };
};

/** מיפוי מזהה-שדה → אינדקס העמוד בשאלון */
function fieldPageIndex(): Record<string, number> {
  const map: Record<string, number> = {};
  QUESTIONNAIRE.forEach((page, i) => page.fields.forEach((f) => (map[f.id] = i)));
  return map;
}

/** בונה SessionState מלא מתוך מפרט זוג */
export function buildCoupleState(spec: CoupleSpec): SessionState {
  const state = initialState(spec.nameA, spec.nameB);
  const idx = fieldPageIndex();
  for (const [key, ans] of Object.entries(spec.answers)) {
    const baseId = key.includes("__") ? key.split("__")[0] : key;
    const pageIndex = idx[baseId];
    if (pageIndex === undefined) continue;
    state.pages[pageIndex].answers[key] = ans;
  }
  return state;
}

export const TEST_COUPLES: CoupleSpec[] = [
  /* ---------- זוג 1: מסורתי-דתי, משפחות נוכחות ---------- */
  {
    id: "shira-michal",
    nameA: "שירה",
    nameB: "מיכל",
    profile: "מסורתי יהודי מלא · חופה · רבה רפורמית · משפחות וקהילה נוכחות",
    answers: {
      meeting: {
        text: "נפגשנו דרך חברה משותפת בארוחת שישי. שירה הגיעה מאוחר, מיכל שמרה לה מקום, וכבר לא קמנו מהשולחן. זה היה לפני ארבע שנים.",
      },
      realized: {
        bride: {
          a: "כשמיכל החזיקה לי את היד בבית החולים כשאמא שלי אושפזה, ידעתי.",
          b: "כשראיתי את שירה שרה לסבתא שלי בשבת, הלב שלי נפתח.",
        },
      },
      superpowers: { list: ["מתמודדות יחד עם משברים", "יוצרות בית חם", "מקשיבות באמת"] },
      songs: { list: ["עוד יבוא שלום עלינו", "אני ואתה נשנה את העולם - אריק איינשטיין"] },
      weddingMeaning: {
        bride: {
          a: "ברית קודש לפני המשפחה והקהילה.",
          b: "להכריז על האהבה שלנו בתוך המסורת שגדלתי בה.",
        },
      },
      chuppahMeaning: { text: "הבית שאנחנו בונות, רגע של קדושה ושמחה, מוקפות באהבה." },
      religionRole: {
        text: "מסורתי לגמרי. אנחנו שומרות מסורת ורוצות טקס יהודי מלא, בלשון נקבה.",
      },
      audience: {
        text: "המשפחות הקרובות, הסבים והסבתות, וכל הקהילה. חשוב לנו שההורים יהיו לידנו.",
      },
      entrance: { choice: "כל אחת עם ההורים שלה" },
      entranceSong: { text: "עוד יבוא שלום עלינו" },
      willChuppah: { yesno: "yes", note: "חופה מסורתית עם טלית של סבא." },
      standing: { text: "ההורים והאחים שלנו יעמדו איתנו תחת החופה." },
      officiant: { choice: "רב.ה רפורמי.ת או קונסרבטיבי.ת", note: "רבה רפורמית שמכירה אותנו." },
      traditions__חופה: { choice: "in", note: "טלית של סבא" },
      traditions__טבעות: { choice: "in" },
      "traditions__שבירת כוס": { choice: "in", note: "זכר לירושלים" },
      "traditions__שבע ברכות": { choice: "in", note: "שבע נשים קרובות יברכו" },
      traditions__כתובה: { choice: "in", note: "כתובה שוויונית" },
      traditions__הקפות: { choice: "maybe" },
      "traditions__ריקוד ראשון": { choice: "in" },
      "traditions__ברכת הורים": { choice: "in" },
      audienceUnderstand: {
        text: "שאנחנו ממשיכות מסורת ובונות ממנה משהו שלנו, ושזו אהבה עמוקה.",
      },
      textsApproach: { choice: "לראות נוסח יהודי מסורתי בלשון נקבה, ולערוך אותו" },
      blessingsPeople: { list: ["ברכה זו לזו", "הורים", "סבא וסבתא"] },
      loveAbout: {
        bride: {
          a: "אני אוהבת את השקט והביטחון שמיכל מביאה.",
          b: "אני אוהבת את החום והשירה של שירה.",
        },
      },
      vows: {
        bride: {
          a: "אני מבטיחה להיות הבית שלך ולשמור על האמונה והאהבה שלנו.",
          b: "אני מבטיחה לשיר איתך גם בימים הקשים.",
        },
      },
      anythingElse: { text: "נרצה להזכיר את סבתא של מיכל שכבר לא איתנו." },
    },
    checks: {
      include: ["חופה", "ברכ"],
      exclude: ["חתן"],
      soft: ["שבע ברכות", "כוס", "כתובה", "שלום עלינו", "קהילה"],
    },
  },

  /* ---------- זוג 2: חילוני-אינטימי, רק חברות (בודק שלא ממציאים משפחה) ---------- */
  {
    id: "dana-yael",
    nameA: "דנה",
    nameB: "יעל",
    profile: "חילוני · בלי חופה · מנחה חבר · קהל קטן של חברות בלבד · משפחה לא מוזכרת",
    answers: {
      meeting: {
        text: "נפגשנו בלימודים, בספרייה, מעל אותו ספר. דנה ביקשה עט, יעל נתנה לה את העט ואת המספר.",
      },
      realized: {
        bride: {
          a: "כשטיילנו בצפון ויעל לא הפסיקה לצחוק, ידעתי שזה הבית שלי.",
          b: "כשדנה החזיקה אותי אחרי יום קשה בלי לשאול שאלות.",
        },
      },
      superpowers: { list: ["מצחיקות אחת את השנייה", "נותנות מרחב", "חולמות בגדול"] },
      songs: { list: ["First Day of My Life - Bright Eyes", "The Luckiest - Ben Folds"] },
      weddingMeaning: {
        bride: {
          a: "הבטחה אישית, בלי קשר לאף מוסד.",
          b: "חגיגה קטנה של מי שאנחנו.",
        },
      },
      chuppahMeaning: { text: "פחות טקס, יותר רגע אמיתי מתחת לשמיים פתוחים." },
      religionRole: {
        text: "חילוני לגמרי. רוחני אולי, בלי דת ממוסדת ובלי טקסים דתיים.",
      },
      audience: {
        text: "קהל קטן ואינטימי, רק החברות והחברים הכי קרובים. בלי הרבה אנשים.",
      },
      entrance: { choice: "יחד, אחת לצד השנייה" },
      entranceSong: { text: "First Day of My Life - Bright Eyes" },
      willChuppah: { yesno: "no", note: "מתחת לעץ, בלי חופה פורמלית." },
      standing: { text: "שתי החברות הכי קרובות שלנו." },
      officiant: { choice: "חבר או חברה קרובים", note: "חבר ותיק שמכיר אותנו שנים." },
      traditions__חופה: { choice: "out" },
      traditions__טבעות: { choice: "in" },
      "traditions__שבירת כוס": { choice: "out" },
      "traditions__שבע ברכות": { choice: "out" },
      traditions__כתובה: { choice: "out" },
      traditions__הקפות: { choice: "out" },
      "traditions__ריקוד ראשון": { choice: "in", note: "ריקוד יחף" },
      "traditions__ברכת הורים": { choice: "out" },
      audienceUnderstand: {
        text: "שאנחנו צוות, שאנחנו מצחיקות ואמיתיות, ושזו אהבה פשוטה.",
      },
      textsApproach: { choice: "לבנות הכול מההתחלה, במילים שלנו" },
      blessingsPeople: { list: ["ברכה זו לזו", "חברות קרובות"] },
      loveAbout: {
        bride: {
          a: "אני אוהבת איך יעל הופכת כל יום רגיל למשהו.",
          b: "אני אוהבת את הראש הפתוח של דנה.",
        },
      },
      vows: {
        bride: {
          a: "אני מבטיחה לצחוק איתך ולתת לך מרחב.",
          b: "אני מבטיחה להיות הבית הבטוח שלך.",
        },
      },
      anythingElse: { text: "" },
    },
    checks: {
      include: ["חבר"],
      // אסור: ברכות דתיות, לשון זכר, והמצאת משפחה (לא הוזכרה)
      exclude: ["שבע ברכות", "חתן", "הורים", "אמא", "אבא"],
      soft: ["Bright Eyes", "Ben Folds", "עץ", "צחוק"],
    },
  },

  /* ---------- זוג 3: שילוב מזרחי-חילוני, שתי משפחות תומכות ---------- */
  {
    id: "avigail-roni",
    nameA: "אביגיל",
    nameB: "רוני",
    profile: "שילוב מסורת מזרחית וחילוניות · חופה · הקפות · מנחה אזרחי · שתי משפחות תומכות",
    answers: {
      meeting: {
        text: "נפגשנו בעבודה, שתינו במשמרת לילה. רוני הביאה קפה, אביגיל הביאה סיפורים, ומאז אנחנו ביחד.",
      },
      realized: {
        bride: {
          a: "כשרוני רקדה איתי בחתונה של אחי, ידעתי.",
          b: "כשאביגיל בישלה לי את האוכל של סבתא שלי.",
        },
      },
      superpowers: { list: ["יוצרות בית חם", "יודעות לתקן אחרי ריב", "חולמות בגדול"] },
      songs: { list: ["הפרח בגני - זוהר ארגוב", "שביל הזהב - ריטה"] },
      weddingMeaning: {
        bride: {
          a: "חיבור בין המסורת המזרחית של המשפחה שלי לבין מי שאנחנו.",
          b: "יום שמח עם שתי המשפחות שלנו.",
        },
      },
      chuppahMeaning: { text: "התחלה חדשה, מתוך הכבוד למקום שממנו באנו." },
      religionRole: {
        text: "מסורת לצד חידוש. אנחנו אוהבות אלמנטים מסורתיים אבל לא רוצות טקס דתי לגמרי.",
      },
      audience: {
        text: "קהל בינוני, שתי המשפחות שלנו — ההורים, הסבים, האחים — וחברים קרובים. המשפחות שלנו תומכות מאוד.",
      },
      entrance: { choice: "עם אדם אהוב שמלווה", note: "כל אחת עם אמא שלה." },
      entranceSong: { text: "הפרח בגני - זוהר ארגוב" },
      willChuppah: { yesno: "yes", note: "חופה עם בד רקום של סבתא." },
      standing: { text: "ההורים והאחים, וחברה קרובה." },
      officiant: { choice: "מנחה טקסים אזרחי", note: "מנחה שמשלבת קטעים מסורתיים." },
      traditions__חופה: { choice: "in", note: "בד רקום של סבתא" },
      traditions__טבעות: { choice: "in" },
      "traditions__שבירת כוס": { choice: "maybe" },
      "traditions__שבע ברכות": { choice: "maybe" },
      traditions__כתובה: { choice: "out" },
      traditions__הקפות: { choice: "in", note: "שבע הקפות יחד" },
      "traditions__ריקוד ראשון": { choice: "in" },
      "traditions__ברכת הורים": { choice: "in" },
      audienceUnderstand: {
        text: "שאנחנו מחברות בין עולמות, ושהמשפחות שלנו חלק מהסיפור.",
      },
      textsApproach: { choice: "שילוב — קצת מסורת וטקסטים קיימים, הרבה שלנו" },
      blessingsPeople: { list: ["הורים", "אחים ואחיות", "ברכה זו לזו"] },
      loveAbout: {
        bride: {
          a: "אני אוהבת איך רוני מחבקת את המשפחה שלי כאילו היא שלה.",
          b: "אני אוהבת את השורשים והחום של אביגיל.",
        },
      },
      vows: {
        bride: {
          a: "אני מבטיחה לכבד מאיפה שבאת ולבנות איתך חדש.",
          b: "אני מבטיחה לרקוד איתך בכל שמחה.",
        },
      },
      anythingElse: { text: "נשמח לשלב ברכה בערבית מסבתא של אביגיל." },
    },
    checks: {
      include: ["חופה", "משפח"],
      exclude: ["חתן"],
      soft: ["הקפות", "ארגוב", "ריטה", "ערבית", "מסורת"],
    },
  },

  /* ---------- זוג 4: בין-דתי (יהודית + נוצרית) — מכבד שתי מסורות ---------- */
  {
    id: "tal-mary",
    nameA: "טל",
    nameB: "מרי",
    profile: "בין-דתי · טל יהודייה, מרי ממשפחה נוצרית · שילוב שתי מסורות בלי לבחור אחת",
    answers: {
      meeting: {
        text: "נפגשנו בטיול בפורטוגל, באכסניה. טל ניגנה בגיטרה, מרי שרה איתה, ולמחרת כבר טיילנו יחד.",
      },
      realized: {
        bride: {
          a: "כשמרי הדליקה איתי נרות שבת בלי שביקשתי, ידעתי.",
          b: "כשטל באה איתי לכנסייה בחג המולד והחזיקה לי את היד.",
        },
      },
      superpowers: { list: ["מכבדות את ההבדלים", "יוצרות בית חם", "מקשיבות באמת"] },
      songs: { list: ["Hallelujah - Leonard Cohen", "Ave Maria"] },
      weddingMeaning: {
        bride: {
          a: "להביא את המסורת היהודית שגדלתי בה אל תוך החיים שלנו.",
          b: "לכבד את האמונה הנוצרית של המשפחה שלי לצד מי שאנחנו.",
        },
      },
      chuppahMeaning: { text: "מקום שבו שתי מסורות נפגשות בלי לבטל אחת את השנייה." },
      religionRole: {
        text: "שתי מסורות — יהודית ונוצרית. אנחנו רוצות לכבד את שתיהן, בלי לבחור אחת על פני השנייה.",
      },
      audience: {
        text: "שתי המשפחות — היהודית של טל והנוצרית של מרי — וחברים משתי הקהילות.",
      },
      entrance: { choice: "כל אחת עם ההורים שלה" },
      entranceSong: { text: "Hallelujah - Leonard Cohen" },
      willChuppah: { yesno: "yes", note: "חופה יהודית, ולצידה קריאה מהמסורת הנוצרית." },
      standing: { text: "ההורים משתי המשפחות." },
      officiant: {
        choice: "רב.ה רפורמי.ת או קונסרבטיבי.ת",
        note: "רבה רפורמית, ולצידה ברכה מכומרת מהכנסייה של מרי.",
      },
      traditions__חופה: { choice: "in" },
      traditions__טבעות: { choice: "in" },
      "traditions__שבירת כוס": { choice: "in" },
      "traditions__שבע ברכות": { choice: "maybe" },
      traditions__כתובה: { choice: "maybe" },
      traditions__הקפות: { choice: "out" },
      "traditions__ריקוד ראשון": { choice: "in" },
      "traditions__ברכת הורים": { choice: "in" },
      audienceUnderstand: {
        text: "שאהבה יכולה לגשר בין שתי מסורות ושתי משפחות.",
      },
      textsApproach: { choice: "שילוב — קצת מסורת וטקסטים קיימים, הרבה שלנו" },
      blessingsPeople: { list: ["הורים", "ברכה זו לזו", "חברות קרובות"] },
      loveAbout: {
        bride: {
          a: "אני אוהבת איך מרי סקרנית כלפי העולם שלי.",
          b: "אני אוהבת את הפתיחות והחום של טל.",
        },
      },
      vows: {
        bride: {
          a: "אני מבטיחה לכבד את האמונה שלך כמו את שלי.",
          b: "אני מבטיחה לבנות איתך בית שיש בו מקום לשתינו.",
        },
      },
      anythingElse: {
        text: "נשמח לשלב קריאה מהברית החדשה לצד פסוק עברי, ולכבד את שתי המשפחות.",
      },
    },
    checks: {
      include: ["חופה"],
      exclude: ["חתן"],
      soft: ["נוצרי", "יהודי", "שתי מסורות", "כומר", "Hallelujah"],
    },
  },

  /* ---------- זוג 5: משפחה מנותקת / "המשפחה שבחרנו" — מבחן חזק לכלל "אל תניחי משפחה חמה" ---------- */
  {
    id: "eden-shahar",
    nameA: "עדן",
    nameB: "שחר",
    profile:
      "חילוני · עדן מנותקת מהוריה ולא בקשר · 'המשפחה שבחרנו' — חברים בלבד · בלי אזכור הורים",
    answers: {
      meeting: {
        text: "נפגשנו בקבוצת תמיכה לקהילה הגאה. עדן הביאה עוגה, שחר הביאה גיטרה, ומאז אנחנו בית אחת לשנייה.",
      },
      realized: {
        bride: {
          a: "כששחר נשארה לישון על הספה שלי כשהיה לי קשה, בלי לשאול כלום.",
          b: "כשעדן בנתה איתי סוכות והרגשתי שיש לי משפחה.",
        },
      },
      superpowers: { list: ["יוצרות בית חם", "נותנות מרחב", "יודעות לתקן אחרי ריב"] },
      songs: { list: ["True Colors - Cyndi Lauper", "מה אברך - "] },
      weddingMeaning: {
        bride: {
          a: "להכריז שמשפחה זה מה שבונים, לא רק מה שנולדים אליו.",
          b: "לחגוג את הבית שיצרנו עם האנשים שבחרנו.",
        },
      },
      chuppahMeaning: { text: "מעגל של אהבה שאנחנו עצמנו בנינו." },
      religionRole: { text: "חילוני לגמרי. בלי מסורת דתית ובלי טקסים דתיים." },
      audience: {
        text: "המשפחה שבחרנו — החברים הקרובים שהפכו למשפחה. עדן מנותקת מהוריה ולא בקשר איתם, וזה בסדר. בלי הורים בטקס.",
      },
      entrance: { choice: "יחד, אחת לצד השנייה" },
      entranceSong: { text: "True Colors - Cyndi Lauper" },
      willChuppah: { yesno: "no", note: "בלי חופה דתית — מעגל של חברים סביבנו." },
      standing: { text: "החברים הכי קרובים שלנו, המשפחה שבחרנו." },
      officiant: { choice: "חבר או חברה קרובים", note: "חברה שמכירה את שתינו שנים." },
      traditions__חופה: { choice: "out" },
      traditions__טבעות: { choice: "in" },
      "traditions__שבירת כוס": { choice: "out" },
      "traditions__שבע ברכות": { choice: "out" },
      traditions__כתובה: { choice: "out" },
      traditions__הקפות: { choice: "out" },
      "traditions__ריקוד ראשון": { choice: "in" },
      "traditions__ברכת הורים": { choice: "out" },
      audienceUnderstand: {
        text: "שאהבה ומשפחה זה מה שבונים, ושהאנשים סביבנו הם הבית שלנו.",
      },
      textsApproach: { choice: "לבנות הכול מההתחלה, במילים שלנו" },
      blessingsPeople: { list: ["ברכה זו לזו", "חברות קרובות"] },
      loveAbout: {
        bride: {
          a: "אני אוהבת איך שחר עושה שאני מרגישה בבית.",
          b: "אני אוהבת את האומץ של עדן.",
        },
      },
      vows: {
        bride: {
          a: "אני מבטיחה להיות המשפחה שלך, תמיד.",
          b: "אני מבטיחה לבנות איתך את הבית שתמיד רצינו.",
        },
      },
      anythingElse: {
        text: "חשוב לנו להוקיר את החברים שהיו לנו למשפחה. בבקשה בלי אזכור של ההורים של עדן.",
      },
    },
    checks: {
      include: ["חבר"],
      // אסור: ברכות דתיות; "חתן" כמובן. מילות משפחה ב-soft כדי לראות אם המודל המציא הורים.
      exclude: ["חתן", "שבע ברכות"],
      soft: ["הורים", "אמא", "אבא", "בחרנו", "חברים"],
    },
  },

  /* ---------- זוג 6: תשובות מינימליות — מבחן שהמודל לא ממציא ---------- */
  {
    id: "libi-rotem",
    nameA: "ליבי",
    nameB: "רותם",
    profile: "תשובות מעטות בלבד — בודק שהמודל בונה ספרון קוהרנטי בלי להמציא פרטים שלא נמסרו",
    answers: {
      meeting: { text: "נפגשנו בהפגנה." },
      songs: { list: ["יהיה בסדר - אברהם טל"] },
      willChuppah: { yesno: "yes" },
      vows: {
        bride: {
          a: "אני מבטיחה להיות שם.",
          b: "אני מבטיחה לבחור בך כל יום.",
        },
      },
    },
    checks: {
      include: [],
      exclude: ["חתן"],
      soft: ["יהיה בסדר", "חופה"],
    },
  },
];
