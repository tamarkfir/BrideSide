"use client";

import { useReducer, useState } from "react";
import PageDecorations from "./PageDecorations";
import ScrapbookPage from "./ScrapbookPage";
import CeremonyFlow from "@/components/book/CeremonyFlow";
import PrintScrapbook from "@/components/book/PrintScrapbook";
import { takePhotoPool } from "@/lib/photoStore";
import { QUESTIONNAIRE } from "@/lib/questionnaire";
import { initialState, sessionReducer } from "@/lib/state";

export default function Notebook({ nameA, nameB }: { nameA: string; nameB: string }) {
  const [state, dispatch] = useReducer(
    sessionReducer,
    null,
    () => initialState(nameA, nameB, takePhotoPool())
  );
  const [turning, setTurning] = useState<"out" | "in" | null>(null);
  // קיצור עיצוב: /session?book=sample נפתח ישר בספרון (עם התמונות שהועלו מראש)
  const [mode, setMode] = useState<"edit" | "build">(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("book") === "sample"
      ? "build"
      : "edit"
  );
  const current = state.currentPage;
  const qPage = QUESTIONNAIRE[current];
  const total = QUESTIONNAIRE.length;
  const onLastPage = current === total - 1;

  /** דפדוף עם אנימציית היפוך סביב השדרה */
  function goTo(page: number) {
    if (turning || page < 0 || page >= total || page === current) return;
    setTurning("out");
    window.setTimeout(() => {
      dispatch({ type: "SET_PAGE", page });
      setTurning("in");
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.setTimeout(() => setTurning(null), 500);
    }, 400);
  }

  return (
    <>
      {/* פילטר SVG לקצוות קרועים (deckle) — נצרך ע"י note-card וטיפולי התמונה */}
      <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
        <filter id="deckle-edge">
          <feTurbulence type="fractalNoise" baseFrequency="0.014 0.011" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {mode === "build" ? (
        <CeremonyFlow state={state} onBack={() => setMode("edit")} />
      ) : (
        <>
      <main className="no-print mx-auto max-w-2xl px-6 pb-24 md:px-12">
        <header className="animate-fade-in space-y-3 py-8 text-center">
          <p className="script-accent text-2xl">
            {nameA} &amp; {nameB}
          </p>
          <h1 className="font-heading text-4xl leading-tight text-brand-roseDark md:text-5xl">
            {qPage.title}
          </h1>
          <div
            className="flex flex-wrap justify-center gap-1.5 pt-1"
            aria-label={`עמוד ${current + 1} מתוך ${total}`}
          >
            {QUESTIONNAIRE.map((p, i) => (
              <button
                key={p.key}
                type="button"
                onClick={() => goTo(i)}
                aria-label={p.title}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === current
                    ? "w-5 bg-brand-rose"
                    : i < current
                    ? "w-1.5 bg-brand-rose/40"
                    : "w-1.5 bg-brand-sand/30"
                }`}
              />
            ))}
          </div>
        </header>

        <div className="book-perspective relative">
          <div className="book-shell">
            <div
              className={`book-page paper relative min-h-[34rem] p-6 md:p-8 ${
                turning === "out" ? "page-turn-out" : turning === "in" ? "page-turn-in" : ""
              }`}
            >
              <PageDecorations variant={qPage.group} />
              <div className="relative z-10">
                <ScrapbookPage key={qPage.key} qPage={qPage} pageIndex={current} state={state} dispatch={dispatch} />
              </div>
              <p className="relative z-10 mt-8 text-center font-heading text-sm text-brand-sand">
                — {current + 1} —
              </p>
            </div>
          </div>

          {/* אזורי דפדוף בלחיצה על שולי הדף (ספר עברי: שמאל=הבא, ימין=הקודם) */}
          {current < total - 1 && (
            <button
              type="button"
              aria-label="לעמוד הבא"
              onClick={() => goTo(current + 1)}
              disabled={turning !== null}
              className="group absolute inset-y-0 left-0 z-20 flex w-7 items-center justify-center md:w-9"
            >
              <span className="text-2xl text-brand-rose/0 transition group-hover:text-brand-rose/50">‹</span>
            </button>
          )}
          {current > 0 && (
            <button
              type="button"
              aria-label="לעמוד הקודם"
              onClick={() => goTo(current - 1)}
              disabled={turning !== null}
              className="group absolute inset-y-0 right-0 z-20 flex w-7 items-center justify-center md:w-9"
            >
              <span className="text-2xl text-brand-rose/0 transition group-hover:text-brand-rose/50">›</span>
            </button>
          )}
        </div>

        <nav className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 0 || turning !== null}
            className="chip-organic px-5 py-2 text-base disabled:opacity-30"
          >
            → הקודם
          </button>
          <span className="text-sm text-brand-sand">
            {current + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current === total - 1 || turning !== null}
            className="chip-organic active-gold px-6 py-2 text-base font-medium disabled:opacity-30"
          >
            הבא ←
          </button>
        </nav>

        {onLastPage && (
          <div className="mt-10 animate-fade-in text-center">
            <p className="mb-4 leading-relaxed text-brand-ink/70">
              סיימתן? אפשר תמיד לחזור ולשנות תשובות. כשתהיו מוכנות —
            </p>
            <button
              type="button"
              onClick={() => setMode("build")}
              className="rounded-full bg-brand-rose px-10 py-4 text-lg text-white shadow-sm transition hover:bg-brand-roseDark"
            >
              בנו לנו את הטקס ✦
            </button>
          </div>
        )}
      </main>

      <PrintScrapbook state={state} />
        </>
      )}
    </>
  );
}
