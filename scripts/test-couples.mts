/* ============================================================================
 *  מריץ את מערך זוגות הבדיקה דרך מודל הג'מיני האמיתי, ובודק שהפלט:
 *    1. תקין (מבנה ספרון שלם)
 *    2. מתואם לתשובות (מילים שחייבות/אסור שיופיעו)
 *    3. שונה בין הזוגות (לא תבנית גנרית)
 *
 *  הרצה:
 *    npm run test:couples                 — מייצר רק זוגות שעדיין לא נשמרו (חוסך מכסה)
 *    npm run test:couples -- --force       — מייצר מחדש את כל הזוגות
 *    npm run test:couples -- --check-only  — בודק מחדש את התוצרים השמורים, בלי API
 *
 *  דרישה: GEMINI_API_KEY ב-.env.local
 *  שימי לב: ב-Gemini free tier יש תקרה של ~20 בקשות ליום. כל זוג = 2 בקשות
 *  (יצירה + הגהה), כך שאפשר ~10 זוגות ביום. כשהמכסה היומית מוצתה — הסקריפט
 *  מדלג על יצירה ומשתמש בתוצרים השמורים. הריצי שוב למחרת להשלמת השאר.
 *  פלט: test-output/<id>.json  +  test-output/summary.json  +  דוח לקונסול
 * ========================================================================== */

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";
import { buildCeremonyPrompt, proofreadCeremonyPrompt, SYSTEM_PROMPT } from "../lib/prompts.ts";
import { TEST_COUPLES, buildCoupleState, type CoupleSpec } from "../lib/testCouples.ts";
import type { CeremonyBooklet } from "../lib/types.ts";

const MODEL = "gemini-2.5-flash";
const OUT_DIR = new URL("../test-output/", import.meta.url);

/* ---------- מפתח API מתוך .env.local ---------- */
function loadApiKey(): string {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const m = txt.match(/GEMINI_API_KEY\s*=\s*(.+)/);
  if (!m) throw new Error("GEMINI_API_KEY לא נמצא ב-.env.local");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

/* ---------- חילוץ JSON סלחני ---------- */
function extractJson<T>(text: string): T | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** המכסה החינמית: 5 בקשות לדקה. שומרים מרווח של ~13ש' בין קריאות. */
const MIN_GAP_MS = 13_000;
let lastCall = 0;

async function pace() {
  const wait = lastCall + MIN_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
}

/* ---------- קריאה למודל עם אותה תצורה כמו ה-API route + retry ---------- */
async function callModel(ai: GoogleGenAI, prompt: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    await pace();
    try {
      const res = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
        },
      });
      return res.text ?? "";
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if ((status === 503 || status === 429 || status === 500) && attempt < 4) {
        // 429 (מכסה) דורש המתנה ארוכה; אחרים — backoff קצר
        await sleep(status === 429 ? 25_000 : 1000 * 2 ** attempt);
        continue;
      }
      throw err;
    }
  }
  return "";
}

async function generateBooklet(ai: GoogleGenAI, spec: CoupleSpec): Promise<CeremonyBooklet | null> {
  const state = buildCoupleState(spec);
  const draft = extractJson<CeremonyBooklet>(await callModel(ai, buildCeremonyPrompt(state)));
  if (!draft || !Array.isArray(draft.sections) || draft.sections.length === 0) return null;
  // מעבר הגהה — כמו באפליקציה
  const proofed = extractJson<CeremonyBooklet>(await callModel(ai, proofreadCeremonyPrompt(draft)));
  return proofed && proofed.sections?.length === draft.sections.length ? proofed : draft;
}

/* ---------- כלי טקסט ---------- */
function flatText(b: CeremonyBooklet): string {
  return [
    b.title,
    b.dedication ?? "",
    ...b.sections.flatMap((s) => [s.title, s.body, s.attribution ?? ""]),
  ].join("\n");
}

function wordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-zא-ת]+/)
      .filter((w) => w.length > 2)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter || 1);
}

/**
 * האם המילה מופיעה בטקסט כמילה שלמה (לא כתת-מחרוזת).
 * חשוב ל"חתן" — אחרת "שמחתן" (לשון נקבה תקינה) נספר בטעות.
 * מתיר תחילית אחת (והבכלמש) וסיומת רבים (ים/י).
 */
