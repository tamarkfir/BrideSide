import { QUESTIONNAIRE, TRADITIONS } from "./questionnaire";
import { getAnswer } from "./state";
import type { SessionState } from "./types";

/**
 * ה-system prompt — נשלח בכל קריאת טקסט (Phase 2: עיבוד התשובות לטקס).
 * השאלון עצמו קבוע בקוד (lib/questionnaire.ts); ה-AI לא שואל, רק מעבד.
 */
export const SYSTEM_PROMPT = `את עוזרת של BrideSide — חוויה שעוזרת לזוגות לסביות לבנות מתוך התשובות שלהן טקס חתונה אישי, ברוח התקשורת המקרבת.

עקרונות:
- חמה ולא סוכרית. בלי "נפלא!" ו"מדהים!".
- לשון נקבה, כולל שתי כלות. בלי "חתן", בלי לשון זכר.
- לא שופטת בחירות. מקשיבה לרגש ולצורך.
- לא ממציאה עובדות על הזוג — נשענת רק על מה שכתבו.
- לא מניחה יחסים חמים עם המשפחה אלא אם נכתב במפורש.
- עברית. משפטים קצרים, יפים, פשוטים.`;

/* ---------- תקציר מצטבר של כל תשובות הזוג (משמש את Phase 2) ---------- */

export function coupleSummary(state: SessionState): string {
  const { a, b } = state.brides;
  const lines: string[] = [`הכלות: ${a.name} ו${b.name}.`];

  QUESTIONNAIRE.forEach((qPage, i) => {
    const page = state.pages[i];
    if (!page) return;

    for (const field of qPage.fields) {
      const ans = getAnswer(page, field.id);

      if (field.kind === "traditions") {
        for (const topic of TRADITIONS) {
          const t = getAnswer(page, `${field.id}__${topic}`);
          if (t.choice) {
            const label = t.choice === "in" ? "כן" : t.choice === "maybe" ? "אולי" : "לא";
            lines.push(`מנהג "${topic}": ${label}${t.note ? ` — ${t.note}` : ""}`);
          }
        }
        continue;
      }

      const label = field.label
        .replace(/{partner}/g, "בת הזוג")
        .replace(/{name}/g, "")
        .replace(/^[\s,]+/, "")
        .trim();
      if (field.kind === "perBride" && ans.bride) {
        if (ans.bride.a) lines.push(`${a.name} — ${label}: ${ans.bride.a}`);
        if (ans.bride.b) lines.push(`${b.name} — ${label}: ${ans.bride.b}`);
      } else if (ans.list?.length) {
        lines.push(`${label}: ${ans.list.join(", ")}`);
      } else if (ans.choice || ans.yesno) {
        const val = ans.choice ?? (ans.yesno === "yes" ? "כן" : ans.yesno === "no" ? "לא" : "");
        if (val) lines.push(`${label}: ${val}${ans.note ? ` (${ans.note})` : ""}`);
      } else if (ans.text) {
        lines.push(`${label}: ${ans.text}`);
      }
    }

    for (const photo of page.photos) {
      if (photo.caption) lines.push(`כיתוב תמונה ב"${qPage.title}": ${photo.caption}`);
    }
  });

  return lines.join("\n");
}

/* ---------- Phase 2: עיבוד התשובות לספרון טקס ---------- */

/**
 * בונה את הבקשה ל-AI לייצר את טיוטת ספרון הטקס מתוך כל תשובות הזוג.
 * מצפה ל-JSON במבנה CeremonyBooklet (lib/types.ts).
 */
