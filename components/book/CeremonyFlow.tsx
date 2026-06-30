"use client";

import { useEffect, useRef, useState } from "react";
import CeremonyBooklet from "./CeremonyBooklet";
import { askAIJson, askAIWithSearch, extractJson } from "@/lib/ai";
import { buildCeremonyPrompt, buildSongResearchPrompt, proofreadCeremonyPrompt, type VerifiedSong } from "@/lib/prompts";
import { makeSampleBooklet } from "@/lib/sampleBooklet";
import { makeId } from "@/lib/state";
import type { CeremonyBooklet as Booklet, CeremonySection, SessionState } from "@/lib/types";

type Status = "loading" | "searching" | "ready" | "error";

/** מנרמל את ה-JSON מהמודל למבנה בטוח עם מזהים */
function normalize(raw: Partial<Booklet> | null, state: SessionState): Booklet | null {
  if (!raw || !Array.isArray(raw.sections) || raw.sections.length === 0) return null;
  const { a, b } = state.brides;
  return {
    title: raw.title || `הטקס של ${a.name} ו${b.name}`,
    dedication: raw.dedication ?? "",
    sections: raw.sections
      .filter((s): s is CeremonySection => !!s && typeof s.body === "string")
      .map((s) => ({
        id: makeId("sec"),
        kind: s.kind ?? "flow",
        title: s.title ?? "",
        body: s.body ?? "",
        ...(s.attribution ? { attribution: s.attribution } : {}),
      })),
  };
}

export default function CeremonyFlow({ state, onBack }: { state: SessionState; onBack: () => void }) {
  const [status, setStatus] = useState<Status>("loading");
  const [booklet, setBooklet] = useState<Booklet | null>(null);
  const started = useRef(false);

  /** טוען ספרון לדוגמה — לעבודת עיצוב בלי לקרוא ל-AI */
  function loadSample() {
    setBooklet(makeSampleBooklet(state));
    setStatus("ready");
  }

  async function generate() {
    // שלב 1: מחקר שירים עם חיפוש רשת (plain text + googleSearch)
    setStatus("searching");
    const research = await askAIWithSearch(buildSongResearchPrompt(state), 2048);
    const songData = research ? extractJson<{ songs: VerifiedSong[] }>(research.text) : null;
    // רשת ביטחון דו-שלבית נגד ציטוטים מומצאים:
    // 1. grounded=false → חיפוש לא ירה באמת; המודל עלול להמציא excerpt + source. פוסלים הכול.
    // 2. גם כשירה — דורשים source שהוא URL אמיתי. בלעדיו → אזכור בשם בלבד.
    const grounded = research?.grounded === true;
    // ציטוט מאומת רק אם עבר את כל הבדיקות: grounding אמיתי + source URL + excerpt.
    // אחרת מאפסים את ה-excerpt (אין מילים) ומחליטים לפי סוג השיר:
    const verifiedSongs = (songData?.songs ?? [])
      .map((s) => {
        const hasSource = typeof s.source === "string" && /^https?:\/\//.test(s.source);
        const verified = grounded && hasSource && !!s.excerpt;
        return verified ? s : { ...s, excerpt: null };
      })
      // הצעה של Gemini בלי מילים מאומתות — נמחקת לגמרי (אין טעם בהמלצה בלי ציטוט).
      // שיר שהזוג בחרו — נשאר גם בלי מילים (אזכור בשם ובמשמעות בלבד).
      .filter((s) => s.excerpt || !s.suggested);

    // שלב 2: בניית הטקס עם השירים המאומתים (JSON mode, ללא googleSearch)
    setStatus("loading");
    const raw = await askAIJson<Partial<Booklet>>(buildCeremonyPrompt(state, verifiedSongs), [], 8192);
    const result = normalize(raw, state);
    if (!result) {
      setStatus("error");
      return;
    }

    // מעבר הגהה שני — מתקן עברית בלי לשנות תוכן. best-effort: אם נכשל, משאירים את הטיוטה.
    const proofed = normalize(
      await askAIJson<Partial<Booklet>>(proofreadCeremonyPrompt(result), [], 8192),
      state
    );
    const final =
      proofed && proofed.sections.length === result.sections.length ? proofed : result;

    setBooklet(final);
    setStatus("ready");
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // קיצור לעבודת עיצוב: /session?book=sample פותח ישר ספרון לדוגמה (בלי AI)
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("book") === "sample") {
      loadSample();
      return;
    }
    void generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "ready" && booklet) {
    return (
      <CeremonyBooklet
        booklet={booklet}
        state={state}
        onChange={setBooklet}
        onBack={onBack}
      />
    );
  }

  return (
    <main className="no-print mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      {status === "searching" ? (
        <>
          <div className="mb-8 h-12 w-12 animate-spin rounded-full border-2 border-brand-sage/30 border-t-brand-sage" />
          <h1 className="mb-3 font-heading text-3xl text-brand-roseDark">מחפשת שירים מתאימים…</h1>
          <p className="leading-relaxed text-brand-ink/70">
            מאמתת את מילות השירים שבחרתן ומחפשת שירים שמתאימים במיוחד לכן.
          </p>
        </>
      ) : status === "loading" ? (
        <>
          <div className="mb-8 h-12 w-12 animate-spin rounded-full border-2 border-brand-rose/30 border-t-brand-rose" />
          <h1 className="mb-3 font-heading text-3xl text-brand-roseDark">אורגת את הטקס שלכן…</h1>
          <p className="leading-relaxed text-brand-ink/70">
            לוקחת את כל מה ששיתפתן — המילים, השירים, הרגעים — ובונה מהם טיוטה ראשונה.
            זה לוקח רגע.
          </p>
        </>
      ) : (
        <>
          <h1 className="mb-3 font-heading text-3xl text-brand-roseDark">משהו השתבש</h1>
          <p className="mb-8 leading-relaxed text-brand-ink/70">
            לא הצלחתי לבנות את הספרון כרגע (כנראה הגעתן למכסת הבקשות היומית של המודל).
            אפשר לנסות שוב מאוחר יותר, לחזור ולהשלים תשובות, או לראות דוגמת עיצוב לספרון.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void generate()}
              className="rounded-full bg-brand-rose px-8 py-3 text-base text-white shadow-sm transition hover:bg-brand-roseDark"
            >
              לנסות שוב
            </button>
            <button
              type="button"
              onClick={loadSample}
              className="rounded-full border border-brand-rose/40 px-6 py-3 text-base text-brand-roseDark transition hover:bg-brand-rose/5"
            >
              דוגמת עיצוב לספרון
            </button>
            <button
              type="button"
              onClick={onBack}
              className="rounded-full border border-brand-rose/40 px-6 py-3 text-base text-brand-roseDark transition hover:bg-brand-rose/5"
            >
              → חזרה לתשובות
            </button>
          </div>
        </>
      )}
    </main>
  );
}