function mentionsWord(text: string, word: string): boolean {
  const re = new RegExp(`(^|[^א-ת])[והבכלמש]?${word}(ים|י|ות)?($|[^א-ת])`, "u");
  return re.test(text);
}

/* ---------- הרצה ---------- */
async function main() {
  // --check-only: בודק מחדש את התוצרים השמורים, בלי לקרוא ל-API
  // --force: מייצר מחדש את כולם (אחרת מדלג על זוגות שכבר שמורים — חוסך מכסה יומית)
  const checkOnly = process.argv.includes("--check-only");
  const force = process.argv.includes("--force");
  const ai = checkOnly ? null : new GoogleGenAI({ apiKey: loadApiKey() });
  mkdirSync(OUT_DIR, { recursive: true });
  let dailyQuotaHit = false;

  function loadSaved(id: string): CeremonyBooklet | null {
    try {
      return JSON.parse(readFileSync(new URL(`${id}.json`, OUT_DIR), "utf8")) as CeremonyBooklet;
    } catch {
      return null;
    }
  }

  const results: {
    spec: CoupleSpec;
    booklet: CeremonyBooklet | null;
    text: string;
    missing: string[];
    forbidden: string[];
    softHits: string[];
    quotesWithoutAttribution: string[];
  }[] = [];

  for (const spec of TEST_COUPLES) {
    let booklet: CeremonyBooklet | null = null;
    let source: string;
    const saved = loadSaved(spec.id);

    if (checkOnly) {
      booklet = saved;
      source = "🔎 בדיקת שמור";
    } else if (!force && saved) {
      booklet = saved;
      source = "📁 שמור (דילוג על יצירה)";
    } else if (dailyQuotaHit) {
      booklet = saved;
      source = saved ? "📁 שמור (מכסה מוצתה)" : "⏭️ דולג (מכסה מוצתה)";
    } else {
      try {
        booklet = await generateBooklet(ai!, spec);
        source = "⏳ נוצר";
        if (booklet) writeFileSync(new URL(`${spec.id}.json`, OUT_DIR), JSON.stringify(booklet, null, 2), "utf8");
      } catch (err) {
        const msg = (err as Error).message;
        if (/PerDay|RequestsPerDay/.test(msg)) {
          dailyQuotaHit = true;
          console.error("   ⚠ מכסה יומית (20 בקשות) מוצתה — מדלגת על יצירה. נסי שוב מחר, או הפעילי חיוב.");
        } else {
          console.error(`   ✗ שגיאה: ${msg.slice(0, 200)}`);
        }
        booklet = saved;
        source = saved ? "📁 שמור (אחרי כשל)" : "✗ נכשל";
      }
    }
    process.stdout.write(`\n${source} — ${spec.nameA} ו${spec.nameB} (${spec.id})\n`);
    const text = booklet ? flatText(booklet) : "";
    const lower = text.toLowerCase();
    // "חתן" נבדק כמילה שלמה כדי לא לתפוס "שמחתן" (לשון נקבה תקינה); השאר — תת-מחרוזת
    const hit = (k: string) =>
      k === "חתן" ? mentionsWord(text, k) : lower.includes(k.toLowerCase());
    const missing = booklet ? spec.checks.include.filter((k) => !hit(k)) : spec.checks.include;
    const forbidden = booklet ? spec.checks.exclude.filter((k) => hit(k)) : [];
    const softHits = spec.checks.soft.filter((k) => lower.includes(k.toLowerCase()));

    // בדיקת אנטי-הלוצינציה: כל קטע מסוג "quote" חייב attribution
    const quotesWithoutAttribution = booklet
      ? booklet.sections.filter((s) => s.kind === "quote" && !s.attribution).map((s) => s.title || "(ללא כותרת)")
      : [];

    results.push({ spec, booklet, text, missing, forbidden, softHits, quotesWithoutAttribution });
  }

  /* ---------- דוח לכל זוג ---------- */
  console.log("\n\n══════════ דוח קורלציה ══════════");
  let hardFail = 0;
  for (const r of results) {
    const ok = r.booklet && r.missing.length === 0 && r.forbidden.length === 0 && r.quotesWithoutAttribution.length === 0;
    if (!ok) hardFail++;
    console.log(`\n${ok ? "✓" : "✗"} ${r.spec.nameA} ו${r.spec.nameB} — ${r.spec.profile}`);
    if (!r.booklet) {
      console.log("   ✗ לא נוצר ספרון");
      continue;
    }
    console.log(`   קטעים: ${r.booklet.sections.length} · כותרת: "${r.booklet.title}"`);
    console.log(`   חובה שיופיע:  ${r.missing.length ? "חסר → " + r.missing.join(", ") : "✓ הכול נמצא"}`);
    console.log(`   אסור שיופיע:  ${r.forbidden.length ? "הופיע! → " + r.forbidden.join(", ") : "✓ נקי"}`);
    console.log(`   ציטוטים ללא attribution: ${r.quotesWithoutAttribution.length ? "⚠ → " + r.quotesWithoutAttribution.join(", ") : "✓ כולם מצוינים"}`);
    console.log(`   אינדיקציות (רך): ${r.softHits.length ? r.softHits.join(", ") : "—"}`);
  }

  /* ---------- בידול בין הזוגות ---------- */
  console.log("\n\n══════════ בידול בין הזוגות (Jaccard, נמוך = שונה) ══════════");
  const present = results.filter((r) => r.booklet);
  let diffWarn = 0;
  for (let i = 0; i < present.length; i++) {
    for (let j = i + 1; j < present.length; j++) {
      const sim = jaccard(wordSet(present[i].text), wordSet(present[j].text));
      const flag = sim > 0.5;
      if (flag) diffWarn++;
      console.log(
        `   ${present[i].spec.id} ↔ ${present[j].spec.id}: ${sim.toFixed(2)} ${flag ? "⚠ דומה מדי" : "✓"}`
      );
    }
  }

  /* ---------- דליפה צולבת של אינדיקציות ייחודיות ---------- */
  console.log("\n══════════ דליפת מילות-מפתח ייחודיות בין זוגות ══════════");
  const unique: Record<string, string[]> = {
    "shira-michal": ["שלום עלינו"],
    "dana-yael": ["bright eyes", "ben folds"],
    "avigail-roni": ["ארגוב", "ערבית"],
    "tal-mary": ["נוצרי", "ave maria"],
    "eden-shahar": ["true colors", "שבחרנו"],
    "libi-rotem": ["יהיה בסדר"],
  };
  let leaks = 0;
  for (const r of present) {
    const mine = unique[r.spec.id] ?? [];
    for (const other of present) {
      if (other.spec.id === r.spec.id) continue;
      const leaked = mine.filter((k) => other.text.toLowerCase().includes(k.toLowerCase()));
      if (leaked.length) {
        leaks++;
        console.log(`   ⚠ "${leaked.join(", ")}" של ${r.spec.id} הופיע אצל ${other.spec.id}`);
      }
    }
  }
  if (!leaks) console.log("   ✓ אין דליפה — מילות המפתח נשארו אצל הזוג הנכון");

  /* ---------- סיכום ---------- */
  const summary = {
    ranAt: new Date().toISOString(),
    couples: results.map((r) => ({
      id: r.spec.id,
      generated: !!r.booklet,
      sections: r.booklet?.sections.length ?? 0,
      missing: r.missing,
      forbidden: r.forbidden,
      softHits: r.softHits,
      quotesWithoutAttribution: r.quotesWithoutAttribution,
    })),
    hardFail,
    diffWarn,
    leaks,
  };
  writeFileSync(new URL("summary.json", OUT_DIR), JSON.stringify(summary, null, 2), "utf8");

  console.log("\n\n══════════ סיכום ══════════");
  console.log(`   זוגות שנכשלו בבדיקה קשה: ${hardFail}/${results.length}`);
  console.log(`   זוגות דומים מדי: ${diffWarn}`);
  console.log(`   דליפות מילות-מפתח: ${leaks}`);
  console.log(`   תוצרים נשמרו ב: test-output/`);
  process.exit(hardFail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
