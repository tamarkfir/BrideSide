export type BrideKey = "a" | "b";

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type BrideData = {
  name: string;
};

/* ---------- תמונות ---------- */

/**
 * סגנון התמונה בעמוד — נקבע אוטומטית:
 * deckle — מסגרת לבנה קרועה; bw — שחור-לבן; duotone — גוון כפול; cutout — גזורה.
 */
export type PhotoTreatment = "deckle" | "bw" | "duotone" | "cutout";

export type PhotoItem = {
  id: string;
  dataUrl: string;
  /** גרסה שה-AI ערך (Phase 2). גובר על dataUrl בתצוגה אם קיים */
  editedUrl?: string;
  caption: string;
  treatment: PhotoTreatment;
  /** סיבוב עדין למראה סקראפבוק (מעלות) */
  rotation: number;
};

/* ---------- תשובות השאלון ---------- */

/**
 * ערך תשובה גמיש — שדה אחד משתמש רק בחלק מהמפתחות, לפי סוג השאלה:
 * text/longtext → text · perBride → bride · chips/songs → list ·
 * choice → choice (+note) · yesno → yesno (+note) · traditions → נשמר לכל מנהג בנפרד
 */
export type Answer = {
  text?: string;
  bride?: { a: string; b: string };
  list?: string[];
  choice?: string;
  yesno?: "" | "yes" | "no";
  note?: string;
};

/** מצב עמוד בודד בשאלון — התשובות לפי מזהה שדה, והתמונות שצורפו */
export type QPageState = {
  key: string;
  answers: Record<string, Answer>;
  photos: PhotoItem[];
};

export type SessionState = {
  brides: { a: BrideData; b: BrideData };
  /** האינדקס של העמוד הפעיל */
  currentPage: number;
  pages: QPageState[];
};

/* ---------- ספרון הטקס (Phase 2 — תוצר עיבוד ה-AI) ---------- */

/**
 * סוג קטע בטקס:
 * imagery — דמיון מודרך · flow — מהלך/הנחיה · quote — ציטוט · reading — קטע קריאה ·
 * vow — נדר אישי · blessing — ברכה (נוסח מסורתי בלשון נקבה) · closing — סיום.
 */
export type CeremonySectionKind =
  | "imagery"
  | "flow"
  | "quote"
  | "reading"
  | "vow"
  | "blessing"
  | "closing";

export type CeremonySection = {
  id: string;
  kind: CeremonySectionKind;
  title: string;
  body: string;
  /** מקור הציטוט / שם השיר / שם הכלה — אם רלוונטי */
  attribution?: string;
};

export type CeremonyBooklet = {
  title: string;
  dedication?: string;
  sections: CeremonySection[];
};