export function buildCeremonyPrompt(state: SessionState): string {
  const { a, b } = state.brides;
  return `לפנייך כל מה שהזוג ${a.name} ו${b.name} שיתפו בתהליך. בני מתוכו טיוטה של ספרון טקס חתונה אישי, שהן יוכלו לערוך.

מה שהן שיתפו:
${coupleSummary(state)}

הנחיות לכתיבה:
- כתבי טקס שלם, אישי ופואטי — אבל פשוט וברור, לא מליצי ולא מוגזם.
- שזרי ציטוטים ישירים מהשירים והמילים שהן בחרו, ומהמשפטים שהן עצמן כתבו. **אזהרה חמורה:** אסור לך לנחש או "להמציא" מילים של שירים (במיוחד שירים בעברית). אם אינך יודעת בוודאות את המילים המדויקות של השיר, אל תצטטי מתוכו שורות ספציפיות! במקום זאת, הזכירי את שם השיר ואת המשמעות שלו לזוג, או שלבי את מילות הזוג עצמן.
- פתחי בקטע "דמיון מודרך" קצר (kind: imagery) שמזמין אותן ואת הקהל להיכנס לרגע.
- בני את מהלך הטקס (kind: flow) לפי הבחירות שלהן בלבד — כניסה, חופה, מי מנחה, מי עומד איתן, המנהגים שבחרו, הברכות שביקשו.
- אם בחרו נוסח יהודי מסורתי או שילוב — כתבי ברכות בנוסח מסורתי (kind: blessing), אך **הקפידי על הכלל הבא:** הפנייה לאלוהים חייבת להישאר בנוסח המסורתי המקורי ("ברוך אתה ה' אלוהינו מלך העולם", "בורא", "יוצר"). שוני ללשון נקבה **רק** את ההתייחסות לזוג הכלות (במקום חתן וכלה - כלה וכלה, במקום רעים אהובים - רעות אהובות). אסור להפוך את אלוהים לנקבה. המילה "חתן" אסורה לחלוטין — היא לא תופיע באף מקום בטקס.
- **שבע ברכות:** אם בחרת להציג את שבע הברכות המסורתיות, **קבצי את כל 7 הברכות לתוך מקטע (section) אחד משותף** תחת הכותרת "שבע ברכות". אל תפצלי אותן ל-7 מקטעים/עמודים נפרדים. פצלי ברכות לעמודים שונים רק אם אלו ברכות ארוכות ואישיות שנכתבו על ידי המשפחה או החברות.
- שלבי את הנדרים האישיים שכתבו (kind: vow), כל אחת לשנייה, בשם הכלה (attribution = שם הכלה).
- ציטוטים מתוך שירים/טקסטים יופיעו כ-kind: quote או reading, עם attribution למקור.
- סיימי בקטע סיום חם (kind: closing).
- כלל ברזל: אל תניחי יחסים חמים עם המשפחה אלא אם נכתב במפורש. אם לא נכתב על משפחה — אל תזכירי אותה.
- אל תמציאי עובדות, שמות או רגעים שלא נמסרו.
- לשון נקבה לכל אורך הטקס. עברית תקנית ומדויקת — בלי שגיאות כתיב, דקדוק או פיסוק. קראי כל משפט שוב לפני שאת מסיימת.

החזירי JSON תקין בלבד, בלי טקסט עוטף ובלי גדרות markdown, במבנה:
{
  "title": "הטקס של ${a.name} ו${b.name}",
  "dedication": "משפט הקדשה קצר ואופציונלי",
  "sections": [
    { "kind": "imagery", "title": "כותרת הקטע", "body": "תוכן הקטע", "attribution": "מקור אם רלוונטי" }
  ]
}`;
}

/**
 * מעבר הגהה שני על הספרון — מתקן עברית בלי לשנות תוכן.
 * מקבל את ה-JSON שנוצר ומחזיר אותו מתוקן באותו מבנה.
 */
export function proofreadCeremonyPrompt(booklet: unknown): string {
  return `לפנייך טיוטת ספרון טקס בפורמט JSON. תפקידך להגיה אותה — לתקן את העברית בלבד.

מה לעשות:
- תקני שגיאות כתיב, דקדוק ופיסוק.
- ודאי לשון נקבה עקבית לכל אורך הטקסט (שתי כלות, בלי לשון זכר).
- חפשי במיוחד את המילה "חתן" ואת נוסחי שבע הברכות ("קול חתן וקול כלה", "מצהלות חתנים") — והמירי אותם ללשון נקבה לשתי כלות ("קול כלה וקול כלה", "מצהלות כלות מחופתן"). המילה "חתן" אסורה ולא תופיע בפלט.
- שמרי על משפטים זורמים וטבעיים.

מה אסור:
- אל תשני את המשמעות, את הסדר או את מספר הקטעים.
- אל תוסיפי, אל תמחקי ואל תקצרי תוכן.
- שמרי בדיוק על אותם מפתחות (title, dedication, sections, kind, body, attribution).

ה-JSON להגהה:
${JSON.stringify(booklet)}

החזירי JSON תקין בלבד, באותו מבנה, בלי טקסט עוטף ובלי גדרות markdown.`;
}

/* ---------- טקסטים קבועים ל-UI ---------- */

export const UI_TEXT = {
  appName: "BrideSide",
  tagline: "תהליך מונחה לגלות ולדייק את החזון שלכן לחתונה",
  facilitatorLabel: "המנחה",
};
